import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  Search, 
  Calendar, 
  Star, 
  Clock, 
  Filter, 
  Sparkles, 
  AlertCircle,
  Heart,
  DollarSign,
  Building,
  Languages,
  Activity,
  HeartOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorSearch = () => {
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('favorite_doctors')) || [];
  });

  // Search parameters state
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [minExperience, setMinExperience] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (name) params.name = name;
      if (specialization) params.specialization = specialization;
      if (minExperience) params.experience = minExperience;

      // Note: Endpoint resolved through api.js prefixing
      const response = await API.get('/api/patients/doctors', { params });
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      showToast('Error searching doctor listings.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [name, specialization, minExperience]);

  const handleBook = (doctorId) => {
    navigate(`/patient/book/${doctorId}`);
  };

  const toggleFavorite = (doctorId) => {
    let updated;
    if (favorites.includes(doctorId)) {
      updated = favorites.filter(id => id !== doctorId);
      showToast('Removed from favorites.', 'info');
    } else {
      updated = [...favorites, doctorId];
      showToast('Added to favorites!', 'success');
    }
    setFavorites(updated);
    localStorage.setItem('favorite_doctors', JSON.stringify(updated));
  };

  const isDoctorAvailableToday = (doctor) => {
    const today = new Date();
    const dayNum = today.getDay(); // 0 to 6
    const dateStr = today.toISOString().split('T')[0];

    if (doctor.leaveDates.includes(dateStr)) return false;
    return doctor.workingDays.includes(dayNum);
  };

  // Mock static values for fields not stored in core schema
  const getMockDetails = (doctorName) => {
    const hash = doctorName.charCodeAt(0) + doctorName.charCodeAt(doctorName.length - 1);
    const languages = hash % 2 === 0 ? "English, Spanish" : "English, Mandarin, Hindi";
    const hospital = hash % 3 === 0 
      ? "HealthHub Medical Center" 
      : hash % 3 === 1 
      ? "St. Jude Clinic Complex" 
      : "Mercy General Hospital";
    const fee = hash % 2 === 0 ? "$95" : "$120";
    const rating = (4.5 + (hash % 6) * 0.1).toFixed(1);
    const reviews = 50 + (hash % 120);

    return { languages, hospital, fee, rating, reviews };
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-905 dark:text-white tracking-tight">Search Doctors</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Find clinic specialists, check weekly schedules, and book checkups.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-custom shadow-soft dark:shadow-none mb-8 flex flex-col gap-4">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Filter className="w-4 h-4" />
          Filter Directory
        </span>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input pl-11 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              placeholder="Search doctor by name..."
            />
          </div>

          {/* Specialization Search */}
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            style={{ paddingLeft: '1rem' }}
          >
            <option value="">All Specializations</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Mental Health">Mental Health</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Gynecology">Gynecology</option>
            <option value="Dentistry">Dentistry</option>
            <option value="ENT">ENT</option>
          </select>

          {/* Experience Search */}
          <select
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
            style={{ paddingLeft: '1rem' }}
          >
            <option value="">Any Experience Level</option>
            <option value="5">5+ Years</option>
            <option value="10">10+ Years</option>
            <option value="15">15+ Years</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-16 text-center shadow-soft dark:shadow-none flex flex-col items-center">
          <HeartOff className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-350 font-sans">No matching doctors found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-6">Adjust your search parameters or check our full directory.</p>
          <button 
            onClick={() => {
              setName('');
              setSpecialization('');
              setMinExperience('');
            }} 
            className="btn-primary mx-auto"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => {
            const availableToday = isDoctorAvailableToday(doctor);
            const isFav = favorites.includes(doctor._id);
            const mocks = getMockDetails(doctor.name);

            return (
              <motion.div 
                key={doctor._id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom shadow-soft dark:shadow-none overflow-hidden flex flex-col justify-between"
              >
                {/* Doctor Bio Header */}
                <div className="p-6 border-b border-slate-50 dark:border-slate-800/60 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300'} 
                      alt={doctor.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800"
                    />
                    <div className="overflow-hidden">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">{doctor.name}</h3>
                      <p className="text-xs font-bold text-primary dark:text-primary-light truncate mt-0.5">{doctor.specialization}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-1">{doctor.qualification}</p>
                    </div>
                  </div>
                  
                  {/* Favorite Toggle Button */}
                  <button 
                    onClick={() => toggleFavorite(doctor._id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isFav 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 text-red-500' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-50/50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                  </button>
                </div>

                {/* Details list */}
                <div className="p-6 bg-slate-50/40 dark:bg-slate-950/10 flex flex-col gap-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Experience:</span>
                    <span className="text-slate-900 dark:text-slate-200">{doctor.experience} Years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> Facility:</span>
                    <span className="text-slate-950 dark:text-slate-200 text-right truncate w-40" title={mocks.hospital}>{mocks.hospital}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5 text-slate-400" /> Languages:</span>
                    <span className="text-slate-950 dark:text-slate-200">{mocks.languages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> Consult Fee:</span>
                    <span className="text-slate-950 dark:text-slate-200 font-extrabold">{mocks.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratings (UI only):</span>
                    <span className="text-slate-950 dark:text-slate-200 flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                      {mocks.rating} ({mocks.reviews} Reviews)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Available Today:</span>
                    {availableToday ? (
                      <span className="text-accent bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900/40 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">Yes</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">Offline</span>
                    )}
                  </div>
                </div>

                {/* Booking Trigger Footer */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => handleBook(doctor._id)}
                    className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Consultation
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
