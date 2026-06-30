import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Search, 
  Users, 
  LogOut, 
  Pill,
  ChevronLeft,
  ChevronRight,
  Menu,
  HeartPulse
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patient/search', label: 'Search Doctors', icon: Search },
    { to: '/patient/reminders', label: 'Medication Reminders', icon: Pill },
    { to: '/patient/profile', label: 'My Profile', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/profile', label: 'My Schedule', icon: Calendar },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Doctor Directory', icon: Users },
    { to: '/admin/calendar', label: 'Central Calendar', icon: Calendar },
  ];

  let links = [];
  if (user.role === 'patient') links = patientLinks;
  else if (user.role === 'doctor') links = doctorLinks;
  else if (user.role === 'admin') links = adminLinks;

  const sidebarWidth = isCollapsed ? 76 : 256;

  return (
    <motion.aside 
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="bg-slate-900 text-white min-h-screen flex flex-col justify-between p-4 border-r border-slate-800 shrink-0 relative z-30 overflow-hidden"
    >
      
      {/* Top Branding Section */}
      <div>
        <div className="flex items-center justify-between mb-8 px-2 relative min-h-[40px]">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-lg shadow-sm">
                  H
                </div>
                <div>
                  <h1 className="font-extrabold text-sm leading-tight tracking-tight">HealthHub AI</h1>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-lg mx-auto"
            >
              H
            </motion.div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors z-55"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/10' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={link.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="truncate"
                  >
                    {link.label}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
        <div className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase shrink-0">
            {user.name ? user.name[0] : 'U'}
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
            </motion.div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

    </motion.aside>
  );
};

export default Sidebar;
