
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function StaffApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const loadApplications = async () => {
    try {
      const token = localStorage.getItem('bhook_admin_token');

      if (!token) {
        throw new Error('Admin login required.');
      }

      const response = await api.getStaffApplications(token);
      setApplications(response.data || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setWorkingId(id);
      setMessage('');

      const token = localStorage.getItem('bhook_admin_token');

      await api.decideStaffApplication(id, status, token);

      setMessage(`Application ${status} successfully.`);

      await loadApplications();
    } catch (error) {
      setMessage(error.message || 'Could not update application.');
    } finally {
      setWorkingId(null);
    }
  };

  const pending = applications.filter(
    item => item.status === 'pending'
  ).length;

  if (loading) {
    return <p className="p-6">Loading applications...</p>;
  }

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-2xl font-black">
          Staff Applications
        </h2>
        <p className="text-sm text-gray-500">
          Manage Bhook_Lgi delivery partners and chefs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">

        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-gray-500">Total Applications</p>
          <h3 className="mt-2 text-3xl font-black">
            {applications.length}
          </h3>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Pending</p>
          <h3 className="mt-2 text-3xl font-black">
            {pending}
          </h3>
        </div>

      </div>

      {message && (
        <div className="rounded-xl bg-yellow-50 p-3 text-sm font-semibold">
          {message}
        </div>
      )}

      <button
        onClick={loadApplications}
        className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
      >
        Refresh Applications
      </button>

      {applications.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center">
          No applications received yet.
        </div>
      ) : (

        <div className="space-y-4">

          {applications.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >

              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    {item.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.role === 'chef'
                      ? '👨‍🍳 Chef'
                      : '🛵 Delivery Partner'}
                  </p>
                </div>

                <span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase">
                  {item.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p><b>Mobile:</b> {item.mobile}</p>
                <p><b>Email:</b> {item.email}</p>
                <p><b>Student ID:</b> {item.student_id}</p>
                <p><b>Available:</b> {item.days_per_week} days/week</p>
                <p>
                  <b>Applied:</b>{' '}
                  {new Date(item.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              {item.status === 'pending' && (
                <div className="mt-4 flex gap-3">

                  <button
                    disabled={workingId === item.id}
                    onClick={() => updateStatus(item.id, 'approved')}
                    className="flex-1 rounded-xl bg-green-600 py-2.5 font-bold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    disabled={workingId === item.id}
                    onClick={() => updateStatus(item.id, 'rejected')}
                    className="flex-1 rounded-xl bg-red-50 py-2.5 font-bold text-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>

                </div>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
