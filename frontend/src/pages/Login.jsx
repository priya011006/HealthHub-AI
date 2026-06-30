import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Stethoscope, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles,
  Calendar,
  ClipboardList,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Login = () => {
  const { login } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // patient, doctor, admin
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      showToast('Logged in successfully!', 'success');
      if (role === 'patient') navigate('/patient/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } else {
      showToast(result.message || 'Invalid credentials.', 'error');
    }
  };

  const demoAccounts = [
    { id: 'patient', label: 'Patient', email: 'patient@healthhub.com', password: 'HealthHub123' },
    { id: 'doctor', label: 'Doctor', email: 'doctor@healthhub.com', password: 'HealthHub123' },
    { id: 'admin', label: 'Admin', email: 'admin@healthhub.com', password: 'HealthHub123' }
  ];

  const handleAutofillAndLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setRole(account.id);
    showToast(`Autofilled ${account.label} credentials! Logging in...`, 'success');
    setLoading(true);
    const result = await login(account.email, account.password);
    setLoading(false);

    if (result.success) {
      showToast('Logged in successfully!', 'success');
      if (account.id === 'patient') navigate('/patient/dashboard');
      else if (account.id === 'doctor') navigate('/doctor/dashboard');
      else if (account.id === 'admin') navigate('/admin/dashboard');
    } else {
      showToast(result.message || 'Invalid credentials.', 'error');
    }
  };

  const handleCopy = async (account) => {
    try {
      await navigator.clipboard.writeText(`Email: ${account.email}\nPassword: ${account.password}`);
      setCopiedAccount(account.id);
      showToast(`Copied ${account.label} credentials!`, 'success');
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (error) {
      showToast('Failed to copy credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 transition-colors duration-300 overflow-hidden">
      
      {/* Brand Left Panel (Desktop only) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] rounded-full bg-gradient-to-tr from-primary/30 to-transparent blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-[120px] animate-pulse"></div>

        {/* Top Branding */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary/20">
            H
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            HealthHub AI
          </span>
        </div>

        {/* Middle Copy */}
        <div className="max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full inline-block mb-6">
              Platform Overview
            </span>
            <h2 className="text-5xl font-black leading-[1.1] mb-6 font-sans tracking-tight bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">
              Healthcare Appointment & Recovery Platform
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-8">
              Experience the next generation of smart healthcare. Schedule visits, connect with specialists, and receive layperson summaries generated by Google Gemini.
            </p>
          </motion.div>

          {/* Grid of Key Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'AI pre-visit analysis', icon: Sparkles },
              { label: 'Google Calendar sync', icon: Calendar },
              { label: 'Prescription reminders', icon: ClipboardList },
              { label: 'Patient follow-up hubs', icon: Stethoscope },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                  <div className="p-2 bg-primary/20 text-primary rounded-xl">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 font-semibold relative z-10 flex justify-between items-center">
          <span>&copy; 2026 HealthHub AI Clinic Network</span>
          <span>v2.1.0</span>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[80px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-custom shadow-soft backdrop-blur-md relative z-10"
        >
          <div className="mb-8 text-center sm:text-left">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Sign In</h3>
            <p className="text-sm text-slate-400 mt-1.5">Configure your parameters and log in.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Role Cards (Replaces Tabs) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Portal Role</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                { id: 'patient', label: 'Patient', icon: User, desc: 'Patient Portal' },
                { id: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Doctor Portal' },
                { id: 'admin', label: 'Admin', icon: ShieldAlert, desc: 'Admin Console' }
              ].map((item) => {
                  const Icon = item.icon;
                  const isActive = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`p-4 border rounded-2xl flex flex-col items-center text-center gap-2 transition-all duration-300 group cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 border-primary/80 text-primary shadow-soft'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-tight">{item.label}</p>
                        <p className="text-[9px] font-medium text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input bg-slate-900/45 border-slate-800 text-white"
                placeholder="name@healthhub.com"
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <a href="#forgot" className="text-[10px] font-bold text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-11 bg-slate-900/45 border-slate-800 text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 accent-primary"
                />
                <span className="text-xs font-semibold text-slate-400">Remember session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 cursor-pointer relative"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-300">Demo Accounts</span>
              </div>
              {showDemoCredentials ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            <AnimatePresence>
              {showDemoCredentials && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2">
                    {demoAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-200">{account.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Email: {account.email}</p>
                          <p className="text-[10px] text-slate-400">Password: {account.password}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAutofillAndLogin(account)}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            Autofill & Login
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(account)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            {copiedAccount === account.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Patient Register link */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium">New patient? </span>
            <Link
              to="/register"
              className="text-xs font-bold text-primary hover:underline transition-colors"
            >
              Create patient profile
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
