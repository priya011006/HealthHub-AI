import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  Bell, 
  Check, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  Info, 
  Search, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      await API.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
      
      {/* Search Input Bar (Mock) */}
      <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-64 max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search patient, doctor, meds..." 
          className="bg-transparent border-none text-xs focus:outline-none text-slate-200 placeholder-slate-400 w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
          {todayStr}
        </span>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-800 cursor-pointer relative transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[360px]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider">Alert Center</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-primary hover:underline transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 max-h-64">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[10px] text-slate-400 font-medium bg-slate-950/20">
                    No alerts in history.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    let NotifIcon = Info;
                    let iconBg = 'bg-blue-950/40 text-blue-500';
                    if (notif.type === 'appointment') {
                      NotifIcon = CheckCircle;
                      iconBg = 'bg-green-950/40 text-accent';
                    } else if (notif.type === 'reminder') {
                      NotifIcon = ShieldAlert;
                      iconBg = 'bg-amber-950/40 text-amber-500';
                    }

                    return (
                      <div
                        key={notif._id}
                        className={`p-3.5 border-b border-slate-800/40 flex items-start gap-3 transition-colors ${
                          notif.isRead ? 'bg-slate-900 opacity-60' : 'bg-slate-950/20'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${iconBg} shrink-0`}>
                          <NotifIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 leading-snug">{notif.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{notif.message}</p>
                          <span className="text-[8px] text-slate-500 block mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            className="w-5 h-5 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shrink-0 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-800 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase shadow-sm">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline-block select-none">
              {user?.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-1.5 flex flex-col gap-1 z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-black text-white truncate">{user?.name}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate(`/${user.role}/profile`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl w-full cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </button>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate(`/${user.role}/profile`); // same setting route
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 rounded-xl w-full cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-950/20 rounded-xl w-full cursor-pointer transition-colors border-t border-slate-800 mt-1"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
