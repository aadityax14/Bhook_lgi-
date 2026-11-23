
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { HOSTELS } from '../../utils/fees';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'bhook_staff_application';

// Colleges where Bhook_Lgi sellers will be able to register.
const SELLER_COLLEGES = ['Lovely Professional University'];

export default function WorkWithBhookLgi({ onClose }) {
  // Staff don't see the form for the role they already have.
  const { role } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  // Become a Seller (upcoming)
  const [sellerStore, setSellerStore] = useState(null);
  const [sellerCollege, setSellerCollege] = useState('');
  const [application, setApplication] = useState(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    studentId: '',
    daysPerWeek: '',
    hostel: '',
    otherHostel: '',
    password: '',
    confirmPassword: '',
    confirmation: false
  });

  // Check previous application whenever this window opens.
  useEffect(() => {
    let active = true;

    const checkApplication = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const identity = JSON.parse(saved);

        if (!identity.mobile || !identity.studentId) return;

        const response = await api.getStaffApplicationStatus(
          identity.mobile,
          identity.studentId
        );

        if (active && response.success) {
          setApplication(response.data);
        }
      } catch (err) {
        console.warn('Application status check:', err.message);
      } finally {
        if (active) setChecking(false);
      }
    };

    checkApplication();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData(previous => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Please choose a password of at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.confirmation) {
      setError('Please confirm your information.');
      return;
    }

    // "Other" → use the hostel name they typed.
    const hostel = formData.hostel === 'Other'
      ? formData.otherHostel.trim()
      : formData.hostel;

    if (!hostel) {
      setError('Please type your hostel name.');
      return;
    }

    setSubmitting(true);

    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, confirmation, otherHostel, ...application } = formData;

      const response = await api.submitStaffApplication({
        ...application,
        hostel,
        role: selectedRole
      });

      // Don't keep the password in memory longer than needed.
      setFormData(previous => ({ ...previous, password: '', confirmPassword: '' }));

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Application submission failed.');
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mobile: formData.mobile.trim(),
          studentId: formData.studentId.trim()
        })
      );

      // Hide form and show application status.
      setApplication(response.data);

    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const status = application?.status || 'pending';

  // After a rejection: back to "Chef / Delivery / Seller" so they can
  // apply again for the same role or a different one. Contact details
  // they already typed are kept; passwords are cleared.
  const startReapply = () => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      saved = {};
    }

    setFormData(previous => ({
      ...previous,
      mobile: previous.mobile || saved.mobile || '',
      studentId: previous.studentId || saved.studentId || '',
      password: '',
      confirmPassword: '',
      confirmation: false
    }));
    setError('');
    setSelectedRole(null);
    setApplication(null);
  };

  const statusMessages = {
    pending: 'Your application has been submitted successfully. Our team will review it shortly.',
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'Your application was not approved this time. You can apply again — for the same role or a different one.',
    completed: 'Your staff account has been created successfully.'
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-brand-cream rounded-3xl shadow-2xl">

        <div className="bg-brand-yellow p-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Work with Bhook_Lgi 🚀</h2>
            <p className="text-xs font-semibold">Earn. Learn. Grow.</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/10 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-5">

          {checking ? (
            <div className="py-10 text-center font-semibold">
              Checking application status...
            </div>

          ) : application ? (

            // Already submitted: no application form or submit button.
            <div className="py-8 text-center">

              <div className={`mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center text-3xl ${
                status === 'rejected' ? 'bg-red-100' : 'bg-emerald-100'
              }`}>
                {status === 'rejected' ? '✕' : '✓'}
              </div>

              <h3 className="text-2xl font-black">
                {status === 'approved'
                  ? "You're in! 🎉"
                  : status === 'rejected'
                  ? 'Not approved this time'
                  : 'Application Submitted!'}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Your {application.role === 'chef'
                  ? 'Chef'
                  : 'Delivery Partner'} application {status === 'rejected' ? 'was reviewed.' : 'has been received.'}
              </p>

              <div className="mt-5 rounded-2xl bg-white border border-yellow-200 p-4">

                <p className="text-sm font-bold text-gray-500">
                  APPLICATION STATUS
                </p>

                <span className={`inline-block mt-2 rounded-full px-4 py-2 text-sm font-black uppercase ${
                  status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : status === 'approved' || status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {status}
                </span>

                <p className="mt-3 text-sm text-gray-600">
                  {statusMessages[status] || 'Application received.'}
                </p>

                {status === 'approved' && application.loginId && (
                  <div className="mt-4 rounded-xl bg-brand-yellow/20 border border-brand-yellow/40 p-3 text-left">
                    <p className="text-xs font-bold text-gray-500">YOUR LOGIN ID</p>
                    <p className="mt-1 font-mono text-xl font-black tracking-wide">
                      {application.loginId}
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                      Log out of your customer account, then tap <b>Sign In</b> and use this
                      Login ID with the password you chose on this form.
                    </p>
                  </div>
                )}

              </div>

              {/* Rejected: try again (same or different role).
                  Approved: they can still apply for another role. */}
              {(status === 'rejected' || status === 'approved') && (
                <button
                  onClick={startReapply}
                  className="mt-6 w-full rounded-xl bg-brand-yellow py-3 font-black text-brand-black"
                >
                  {status === 'rejected' ? 'Apply again' : 'Apply for another role'}
                </button>
              )}

              <button
                onClick={onClose}
                className={`${status === 'rejected' || status === 'approved' ? 'mt-3' : 'mt-6'} w-full rounded-xl bg-brand-black py-3 font-black text-brand-yellow`}
              >
                Close
              </button>

            </div>

          ) : !selectedRole ? (

            // Role selection
            <>
              <p className="mb-5 text-sm text-gray-600">
                Choose how you want to work with Bhook_Lgi.
              </p>

              {/* Already a delivery partner / chef? That form is hidden —
                  they can still apply for the other roles. */}
              {(role === 'CHEF' || role === 'DELIVERY') && (
                <p className="mb-4 rounded-xl bg-white border border-gray-100 px-3 py-2 text-xs text-gray-600">
                  You're already a Bhook_Lgi {role === 'CHEF' ? 'chef' : 'delivery partner'} 💛 You can apply for another role below.
                </p>
              )}

              {role !== 'DELIVERY' && (
                <button
                  onClick={() => setSelectedRole('delivery')}
                  className="mb-3 flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm"
                >
                  <span className="text-3xl">🛵</span>
                  <div>
                    <h3 className="font-black">Delivery Partner</h3>
                    <p className="text-xs text-gray-500">
                      Deliver orders around campus.
                    </p>
                  </div>
                </button>
              )}

              {role !== 'CHEF' && (
                <button
                  onClick={() => setSelectedRole('chef')}
                  className="mb-3 flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm"
                >
                  <span className="text-3xl">👨‍🍳</span>
                  <div>
                    <h3 className="font-black">Chef</h3>
                    <p className="text-xs text-gray-500">
                      Prepare delicious food.
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedRole('seller');
                  setSellerStore(null);
                  setSellerCollege('');
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm"
              >
                <span className="text-3xl">🏪</span>
                <div className="flex-1">
                  <h3 className="font-black flex items-center gap-2">
                    Become a Seller
                    <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-black uppercase">
                      Upcoming
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Sell on Bhook_Lgi or Zuxu.
                  </p>
                </div>
              </button>
            </>

          ) : selectedRole === 'seller' ? (

            // Become a Seller (upcoming — nothing is submitted yet)
            <>
              <button
                onClick={() => {
                  if (sellerStore) {
                    setSellerStore(null);
                    setSellerCollege('');
                  } else {
                    setSelectedRole(null);
                  }
                }}
                className="mb-4 text-sm font-bold text-gray-500"
              >
                ← Back
              </button>

              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-2xl font-black">Become a Seller</h3>
                <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-black uppercase">
                  Upcoming
                </span>
              </div>

              {/* Step 1: choose store */}
              <p className="mb-2 text-xs font-bold">Where do you want to sell?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['bhook_lgi', '🍜', 'Bhook_Lgi', 'Food & snacks'],
                  ['zuxu', '🎁', 'Zuxu', 'Handmade gifts & more'],
                ].map(([id, emoji, label, hint]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSellerStore(id);
                      setSellerCollege('');
                    }}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                      sellerStore === id
                        ? 'border-brand-black bg-brand-yellow/20'
                        : 'border-transparent bg-white shadow-sm'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <p className="mt-1 font-black">{label}</p>
                    <p className="text-[11px] text-gray-500">{hint}</p>
                  </button>
                ))}
              </div>

              {/* Step 2 (Bhook_Lgi only): choose college */}
              {sellerStore === 'bhook_lgi' && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-bold">
                    Select your college
                  </label>
                  <select
                    value={sellerCollege}
                    onChange={(e) => setSellerCollege(e.target.value)}
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  >
                    <option value="">Select college</option>
                    {SELLER_COLLEGES.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Coming soon message once the choices are made */}
              {(sellerStore === 'zuxu' || (sellerStore === 'bhook_lgi' && sellerCollege)) && (
                <div className="mt-5 rounded-2xl bg-white border border-yellow-200 p-5 text-center">
                  <div className="text-4xl">🚀</div>
                  <h4 className="mt-2 text-lg font-black">Coming soon!</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Seller registration for{' '}
                    <b>{sellerStore === 'zuxu' ? 'Zuxu' : 'Bhook_Lgi'}</b>
                    {sellerStore === 'bhook_lgi' && <> at <b>{sellerCollege}</b></>}{' '}
                    is opening soon. Check back here to apply.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-xl bg-brand-yellow py-3 font-black opacity-50 cursor-not-allowed"
              >
                Seller registration opening soon
              </button>
            </>

          ) : (

            // Application form
            <>
              <button
                onClick={() => setSelectedRole(null)}
                className="mb-4 text-sm font-bold text-gray-500"
              >
                ← Back
              </button>

              <h3 className="mb-4 text-2xl font-black">
                Join as {selectedRole === 'chef' ? 'Chef' : 'Delivery Partner'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">

                {[
                  ['fullName', 'Full Name', 'text'],
                  ['mobile', 'Mobile Number', 'tel'],
                  ['email', 'Email ID', 'email'],
                  ['studentId', 'Student ID', 'text']
                ].map(([name, label, type]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs font-bold">
                      {label}
                    </label>
                    <input
                      name={name}
                      type={type}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-yellow-400"
                      placeholder={`Enter ${label}`}
                    />
                  </div>
                ))}

                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Your hostel
                  </label>
                  <select
                    name="hostel"
                    value={formData.hostel}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  >
                    <option value="">Select hostel</option>
                    {HOSTELS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  {formData.hostel === 'Other' && (
                    <input
                      type="text"
                      name="otherHostel"
                      value={formData.otherHostel}
                      onChange={handleChange}
                      required
                      maxLength={20}
                      autoFocus
                      className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-yellow-400"
                      placeholder="Type your hostel name"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Available days per week
                  </label>

                  <select
                    name="daysPerWeek"
                    value={formData.daysPerWeek}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border bg-white px-4 py-3"
                  >
                    <option value="">Select days</option>
                    {[1,2,3,4,5,6,7].map(day => (
                      <option key={day} value={day}>
                        {day} {day === 1 ? 'day' : 'days'}
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  ['password', 'Choose a password (min 8 characters)'],
                  ['confirmPassword', 'Confirm password']
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs font-bold">
                      {label}
                    </label>
                    <input
                      name={name}
                      type="password"
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-yellow-400"
                    />
                  </div>
                ))}

                <p className="text-[11px] text-gray-500 -mt-2">
                  You'll use this password with the Login ID you get after approval.
                  Nobody at Bhook_Lgi can see it.
                </p>

                <label className="flex gap-3 rounded-xl bg-white p-3 text-xs">
                  <input
                    type="checkbox"
                    name="confirmation"
                    checked={formData.confirmation}
                    onChange={handleChange}
                  />
                  I confirm that all information is correct.
                </label>

                {error && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-brand-yellow py-3 font-black disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>

              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
  