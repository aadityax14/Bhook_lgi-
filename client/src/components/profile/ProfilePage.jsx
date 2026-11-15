import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  StickyNote,
  User,
} from 'lucide-react';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';

const HOSTEL_OPTIONS = ['GH1', 'GH3', 'GH4', 'GH11', 'GH12', 'BH1', 'BH2', 'Other'];

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand-yellow focus:bg-white';

const initialsOf = (name) =>
  String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const formFromUser = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  email: user?.email || '',
  hostel: user?.hostel || '',
  roomNumber: user?.roomNumber || '',
  deliveryNote: user?.deliveryNote || '',
});

function Notice({ notice }) {
  if (!notice) return null;
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
        notice.type === 'error'
          ? 'bg-red-50 text-red-700 border border-red-100'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
      }`}
    >
      {notice.text}
    </div>
  );
}

function Section({ title, icon: Icon, action, children }) {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 font-black text-brand-black">
          <Icon className="w-4 h-4 text-brand-yellow" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value, muted }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className={`text-sm font-bold break-words ${muted ? 'text-gray-400' : 'text-brand-black'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage({ onBack, onOpenOrders, onOpenNotifications, onWorkWithUs }) {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { myOrders } = useOrder();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => formFromUser(user));
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwNotice, setPwNotice] = useState(null);

  // Keep the form in sync when not editing (e.g. after login refresh).
  useEffect(() => {
    if (!editing) setForm(formFromUser(user));
  }, [user, editing]);

  const hostelOptions = useMemo(
    () => (form.hostel && !HOSTEL_OPTIONS.includes(form.hostel) ? [...HOSTEL_OPTIONS, form.hostel] : HOSTEL_OPTIONS),
    [form.hostel]
  );

  // ---- Order stats from the customer's own orders ----
  const stats = useMemo(() => {
    const orders = myOrders || [];
    const delivered = orders.filter((o) => o.status === 'delivered');

    const counts = {};
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.items || []) {
        const name = item.productName || item.name;
        if (name) counts[name] = (counts[name] || 0) + Number(item.quantity || 1);
      }
    }
    const favourite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { total: orders.length, delivered: delivered.length, favourite };
  }, [myOrders]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <User className="w-10 h-10 mx-auto text-gray-300" />
        <h2 className="mt-3 font-black text-lg">You're signed out</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to see your profile.</p>
        <button onClick={onBack} className="mt-5 px-5 py-2.5 rounded-xl bg-brand-yellow font-black text-sm">
          Back to menu
        </button>
      </div>
    );
  }

  const cleanPhone = (value) => String(value || '').replace(/\D/g, '').slice(-10);
  const phoneChanged = cleanPhone(form.phone) !== cleanPhone(user.phone);
  const emailChanged = form.email.trim().toLowerCase() !== String(user.email || '').toLowerCase();
  const needsPassword = phoneChanged || emailChanged;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const startEditing = () => {
    setForm(formFromUser(user));
    setCurrentPassword('');
    setNotice(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setCurrentPassword('');
    setNotice(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (form.name.trim().length < 2) {
      setNotice({ type: 'error', text: 'Please enter your name.' });
      return;
    }
    if (cleanPhone(form.phone).length !== 10) {
      setNotice({ type: 'error', text: 'Enter a valid 10-digit mobile number.' });
      return;
    }
    if (!form.hostel || !form.roomNumber.trim()) {
      setNotice({ type: 'error', text: 'Please choose your hostel and room.' });
      return;
    }
    if (needsPassword && !currentPassword) {
      setNotice({ type: 'error', text: 'Enter your current password to change your phone or email.' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile({
        name: form.name,
        phone: form.phone,
        email: form.email,
        hostel: form.hostel,
        roomNumber: form.roomNumber,
        deliveryNote: form.deliveryNote,
        ...(needsPassword ? { currentPassword } : {}),
      });

      if (res?.user) updateUser(res.user);

      setEditing(false);
      setCurrentPassword('');
      setNotice({
        type: 'success',
        text: phoneChanged
          ? 'Saved ✓ Use your new number to log in from now on.'
          : 'Profile saved ✓',
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwNotice(null);

    if (pw.next.length < 8) {
      setPwNotice({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setShowPasswordForm(false);
      setPwNotice({ type: 'success', text: 'Password changed ✓' });
    } catch (err) {
      setPwNotice({ type: 'error', text: err.message || 'Could not change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const links = [
    { icon: Package, label: 'My Orders', hint: `${stats.total} order${stats.total === 1 ? '' : 's'}`, onClick: onOpenOrders },
    { icon: Bell, label: 'Notifications', hint: 'Order updates', onClick: onOpenNotifications },
    { icon: Briefcase, label: 'Work with Bhook_Lgi', hint: 'Join as chef or delivery', onClick: onWorkWithUs },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-brand-black"
      >
        <ArrowLeft className="w-4 h-4" /> Back to menu
      </button>

      {/* ================= HERO ================= */}
      <div className="rounded-3xl bg-brand-black text-white p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-yellow text-brand-black flex items-center justify-center text-2xl font-black shrink-0">
          {initialsOf(user.name)}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black truncate">{user.name}</h2>
          <p className="text-sm text-white/70 truncate">
            {user.phone}
            {user.hostel ? ` · ${user.hostel}, Room ${user.roomNumber}` : ''}
          </p>
          {memberSince && (
            <p className="text-xs text-brand-yellow font-bold mt-0.5">Member since {memberSince}</p>
          )}
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Orders', stats.total],
          ['Delivered', stats.delivered],
          ['Favourite', stats.favourite || '—'],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-base font-black text-brand-black truncate" title={String(value)}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <Notice notice={notice} />

      {/* ================= DETAILS ================= */}
      <Section
        title="Contact & delivery details"
        icon={User}
        action={
          !editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 rounded-xl bg-brand-yellow/30 hover:bg-brand-yellow/50 px-3 py-1.5 text-xs font-black"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )
        }
      >
        {!editing ? (
          <div className="divide-y divide-gray-100">
            <DetailRow icon={User} label="Name" value={user.name} />
            <DetailRow icon={Phone} label="Mobile (kitchen & delivery call this)" value={user.phone} />
            <DetailRow icon={Mail} label="Email" value={user.email || 'Not added'} muted={!user.email} />
            <DetailRow
              icon={MapPin}
              label="Default delivery address"
              value={user.hostel ? `${user.hostel}, Room ${user.roomNumber}` : 'Not set'}
              muted={!user.hostel}
            />
            <DetailRow
              icon={StickyNote}
              label="Default delivery note"
              value={user.deliveryNote || 'None — e.g. "Call when you reach the 3rd floor"'}
              muted={!user.deliveryNote}
            />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-bold text-gray-700 mb-1">Full name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-gray-700 mb-1">Mobile number</span>
              <input
                className={inputClass}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit mobile"
                autoComplete="tel"
                required
              />
              <span className="block text-[11px] text-gray-500 mt-1">
                The delivery partner and kitchen call this number about your orders. It's also your login.
              </span>
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-gray-700 mb-1">Email (optional)</span>
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </label>

            <div>
              <span className="block text-xs font-bold text-gray-700 mb-1.5">Hostel</span>
              <div className="grid grid-cols-4 gap-1.5">
                {hostelOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm({ ...form, hostel: h })}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      form.hostel === h
                        ? 'bg-brand-black text-brand-yellow border-brand-black'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="block text-xs font-bold text-gray-700 mb-1">Room number</span>
              <input
                className={inputClass}
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="e.g. 312 or 405-B"
                maxLength={20}
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-gray-700 mb-1">Default delivery note</span>
              <textarea
                className={inputClass}
                rows={2}
                maxLength={200}
                value={form.deliveryNote}
                onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
                placeholder='e.g. "Call when you reach the 3rd floor corridor"'
              />
              <span className="block text-[11px] text-gray-500 mt-1">
                Filled in automatically at checkout. {form.deliveryNote.length}/200
              </span>
            </label>

            {needsPassword && (
              <label className="block rounded-xl bg-amber-50 border border-amber-100 p-3">
                <span className="block text-xs font-bold text-amber-800 mb-1">
                  Current password (needed to change your {phoneChanged && emailChanged ? 'phone and email' : phoneChanged ? 'phone' : 'email'})
                </span>
                <input
                  className={inputClass}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-brand-yellow py-3 font-black text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-5 rounded-xl bg-gray-100 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* ================= SECURITY ================= */}
      <Section
        title="Password"
        icon={KeyRound}
        action={
          !showPasswordForm && (
            <button
              onClick={() => {
                setShowPasswordForm(true);
                setPwNotice(null);
              }}
              className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-black"
            >
              Change
            </button>
          )
        }
      >
        <Notice notice={pwNotice} />

        {!showPasswordForm ? (
          <p className="text-sm text-gray-500">Keep your account safe with a password only you know.</p>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-3 mt-2">
            {[
              ['current', 'Current password', 'current-password'],
              ['next', 'New password (min 8 characters)', 'new-password'],
              ['confirm', 'Confirm new password', 'new-password'],
            ].map(([key, label, autoComplete]) => (
              <label key={key} className="block">
                <span className="block text-xs font-bold text-gray-700 mb-1">{label}</span>
                <input
                  className={inputClass}
                  type="password"
                  value={pw[key]}
                  onChange={(e) => setPw({ ...pw, [key]: e.target.value })}
                  autoComplete={autoComplete}
                  required
                />
              </label>
            ))}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pwSaving}
                className="flex-1 rounded-xl bg-brand-black text-brand-yellow py-3 font-black text-sm disabled:opacity-50"
              >
                {pwSaving ? 'Saving…' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPw({ current: '', next: '', confirm: '' });
                }}
                className="px-5 rounded-xl bg-gray-100 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* ================= QUICK LINKS ================= */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft divide-y divide-gray-100 overflow-hidden">
        {links.map(({ icon: Icon, label, hint, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-gray-50"
          >
            <Icon className="w-5 h-5 text-brand-yellow shrink-0" />
            <span className="flex-1">
              <span className="block text-sm font-black text-brand-black">{label}</span>
              <span className="block text-xs text-gray-500">{hint}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}

        <button
          onClick={() => {
            logout();
            onBack();
          }}
          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm font-black">Log out</span>
        </button>
      </div>
    </div>
  );
}
