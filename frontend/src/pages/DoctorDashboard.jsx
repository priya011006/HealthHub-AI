import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  Stethoscope, 
  Sparkles, 
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorDashboard = () => {
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await API.get('/api/doctors/dashboard');
      if (response.data.success) {
        setWidgets(response.data.widgets);
      }
    } catch (error) {
      showToast('Error loading physician dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStartConsultation = (appointmentId) => {
    navigate(`/doctor/consult/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading workspaces...</span>
        </div>
      </div>
    );
  }

  const todayList = widgets?.todayAppointments || [];
  const upcomingList = widgets?.upcomingAppointments || [];
  const pendingSummaries = widgets?.pendingSummaries || [];
  const recentPatients = widgets?.recentPatients || [];

  // Mock data for Recharts (Doctor weekly consultations overview)
  const consultationStats = [
    { name: 'Mon', visits: 5 },
    { name: 'Tue', visits: 8 },
    { name: 'Wed', visits: 4 },
    { name: 'Thu', visits: 7 },
    { name: 'Fri', visits: 9 },
    { name: 'Sat', visits: 2 },
    { name: 'Sun', visits: 0 },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Title */}
      <div className="mb-8">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">
          Physician Console
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clinical Workspace</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage today's consultation queue, document diagnoses, and review pre-visit screening details.</p>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block mb-1">Today's Queue</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{todayList.length}</h2>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-primary-light rounded-2xl border border-blue-100 dark:border-blue-900/60">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block mb-1">Upcoming Bookings</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{upcomingList.length}</h2>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-accent dark:text-accent-light rounded-2xl border border-green-150 dark:border-green-900/60">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block mb-1">Pending Notes</span>
            <h2 className="text-3xl font-extrabold text-red-500 dark:text-red-400">{pendingSummaries.length}</h2>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-450 rounded-2xl border border-red-100 dark:border-red-900/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom shadow-soft dark:shadow-none flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider block mb-1">Unique Patients</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{recentPatients.length}</h2>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Schedule & Weekly Consultations Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Today's Queue list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-6 shadow-soft dark:shadow-none">
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Patient Consultations Queue
            </h3>

            {todayList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                No active consultations scheduled for today.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {todayList.map((appt) => {
                  let urgencyColor = 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-400';
                  const urg = appt.aiPreVisitSummary?.urgencyLevel?.toLowerCase() || '';
                  if (urg.includes('high')) urgencyColor = 'bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400';
                  else if (urg.includes('medium')) urgencyColor = 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400';
                  else if (urg.includes('low')) urgencyColor = 'bg-green-50 border-green-150 text-accent dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400';

                  return (
                    <div 
                      key={appt._id} 
                      className="p-5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-950/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-soft transition-shadow"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-105">{appt.patientId?.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase ${urgencyColor}`}>
                            Urgency: {appt.aiPreVisitSummary?.urgencyLevel || 'Low'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">Symptoms: {appt.symptoms.text}</p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1.5 uppercase tracking-wide">Slot: {appt.time}</span>
                      </div>
                      
                      <button
                        onClick={() => handleStartConsultation(appt._id)}
                        className="btn-primary py-2 px-4 text-xs font-bold cursor-pointer"
                      >
                        Start Consultation
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recharts Analytics chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Weekly Consultations Count</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Total visits completed per week day</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 px-3 py-1.5 rounded-xl">
                <UserCheck className="w-4 h-4 text-accent" />
                Active Shifts
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultationStats}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="visits" name="Consultations Completed" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Unresolved Past consultations & Pending updates */}
        <div className="flex flex-col gap-8">
          
          {/* Pending Consultations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
            <h3 className="font-bold text-base text-slate-805 dark:text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Pending Summaries
            </h3>

            {pendingSummaries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-505 font-medium bg-slate-50/20 dark:bg-slate-950/20 rounded-2xl">
                All clinical summaries logged!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingSummaries.map((appt) => (
                  <div key={appt._id} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 rounded-2xl flex justify-between items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate w-32">{appt.patientId?.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-505 font-semibold mt-0.5">{appt.date} | {appt.time}</p>
                    </div>
                    <button
                      onClick={() => handleStartConsultation(appt._id)}
                      className="btn-accent py-1.5 px-3 text-[10px] font-extrabold bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                    >
                      Log Notes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
            <h3 className="font-bold text-base text-slate-805 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-400" />
              Upcoming Schedule
            </h3>

            {upcomingList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                No future bookings.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingList.slice(0, 5).map((appt) => (
                  <div key={appt._id} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 rounded-2xl">
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{appt.patientId?.name}</p>
                    <div className="flex justify-between text-[9px] text-slate-450 mt-1.5 font-bold uppercase tracking-wide">
                      <span>{appt.date}</span>
                      <span>{appt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
