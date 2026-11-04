
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const STORAGE_KEY = 'bhook_staff_application';

export default function WorkWithBhookLgi({ onClose }) {
  const [selectedRole, setSelectedRole] = useState(null);
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

    if (!formData.confirmation) {
      setError('Please confirm your information.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitStaffApplication({
        ...formData,
        role: selectedRole
      });

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

  const statusMessages = {
    pending: 'Your application has been submitted successfully. Our team will review it shortly.',
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'Your application was not approved. Please contact Bhook_Lgi.',
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

              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
                ✓
              </div>

              <h3 className="text-2xl font-black">
                Application Submitted!
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Your {application.role === 'chef'
                  ? 'Chef'
                  : 'Delivery Partner'} application has been received.
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

              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-brand-black py-3 font-black text-brand-yellow"
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

              <button
                onClick={() => setSelectedRole('chef')}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm"
              >
                <span className="text-3xl">👨‍🍳</span>
                <div>
                  <h3 className="font-black">Chef</h3>
                  <p className="text-xs text-gray-500">
                    Prepare delicious food.
                  </p>
                </div>
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
