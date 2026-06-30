import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, KeyRound, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, gender, dateOfBirth, password } = formData;

    if (!name || !email || !phone || !gender || !dateOfBirth || !password) {
      showToast('All fields are required.', 'error');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      password
    });
    setLoading(false);

    if (result.success) {
      showToast('Patient account created successfully!', 'success');
      navigate('/patient/dashboard');
    } else {
      showToast(result.message || 'Registration failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      
      {/* Brand left panel (Desktop only) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] rounded-full bg-gradient-to-tr from-primary/30 to-transparent blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-[120px]"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xl">
            H
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            HealthHub AI
          </span>
        </div>

        <div className="max-w-lg relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full inline-block mb-6">
            Instant Enrollment
          </span>
          <h2 className="text-5xl font-black leading-[1.1] mb-6 tracking-tight bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">
            Create Your Health Account
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-6">
            Register in seconds. Schedule consultations, manage prescriptions, and review secure recovery advice anywhere, at any time.
          </p>

          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md max-w-sm">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-300 leading-normal">
              HIPAA compliant, end-to-end encrypted medical files database.
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold relative z-10 flex justify-between items-center">
          <span>&copy; 2026 HealthHub AI Clinic Network</span>
          <span>v2.1.0</span>
        </div>
      </div>

      {/* Register Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-[10%] left-[10%] w-[45%] h-[45%] rounded-full bg-primary/5 dark:bg-primary/10 blur-[80px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-white/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 rounded-custom shadow-soft dark:shadow-none backdrop-blur-md relative z-10 my-8"
        >
          <div className="mb-6 text-center sm:text-left">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Enter details to generate your patient profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input pl-11 bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-11 bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                  placeholder="johndoe@email.com"
                  required
                />
              </div>
            </div>

            {/* Grid for Phone and Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input pl-11 bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                    placeholder="+1 (555) 019-9988"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-input bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                  style={{ paddingLeft: '1rem' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Grid for DOB and Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date of Birth</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="form-input pl-11 text-slate-500 bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input pl-11 bg-white dark:bg-slate-900/45 dark:border-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Profile...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Already have an account? </span>
            <Link
              to="/login"
              className="text-xs font-bold text-primary hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
