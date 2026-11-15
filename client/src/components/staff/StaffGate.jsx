import { useCallback, useEffect, useState } from 'react';
import { CalendarX2, KeyRound, LogOut, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/*
 * Wraps the Chef / Delivery panels:
 *   1. If the admin reset this password, ask for a new one first.
 *   2. If the admin hasn't put this person on today's duty list,
 *      show "not on duty" instead of the orders.
 * The server enforces both rules too; this just explains them.
 */

function ChangePasswordScreen({ user, onDone, onLogout }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(current, next);
      onDone();
    } catch (err) {
      setError(err.message || 'Could not change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-yellow flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg">Set a new password</h1>
            <p className="text-xs text-gray-500">{user?.loginId}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          The admin gave you a temporary password. Choose your own to continue.
        </p>

        {[
          ['Temporary password', current, setCurrent, 'current-password'],
          ['New password (min 8 characters)', next, setNext, 'new-password'],
          ['Confirm new password', confirm, setConfirm, 'new-password'],
        ].map(([label, value, setValue, autoComplete]) => (
          <label key={label} className="block">
            <span className="block text-xs font-bold text-gray-700 mb-1">{label}</span>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete={autoComplete}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </label>
        ))}

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand-yellow py-3.5 font-black disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save and continue'}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full text-sm font-bold text-gray-500"
        >
          Log out
        </button>
      </form>
    </div>
  );
}

function NotOnDutyScreen({ user, date, checking, onRefresh, onLogout }) {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <CalendarX2 className="w-7 h-7 text-gray-500" />
        </div>

        <h1 className="text-xl font-black">You're not on duty today</h1>

        <p className="mt-2 text-sm text-gray-600">
          Hi {user?.name?.split(' ')[0] || 'there'}! The admin hasn't added you to
          {date ? ` today's (${date})` : " today's"} {user?.role === 'CHEF' ? 'kitchen' : 'delivery'} list.
          You'll see orders here as soon as they do.
        </p>

        <p className="mt-3 text-xs font-mono text-gray-400">{user?.loginId}</p>

        <button
          onClick={onRefresh}
          disabled={checking}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-yellow py-3 font-black disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Check again
        </button>

        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

// children = the chef / delivery panel (shown only when on duty)
// offDuty  = what to show when not on duty (the normal customer app)
export default function StaffGate({ children, offDuty = null, showTopBar = false }) {
  const { user, logout, updateUser } = useAuth();

  const [duty, setDuty] = useState({ checked: false, onDuty: false, date: null });
  const [checking, setChecking] = useState(false);

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const checkDuty = useCallback(async () => {
    setChecking(true);
    try {
      const res = await api.getMyDuty();
      const onDuty = Boolean(res?.data?.onDuty);
      setDuty({ checked: true, onDuty, date: res?.data?.date || null });
      // Shared with the rest of the app (e.g. which orders to load).
      updateUser({ onDutyToday: onDuty });
    } catch (err) {
      if (err?.status === 401) {
        logout();
        return;
      }
      if (err?.code === 'PASSWORD_CHANGE_REQUIRED') {
        updateUser({ mustChangePassword: true });
      }
      setDuty(prev => ({ ...prev, checked: true }));
    } finally {
      setChecking(false);
    }
  }, [logout, updateUser]);

  // Re-check every minute so the panel opens once the admin adds them.
  useEffect(() => {
    if (mustChangePassword) return undefined;

    checkDuty();
    const interval = setInterval(checkDuty, 60000);
    return () => clearInterval(interval);
  }, [checkDuty, mustChangePassword]);

  if (mustChangePassword) {
    return (
      <ChangePasswordScreen
        user={user}
        onLogout={logout}
        onDone={() => updateUser({ mustChangePassword: false })}
      />
    );
  }

  if (!duty.checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-500">
        Checking today's duty…
      </div>
    );
  }

  // Off duty: use the app like a normal customer (browse, order, track).
  if (!duty.onDuty) {
    if (!offDuty) {
      return (
        <NotOnDutyScreen
          user={user}
          date={duty.date}
          checking={checking}
          onRefresh={checkDuty}
          onLogout={logout}
        />
      );
    }

    return (
      <>
        <div className="bg-gray-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold">
            You're off duty today — shopping as a customer.{' '}
            <span className="text-gray-400 font-normal">
              Your {user?.role === 'CHEF' ? 'chef' : 'delivery'} panel opens when the admin puts you on duty.
            </span>
          </span>
          <button
            onClick={checkDuty}
            disabled={checking}
            className="flex items-center gap-1 font-bold text-brand-yellow disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Check duty
          </button>
        </div>
        {offDuty}
      </>
    );
  }

  return (
    <>
      {showTopBar && (
        <div className="sticky top-0 z-40 bg-brand-black text-white px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-bold">
            {user?.name} · <span className="font-mono text-brand-yellow">{user?.loginId}</span> · On duty today
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1 font-bold text-red-300 hover:text-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      )}
      {children}
    </>
  );
}
