import React, { useState } from 'react';

export default function WorkWithBhookLgi({ onClose }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    studentId: '',
    daysPerWeek: '',
    confirmation: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.confirmation) {
      alert('Please confirm that the information provided is correct.');
      return;
    }

    console.log('Bhook_Lgi Delivery Application:', formData);

    alert('Application submitted successfully!');

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-brand-cream rounded-3xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-brand-yellow px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-brand-black">
              Work with Bhook_Lgi 🚀
            </h2>
            <p className="text-xs font-semibold text-brand-black/70">
              Earn. Learn. Grow.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 font-bold text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5">

          {!selectedRole ? (
            <>
              <p className="text-sm text-gray-600 mb-5">
                Choose how you want to work with Bhook_Lgi.
              </p>

              {/* Delivery */}
              <button
                onClick={() => setSelectedRole('delivery')}
                className="w-full p-4 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition"
              >
                <div className="text-3xl">🛵</div>
                <div>
                  <h3 className="font-black text-brand-black">
                    Delivery Partner
                  </h3>
                  <p className="text-xs text-gray-500">
                    Deliver orders around campus and earn.
                  </p>
                </div>
              </button>

              {/* Chef */}
              <button
                onClick={() => setSelectedRole('chef')}
                className="w-full p-4 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition"
              >
                <div className="text-3xl">👨‍🍳</div>
                <div>
                  <h3 className="font-black text-brand-black">
                    Chef
                  </h3>
                  <p className="text-xs text-gray-500">
                    Prepare delicious food with Bhook_Lgi.
                  </p>
                </div>
              </button>

              {/* Campus Delivery */}
              <div className="w-full p-4 bg-gray-100 rounded-2xl border border-gray-200 flex items-center gap-4 opacity-70">
                <div className="text-3xl">🎓</div>
                <div>
                  <h3 className="font-black text-brand-black">
                    Campus Delivery
                  </h3>
                  <p className="text-xs font-bold text-gray-500">
                    Coming Soon
                  </p>
                </div>
              </div>
            </>
          ) : selectedRole === 'delivery' ? (
            <>
              {/* Back */}
              <button
                onClick={() => setSelectedRole(null)}
                className="text-sm font-bold text-gray-500 mb-4 hover:text-brand-black"
              >
                ← Back
              </button>

              <div className="mb-5">
                <div className="text-4xl mb-2">🛵</div>

                <h3 className="text-2xl font-black text-brand-black">
                  Join as Delivery Partner
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Work around your classes and earn with Bhook_Lgi.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter your mobile number"
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email ID
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student ID / Registration Number
                  </label>

                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="Enter your student ID"
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-brand-yellow"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    How many days per week can you work?
                  </label>

                  <select
                    name="daysPerWeek"
                    value={formData.daysPerWeek}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-brand-yellow"
                  >
                    <option value="">Select days</option>
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                    <option value="7">7 days</option>
                  </select>
                </div>

                {/* Confirmation */}
                <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="confirmation"
                    checked={formData.confirmation}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 accent-yellow-400"
                  />

                  <span className="text-xs font-semibold text-gray-600">
                    I confirm that the information provided is correct.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-yellow text-brand-black rounded-xl font-black shadow-md hover:scale-[1.01] transition"
                >
                  Submit Application 🛵
                </button>

              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-sm font-bold text-gray-500 mb-4"
              >
                ← Back
              </button>

              <div className="text-center py-10">
                <div className="text-5xl mb-4">👨‍🍳</div>

                <h3 className="text-2xl font-black text-brand-black">
                  Chef
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Chef applications will be available soon.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}