import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, RefreshCw, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Users tab
 *   • How many customers have accounts, are signed in, and are using
 *     the app right now.
 *   • Block a suspicious account (signed out at once, can be undone)
 *     or terminate it permanently (can never sign in or sign up again
 *     with the same phone / email).
 */

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online now' },
  { id: 'signedIn', label: 'Signed in' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'terminated', label: 'Terminated' },
];

function timeAgo(iso) {
  if (!iso) return 'never';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatCard({ label, value, tone = 'bg-white border-gray-100', hint }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <p className="text-xs font-black text-gray-500">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function UsersManager() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getUsers();
      setAccounts(res.data || []);
      setSummary(res.summary || null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not load users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Keep the "online now" numbers fresh.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();

    return accounts.filter((a) => {
      if (filter === 'online' && !a.isOnline) return false;
      if (filter === 'signedIn' && !a.isSignedIn) return false;
      if (filter === 'blocked' && !(a.isBlocked && !a.isTerminated)) return false;
      if (filter === 'terminated' && !a.isTerminated) return false;
      if (filter !== 'terminated' && filter !== 'all' && a.isTerminated) return false;

      if (!q) return true;
      return [a.name, a.phone, a.email, a.hostel, a.roomNumber]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [accounts, filter, query]);

  const toggleBlock = async (account) => {
    const blocking = !account.isBlocked;
    let reason = '';

    if (blocking) {
      const answer = window.prompt(
        `Block ${account.name} (${account.phone})?\n\nThey will be signed out now and can't sign in until you unblock them.\n\nReason (optional):`,
        ''
      );
      if (answer === null) return;
      reason = answer;
    } else if (!window.confirm(`Unblock ${account.name}? They will be able to sign in again.`)) {
      return;
    }

    setWorkingId(account.id);
    setMessage(null);
    try {
      const res = await api.setUserBlocked(account.id, blocking, reason);
      setMessage({ type: 'success', text: res.message || 'Saved.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not update the account.' });
    } finally {
      setWorkingId(null);
    }
  };

  const terminate = async (account) => {
    const answer = window.prompt(
      `PERMANENTLY remove ${account.name} (${account.phone}) from Bhook_Lgi?\n\n` +
        'They will be signed out, can never sign in again, and this phone / email cannot create a new account. This cannot be undone.\n\n' +
        'Type a reason to confirm:',
      ''
    );

    if (answer === null) return;

    if (!answer.trim()) {
      setMessage({ type: 'error', text: 'Please type a reason to terminate an account.' });
      return;
    }

    setWorkingId(account.id);
    setMessage(null);
    try {
      const res = await api.terminateUser(account.id, answer.trim());
      setMessage({ type: 'success', text: res.message || 'Account terminated.' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not terminate the account.' });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Users size={22} /> Users
          </h2>
          <p className="text-sm text-gray-500">
            See who is signed in to Bhook_Lgi and block or remove suspicious accounts.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 font-bold text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="ONLINE NOW"
            value={summary.onlineNow}
            tone="bg-green-50 border-green-100"
            hint={`Used the app in the last ${summary.onlineMinutes} min`}
          />
          <StatCard
            label="SIGNED IN"
            value={summary.signedIn}
            tone="bg-brand-yellow border-yellow-300"
            hint="Logged in on a device"
          />
          <StatCard label="CUSTOMER ACCOUNTS" value={summary.totalCustomers} />
          <StatCard label="BLOCKED" value={summary.blocked} tone="bg-orange-50 border-orange-100" />
          <StatCard label="TERMINATED" value={summary.terminated} tone="bg-red-50 border-red-100" />
        </div>
      )}

      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email or hostel"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${
                filter === f.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && accounts.length === 0 ? (
        <div className="bg-white rounded-3xl border p-10 text-center">Loading users...</div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-3xl border p-10 text-center text-sm text-gray-500">
          No accounts here.
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((account) => {
            const isCustomer = account.role === 'CUSTOMER';
            const working = workingId === account.id;

            return (
              <div
                key={account.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  account.isTerminated ? 'opacity-60 border-red-100' : 'border-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        account.isOnline ? 'bg-green-500' : account.isSignedIn ? 'bg-yellow-400' : 'bg-gray-300'
                      }`}
                      title={account.isOnline ? 'Online now' : account.isSignedIn ? 'Signed in' : 'Signed out'}
                    />
                    <span className="font-black truncate">{account.name}</span>
                    {!isCustomer && (
                      <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-black">
                        {account.role}
                      </span>
                    )}
                    {account.isTerminated ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                        TERMINATED
                      </span>
                    ) : account.isBlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black">
                        BLOCKED
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-gray-500 mt-1 break-all">
                    📞 {account.phone}
                    {account.email ? ` · ✉️ ${account.email}` : ''}
                    {account.hostel ? ` · ${account.hostel}, Room ${account.roomNumber || '-'}` : ''}
                  </p>

                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {account.isOnline ? 'Online now' : `Last active ${timeAgo(account.lastSeenAt)}`}
                    {' · '}
                    {account.orders} order{account.orders === 1 ? '' : 's'}
                    {account.cancelledOrders > 0 ? ` (${account.cancelledOrders} cancelled)` : ''}
                    {' · joined '}
                    {account.createdAt ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </p>

                  {account.blockedReason && (account.isBlocked || account.isTerminated) && (
                    <p className="text-[11px] text-red-600 mt-0.5">Reason: {account.blockedReason}</p>
                  )}
                </div>

                {isCustomer && !account.isTerminated && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={working}
                      onClick={() => toggleBlock(account)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black disabled:opacity-50 ${
                        account.isBlocked ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {account.isBlocked ? <ShieldCheck size={14} /> : <Ban size={14} />}
                      {account.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      disabled={working}
                      onClick={() => terminate(account)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-red-50 text-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Terminate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
