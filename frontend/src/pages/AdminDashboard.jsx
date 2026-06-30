import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  CalendarDays, 
  CalendarCheck, 
  CalendarX, 
  Clock, 
  ShieldAlert, 
  Activity, 
  Server, 
  Database, 
  Mail, 
  CalendarRange,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { showToast } = useContext(ToastContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get('/api/admin/stats');
        if (response.data.success) {
          setStats(response.data.stats);
          setRecentActivity(response.data.recentActivity);
          setCharts(response.data.charts);
        }
      } catch (error) {
        showToast('Failed to load administrator statistics.', 'error');
        console.error('Stats error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading operations console...</span>
        </div>
      </div>
    );
  }

  // Recharts Pie Chart configuration
  const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const pieData = charts?.specialization?.map(item => ({
    name: item._id || 'General',
    value: item.count
  })) || [];

  // Mock data for Recharts (Appointments Per Week)
  const apptsPerWeek = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 19 },
    { day: 'Wed', count: 15 },
    { day: 'Thu', count: 22 },
    { day: 'Fri', count: 26 },
    { day: 'Sat', count: 8 },
    { day: 'Sun', count: 2 },
  ];

  // Mock data for Recharts (Patients Per Month)
  const patientsPerMonth = [
    { month: 'Jan', count: 40 },
    { month: 'Feb', count: 48 },
    { month: 'Mar', count: 52 },
    { month: 'Apr', count: 68 },
    { month: 'May', count: 75 },
    { month: 'Jun', count: 90 },
  ];

  const cardData = [
    { title: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-blue-50 dark:bg-blue-950/40 text-primary dark:text-primary-light border-blue-100 dark:border-blue-900/60' },
    { title: 'Total Doctors', value: stats?.totalDoctors || 0, icon: UserCheck, color: 'bg-green-50 dark:bg-green-950/40 text-accent dark:text-accent-light border-green-100 dark:border-green-900/60' },
    { title: "Today's Visits", value: stats?.todayAppointments || 0, icon: CalendarCheck, color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60' },
    { title: 'Cancelled Checkups', value: stats?.cancelledAppointments || 0, icon: CalendarX, color: 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/40' },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Title */}
      <div className="mb-8">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
          System Administration
        </span>
        <h1 className="text-3xl font-extrabold text-slate-905 dark:text-white tracking-tight">Console Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Platform operations analytics, database seeder, and system health monitors.</p>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="p-5 rounded-custom border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-soft dark:shadow-none hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.title}</span>
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight font-sans">{card.value}</h2>
            </div>
          );
        })}

        {/* Revenue Placeholder Card */}
        <div className="p-5 rounded-custom border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-soft dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue (Est)</span>
            <div className="p-2.5 rounded-xl border bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight font-sans">$14,280</h2>
            <p className="text-[9px] font-extrabold text-accent flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              +12.4% MoM
            </p>
          </div>
        </div>
      </div>

      {/* Grid for Charts & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Appointments weekly count (Recharts Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-6">Appointments Per Week Day</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apptsPerWeek}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" name="Appointments Scheduled" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-805 dark:text-white mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-400" />
              System Status
            </h3>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 rounded-xl">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  MongoDB Atlas
                </span>
                <span className="text-accent bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900/40 px-2 py-0.5 rounded-lg text-[9px] font-bold">CONNECTED</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 rounded-xl">
                <span className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-slate-400" />
                  Google Calendar API
                </span>
                <span className="text-accent bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900/40 px-2 py-0.5 rounded-lg text-[9px] font-bold">SYNC ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-950/20 rounded-xl">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Nodemailer SMTP
                </span>
                <span className="text-slate-450 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded-lg text-[9px] font-bold">READY</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
            <strong>System Engine:</strong> Background jobs are initialized. Cron task runner is executing retries at 10-minute schedules.
          </div>
        </div>
      </div>

      {/* Third Row: Patients Per Month & Specializations distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Patients registration count (Recharts Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-6">Patient Registrations Growth</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientsPerMonth}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="count" name="Registered Patients" stroke="#22C55E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialization distribution (Recharts Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-6">Physician Specializations</h3>
            <div className="h-48 w-full relative flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 font-semibold">No specialization logs found.</div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto pt-2 border-t border-slate-50 dark:border-slate-850">
            {pieData.map((item, idx) => (
              <span 
                key={idx} 
                className="text-[9px] font-bold px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-850 flex items-center gap-1 shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
