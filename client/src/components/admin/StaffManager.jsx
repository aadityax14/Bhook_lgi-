import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bike, ChefHat, KeyRound, RefreshCw, UserCheck, UserX, X } from 'lucide-react';
import { api } from '../../services/api';
import { HOSTELS } from '../../utils/fees';

/*
 * Admin → Staff tab
 *   1. Today's duty: pick which chefs / delivery partners work today.
 *   2. Applications: approve or reject (approval creates a Login ID).
 *   3. Staff accounts: Login IDs, reset password, enable / disable.
 *
 * Passwords are never shown: applicants choose their own. A reset
 * creates a temporary password that is shown here ONCE.
 */

const roleLabel = (role) =>
  String(role).toLowerCase() === 'chef' ? '👨‍🍳 Chef' : '🛵 Delivery';

function SecretBox({ secret, onClose }) {
  if (!secret) return null;

  return (
    <div className="rounded-2xl border-2 border-brand-yellow bg-brand-yellow/10 p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm font-black">{secret.title}</p>
      <div className="mt-2 grid gap-1 text-sm">
        <p>Login ID: <span className="font-mono font-black">{secret.loginId}</span></p>
        {secret.tempPassword && (
          <p>
            Temporary password:{' '}
            <span className="font-mono font-black select-all bg-white px-2 py-0.5 rounded">
              {secret.tempPassword}
            </span>
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {secret.tempPassword
          ? "Give this to them privately (in person or a direct message). It is shown only now, and they'll be asked to set their own password when they log in."
          : 'They log in with this Login ID and the password they chose on the application form.'}
      </p>
    </div>
  );
}

export default function StaffManager() {
  const [applications, setApplications] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [today, setToday] = useState('');
  const [dutySelection, setDutySelection] = useState(new Set());
  const [dutyDirty, setDutyDirty] = useState(false);

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [savingDuty, setSavingDuty] = useState(false);
  const [message, setMessage] = useState(null);
  const [secret, setSecret] = useState(null);

  const load = useCallback(async () => {
    try {
      const [appsRes, accountsRes] = await Promise.all([
        api.getStaffApplications(),
        api.getStaffAccounts(),
      ]);

      setApplications(appsRes.data || []);
      setAccounts(accountsRes.data || []);
      setToday(accountsRes.date || '');
      setDutySelection(
        new Set((accountsRes.data || []).filter(a => a.on_duty_today).map(a => a.id))
      );
      setDutyDirty(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not load staff.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () => applications.filter(a => a.status === 'pending'),
    [applications]
  );

  const activeAccounts = accounts.filter(a => a.is_active);
  const chefs = activeAccounts.filter(a => a.role === 'CHEF');
  const riders = activeAccounts.filter(a => a.role === 'DELIVERY');

  const decide = async (application, decision) => {
    setWorkingId(application.id);
    setMessage(null);
    try {
      const res = await api.decideStaffApplication(application.id, decision);

      if (decision === 'approved') {
        setSecret({
          title: `${application.full_name} approved ✓`,
          loginId: res.data?.loginId,
          tempPassword: res.data?.tempPassword || null,
        });
      } else {
        setMessage({ type: 'success', text: `${application.full_name}'s application rejected.` });
      }

      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not update application.' });
    } finally {
      setWorkingId(null);
    }
  };

  const resetPassword = async (account) => {
    setWorkingId(account.id);
    setMessage(null);
    try {
      const res = await api.resetStaffPassword(account.id);
      setSecret({
        title: `New temporary password for ${account.full_name}`,
        loginId: account.login_id,
        tempPassword: res.data?.tempPassword,
      });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not reset password.' });
    } finally {
      setWorkingId(null);
    }
  };

  const toggleActive = async (account) => {
    setWorkingId(account.id);
    setMessage(null);
    try {
      await api.setStaffActive(account.id, !account.is_active);
      setMessage({
        type: 'success',
        text: `${account.full_name} ${account.is_active ? 'disabled' : 'enabled'}.`,
      });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not update account.' });
    } finally {
      setWorkingId(null);
    }
  };

  const changeHostel = async (account, hostel) => {
    if (!hostel) return;
    setWorkingId(account.id);
    setMessage(null);
    try {
      await api.setStaffHostel(account.id, hostel);
      setMessage({ type: 'success', text: `${account.full_name}'s hostel set to ${hostel}.` });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not update hostel.' });
    } finally {
      setWorkingId(null);
    }
  };

  const toggleDuty = (id) => {
    setDutySelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDutyDirty(true);
  };

  const saveDuty = async () => {
    setSavingDuty(true);
    setMessage(null);
    try {
      await api.setTodayDuty([...dutySelection]);
      setMessage({ type: 'success', text: "Today's duty list saved ✓" });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not save duty list.' });
    } finally {
      setSavingDuty(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm font-semibold text-gray-500">Loading staff…</p>;
  }

  const DutyGroup = ({ title, icon: Icon, people }) => (
    <div className="rounded-2xl bg-white border border-gray-100 p-4">
      <p className="flex items-center gap-2 font-black text-sm">
        <Icon className="w-4 h-4" /> {title}
        <span className="text-xs font-bold text-gray-400">
          {people.filter(p => dutySelection.has(p.id)).length} / {people.length} on duty
        </span>
      </p>

      {people.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">No approved staff yet.</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {people.map(person => (
            <label
              key={person.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${
                dutySelection.has(person.id)
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={dutySelection.has(person.id)}
                onChange={() => toggleDuty(person.id)}
                className="w-4 h-4"
              />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">{person.full_name}</span>
                <span className="block text-xs font-mono text-gray-500">
                  {person.login_id} · {person.hostel || 'hostel not set'}
                </span>
              </span>
              {dutySelection.has(person.id) && (
                <span className="text-[10px] font-black text-emerald-700">ON DUTY</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Staff</h2>
          <p className="text-sm text-gray-500">
            Choose who works today, approve applications and manage logins.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm font-semibold ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <SecretBox secret={secret} onClose={() => setSecret(null)} />

      {/* ================= TODAY'S DUTY ================= */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-black">
            Today's duty {today && <span className="text-sm font-bold text-gray-400">({today})</span>}
          </h3>
          <button
            onClick={saveDuty}
            disabled={!dutyDirty || savingDuty}
            className="rounded-xl bg-brand-yellow px-4 py-2 text-sm font-black disabled:opacity-40"
          >
            {savingDuty ? 'Saving…' : 'Save duty list'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Only people ticked here can open the chef or delivery panel today.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <DutyGroup title="Kitchen" icon={ChefHat} people={chefs} />
          <DutyGroup title="Delivery" icon={Bike} people={riders} />
        </div>
      </section>

      {/* ================= APPLICATIONS ================= */}
      <section className="space-y-3">
        <h3 className="text-lg font-black">
          Pending applications <span className="text-sm font-bold text-gray-400">({pending.length})</span>
        </h3>

        {pending.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">
            No pending applications.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pending.map(item => (
              <div key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex justify-between gap-3">
                  <div>
                    <h4 className="text-base font-black">{item.full_name}</h4>
                    <p className="text-sm text-gray-500">{roleLabel(item.role)}</p>
                  </div>
                  <span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase">
                    pending
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <p><b>Mobile:</b> {item.mobile}</p>
                  <p><b>Email:</b> {item.email}</p>
                  <p><b>Student ID:</b> {item.student_id}</p>
                  <p><b>Hostel:</b> {item.hostel || '—'}</p>
                  <p><b>Available:</b> {item.days_per_week} days/week</p>
                  <p><b>Applied:</b> {new Date(item.created_at).toLocaleString('en-IN')}</p>
                </div>

                {!item.has_password && (
                  <p className="mt-3 rounded-xl bg-gray-50 p-2 text-xs text-gray-600">
                    Applied before passwords were added — approving creates a temporary
                    password for you to give them.
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    disabled={workingId === item.id}
                    onClick={() => decide(item, 'approved')}
                    className="flex-1 rounded-xl bg-green-600 py-2.5 font-bold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={workingId === item.id}
                    onClick={() => decide(item, 'rejected')}
                    className="flex-1 rounded-xl bg-red-50 py-2.5 font-bold text-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= STAFF ACCOUNTS ================= */}
      <section className="space-y-3">
        <h3 className="text-lg font-black">
          Staff logins <span className="text-sm font-bold text-gray-400">({accounts.length})</span>
        </h3>

        {accounts.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">
            Approve an application to create the first staff login.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Login ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Hostel</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Earnings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id} className="border-t">
                    <td className="px-4 py-3 font-mono font-black">{account.login_id}</td>
                    <td className="px-4 py-3 font-bold">{account.full_name}</td>
                    <td className="px-4 py-3">{roleLabel(account.role)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={account.hostel || ''}
                        disabled={workingId === account.id}
                        onChange={(e) => changeHostel(account, e.target.value)}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                          account.hostel ? 'bg-white' : 'bg-amber-50 border-amber-200'
                        }`}
                        aria-label={`Hostel of ${account.full_name}`}
                      >
                        <option value="">Set hostel</option>
                        {[...new Set([...HOSTELS, ...(account.hostel ? [account.hostel] : [])])].map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">{account.mobile}</td>
                    <td className="px-4 py-3">
                      {account.role === 'DELIVERY' && account.earnings ? (
                        <span className="text-xs">
                          <b>₹{account.earnings.todayEarnings}</b> today
                          <span className="block text-gray-500">
                            ₹{account.earnings.totalEarnings} total · {account.earnings.totalDeliveries} deliveries
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!account.is_active ? (
                        <span className="text-xs font-black text-red-600">DISABLED</span>
                      ) : account.must_change_password ? (
                        <span className="text-xs font-black text-amber-600">TEMP PASSWORD</span>
                      ) : (
                        <span className="text-xs font-black text-emerald-700">ACTIVE</span>
                      )}
                      {account.on_duty_today && (
                        <span className="ml-2 text-[10px] font-black text-emerald-700">· ON DUTY</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={workingId === account.id}
                          onClick={() => resetPassword(account)}
                          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"
                          title="Create a new temporary password"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> Reset password
                        </button>
                        <button
                          disabled={workingId === account.id}
                          onClick={() => toggleActive(account)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 ${
                            account.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {account.is_active ? (
                            <><UserX className="w-3.5 h-3.5" /> Disable</>
                          ) : (
                            <><UserCheck className="w-3.5 h-3.5" /> Enable</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
