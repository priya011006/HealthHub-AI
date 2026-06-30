import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  Pill, 
  Search, 
  Sparkles, 
  Video, 
  HeartPulse, 
  Baby, 
  Brain, 
  Smile, 
  ShieldAlert, 
  CalendarDays, 
  TrendingUp,
  FileText,
  Bookmark,
  ChevronRight,
  Activity,
  ArrowUpRight,
  Plus
} from 'lucide-react';

const PatientDashboard = () => {
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Health Tips List
  const healthTips = [
    "Drink at least 8 glasses of water daily to maintain kidney health.",
    "A 30-minute brisk walk can significantly lower cholesterol levels.",
    "Prioritize 7-8 hours of sleep to enhance your body's immune defense.",
    "Include leafy greens in your meals to boost iron and vitamins."
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % healthTips.length);
    }, 8000);
    return () => clearInterval(tipInterval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await API.get('/api/patients/dashboard');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      showToast('Error loading patient dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const response = await API.post(`/api/appointments/cancel/${id}`);
      if (response.data.success) {
        showToast('Appointment successfully cancelled.', 'success');
        fetchDashboard();
      }
    } catch (error) {
      showToast('Error cancelling appointment.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading patient portal...</span>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const nextAppt = data?.nextAppointment;
  const otherAppts = data?.otherUpcoming || [];
  const reminders = data?.reminders || [];

  // Mock Data for Recharts (Vitals Tracker)
  const healthData = [
    { day: 'Mon', heartRate: 72, sleep: 7.2 },
    { day: 'Tue', heartRate: 68, sleep: 8.0 },
    { day: 'Wed', heartRate: 75, sleep: 6.5 },
    { day: 'Thu', heartRate: 70, sleep: 7.5 },
    { day: 'Fri', heartRate: 71, sleep: 7.0 },
    { day: 'Sat', heartRate: 65, sleep: 8.5 },
    { day: 'Sun', heartRate: 67, sleep: 8.2 },
  ];

  // Specialty mapping
  const specialties = [
    { name: 'General Medicine', icon: HeartPulse, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60', count: 4 },
    { name: 'Pediatrics', icon: Baby, color: 'text-green-600 bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900/60', count: 2 },
    { name: 'Mental Health', icon: Brain, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60', count: 1 },
    { name: 'Dermatology', icon: Smile, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60', count: 1 },
  ];

  // Mock Reports
  const mockReports = [
    { name: "CBC Blood Test", date: "June 25, 2026", size: "1.2 MB" },
    { name: "Lipid Profile Panel", date: "May 18, 2026", size: "980 KB" }
  ];

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Patient Workspace
          </span>
          <h1 className="text-3xl font-extrabold text-slate-905 dark:text-white tracking-tight flex items-center gap-2">
            Welcome, {patient?.name || 'Patient'}
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }} className="inline-block">👋</motion.span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Today is {todayStr}. Explore diagnostics and prescription timelines below.</p>
        </div>

        <button
          onClick={() => navigate('/patient/search')}
          className="btn-primary flex items-center gap-2 py-3 px-5 shadow-lg shadow-primary/10 rounded-2xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Grid of Key Sections: Vitals Chart, Health Score, and Next Appointment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Next Appointment Card (Spans 2 columns if exists) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {nextAppt ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-6 shadow-soft dark:shadow-none relative overflow-hidden flex flex-col justify-between"
            >
              {/* Glowing gradient background */}
              <div className="absolute top-[-30%] right-[-10%] w-60 h-60 rounded-full bg-primary/5 dark:bg-primary/10 blur-[80px]"></div>

              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-primary" />
                    Next Consultation
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
                    nextAppt.aiPreVisitSummary?.urgencyLevel?.toLowerCase().includes('high')
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400'
                      : 'bg-green-50 dark:bg-green-950/20 border-green-150 dark:border-green-900/40 text-accent'
                  }`}>
                    Urgency: {nextAppt.aiPreVisitSummary?.urgencyLevel || 'Low'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Dr. {nextAppt.doctorId.name}</h3>
                    <p className="text-xs font-bold text-primary dark:text-primary-light mt-0.5">{nextAppt.doctorId.specialization}</p>
                    
                    <div className="flex flex-wrap gap-3 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {nextAppt.date}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {nextAppt.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCancelAppointment(nextAppt._id)}
                      className="btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 flex-1 sm:flex-none py-2.5 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => navigate(`/patient/search?book=${nextAppt.doctorId._id}`)}
                      className="btn-primary flex-1 sm:flex-none py-2.5 px-4"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-Visit Details summary */}
              {nextAppt.symptoms?.text && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Pre-Visit Synopsis
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <strong>Complaint:</strong> {nextAppt.aiPreVisitSummary?.chiefComplaint || nextAppt.symptoms.text}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 text-center shadow-soft dark:shadow-none flex flex-col items-center justify-center min-h-[220px]"
            >
              <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">No upcoming consultations scheduled</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">Connect with our medical network to resolve symptoms.</p>
              <button 
                onClick={() => navigate('/patient/search')}
                className="btn-primary py-2.5 px-4 font-bold"
              >
                Schedule First Checkup
              </button>
            </motion.div>
          )}

          {/* Vitals tracker Area Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Biometric Vitals</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Weekly heart rate and sleep logs</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                <TrendingUp className="w-4 h-4 text-accent animate-bounce" />
                Normal Ranges
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <defs>
                    <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHeart)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Health Score Card, Specialties, and Tips */}
        <div className="flex flex-col gap-8">
          
          {/* Health Score Gauge card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none flex items-center justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Index Metrics</span>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Health Score</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">Excellent condition.<br/>Maintain hydration levels.</p>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="2.5" className="dark:stroke-slate-800" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray="85, 100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm text-slate-900 dark:text-white">
                85%
              </div>
            </div>
          </div>

          {/* Specialties search grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4">Find Specialists</h3>
            <div className="grid grid-cols-2 gap-3">
              {specialties.map((spec, index) => {
                const Icon = spec.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(`/patient/search?specialization=${spec.name}`)}
                    className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col items-center gap-2 bg-slate-50/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 hover:shadow-soft transition-all duration-200 cursor-pointer text-center"
                  >
                    <div className={`p-2.5 rounded-xl border ${spec.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-350">{spec.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rotating Health Tip Widget */}
          <div className="p-6 bg-gradient-to-br from-primary to-primary-dark text-white rounded-custom shadow-soft relative overflow-hidden">
            {/* Sparkle graphic */}
            <div className="absolute top-[-30%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
            
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-primary-light flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Tip of the Day
            </h4>
            
            <p className="text-xs font-bold leading-relaxed min-h-[60px] text-white/90">
              {healthTips[tipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Second Row: Medication Reminders & Mock Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Medication Reminders List (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Active Medication Reminders
            </h3>
            <Link to="/patient/reminders" className="text-xs font-bold text-primary hover:underline">
              View Schedule
            </Link>
          </div>

          {reminders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No active medication reminders.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.slice(0, 4).map((reminder) => (
                <div key={reminder._id} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl flex gap-3">
                  <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-accent rounded-xl border border-green-100 dark:border-green-900/40 shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{reminder.medicineName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">Dosage: {reminder.dosage}</p>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-extrabold block w-fit mt-1.5 uppercase tracking-wide">
                      {reminder.frequency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Recent Reports
            </h3>
            
            <div className="flex flex-col gap-3">
              {mockReports.map((rep, index) => (
                <div key={index} className="p-3.5 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/10 rounded-xl flex items-center justify-between gap-3 group hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">{rep.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{rep.date}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold shrink-0">{rep.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
