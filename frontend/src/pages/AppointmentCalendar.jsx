import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { Calendar, Search, Filter, Trash2, Clock, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react';

const AppointmentCalendar = () => {
  const { showToast } = useContext(ToastContext);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchDoc, setSearchDoc] = useState('');
  const [searchPat, setSearchPat] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAppointments = async () => {
    try {
      const response = await API.get('/api/admin/appointments');
      if (response.data.success) {
        setAppointments(response.data.appointments);
        setFilteredAppointments(response.data.appointments);
      }
    } catch (error) {
      showToast('Error loading appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter application trigger
  useEffect(() => {
    let result = [...appointments];

    if (searchDoc) {
      result = result.filter(appt => 
        appt.doctorId?.name.toLowerCase().includes(searchDoc.toLowerCase())
      );
    }

    if (searchPat) {
      result = result.filter(appt => 
        appt.patientId?.name.toLowerCase().includes(searchPat.toLowerCase())
      );
    }

    if (filterDate) {
      result = result.filter(appt => appt.date === filterDate);
    }

    if (filterStatus !== 'all') {
      result = result.filter(appt => appt.status === filterStatus);
    }

    // Sort by date (newest first)
    result.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    setFilteredAppointments(result);
  }, [searchDoc, searchPat, filterDate, filterStatus, appointments]);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) return;
    try {
      const response = await API.post(`/api/appointments/cancel/${id}`, {
        reason: 'Cancelled by clinic administration.'
      });
      if (response.data.success) {
        showToast('Appointment successfully cancelled.', 'success');
        setAppointments(prev => 
          prev.map(appt => appt._id === id ? { ...appt, status: 'cancelled' } : appt)
        );
      }
    } catch (error) {
      showToast('Error cancelling appointment.', 'error');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinic Schedule</h1>
        <p className="text-sm text-slate-500 font-medium">Centralized directory of patient checkups and follow-up activities.</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-slate-100 rounded-custom p-6 shadow-soft mb-8 flex flex-col gap-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-4 h-4" />
          Filter Directory
        </span>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Doctor Name Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              className="form-input pl-10"
              placeholder="Search Doctor..."
            />
          </div>

          {/* Patient Name Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchPat}
              onChange={(e) => setSearchPat(e.target.value)}
              className="form-input pl-10"
              placeholder="Search Patient..."
            />
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="form-input text-slate-500"
            style={{ paddingLeft: '1rem' }}
          />

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '1rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-custom p-16 text-center shadow-soft">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-sm text-slate-400 mt-1">Adjust your filter parameters or schedule a new appointment.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-custom shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Patient</th>
                  <th className="p-4">Assigned Doctor</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-50">
                {filteredAppointments.map((appt) => {
                  let statusStyle = 'bg-blue-50 text-blue-700 border-blue-100';
                  if (appt.status === 'completed') statusStyle = 'bg-green-50 text-accent border-green-100';
                  else if (appt.status === 'cancelled') statusStyle = 'bg-red-50 text-red-600 border-red-100';
                  else if (appt.status === 'rescheduled') statusStyle = 'bg-amber-50 text-amber-700 border-amber-100';

                  let urgencyStyle = 'bg-slate-100 text-slate-600';
                  const urgency = appt.aiPreVisitSummary?.urgencyLevel?.toLowerCase() || '';
                  if (urgency.includes('high')) urgencyStyle = 'bg-red-100 text-red-700';
                  else if (urgency.includes('medium')) urgencyStyle = 'bg-amber-100 text-amber-700';
                  else if (urgency.includes('low')) urgencyStyle = 'bg-green-100 text-green-700';

                  return (
                    <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800">{appt.patientId?.name || 'Deleted Patient'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">ID: {appt._id.substring(16)}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">Dr. {appt.doctorId?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{appt.doctorId?.specialization}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {appt.time}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{appt.date}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${urgencyStyle}`}>
                          {appt.aiPreVisitSummary?.urgencyLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg border capitalize font-bold text-[10px] ${statusStyle}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancel Appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
