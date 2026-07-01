import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Activity, 
  Sparkles, 
  Check, 
  CalendarDays,
  FileText,
  Bookmark,
  Building,
  Heart,
  DollarSign,
  AlertTriangle,
  Stethoscope,
  Smile
} from 'lucide-react';

const BookingWizard = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: Physician, 2: Date, 3: Slot, 4: Symptoms, 5: Review, 6: Confirmation

  // Booking states
  const [selectedDate, setSelectedDate] = useState(''); 
  const [selectedTime, setSelectedTime] = useState(''); 
  const [symptoms, setSymptoms] = useState({
    text: '',
    duration: '',
    severity: 'low',
    currentMedication: '',
    allergies: '',
    notes: '',
  });

  // Time slot options
  const [slots, setSlots] = useState({ morning: [], afternoon: [], evening: [] });
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Custom Inline Calendar Month
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Cached AI Summary for Step 5
  const [aiPreview, setAiPreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await API.get(`/api/patients/doctors/${doctorId}`);
        if (response.data.success) {
          setDoctor(response.data.doctor);
        }
      } catch (error) {
        showToast('Error retrieving doctor details.', 'error');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId, navigate, showToast]);

  // Fetch slots whenever date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setSlotsLoading(true);
      setSelectedTime(''); // Reset slot
      try {
        const response = await API.get('/api/appointments/slots', {
          params: { doctorId, date: selectedDate }
        });
        if (response.data.success) {
          setSlots(response.data.categories);
        }
      } catch (error) {
        showToast('Failed to load available slots.', 'error');
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, doctorId, showToast]);

  const handleSymptomChange = (e) => {
    setSymptoms(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Fetch Gemini AI pre-visit summary for Step 5 Review
  const loadAiPreview = async () => {
    if (!symptoms.text || !symptoms.duration) {
      showToast('Please fill in symptom text and duration first.', 'error');
      return;
    }
    setStep(5);
    setAiLoading(true);
    setAiPreview(null);
    try {
      const response = await API.post('/api/appointments/analyze-symptoms', {
        ...symptoms
      });
      if (response.data.success) {
        setAiPreview(response.data.aiSummary);
      }
    } catch (error) {
      // Fallback in case of failures
      setAiPreview({
        urgencyLevel: 'Medium',
        chiefComplaint: symptoms.text,
        suggestedQuestions: [
          'How does this impact your daily activity?',
          'What worsens or relieves these symptoms?',
          'Are you experiencing fever or nausea?'
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setSaving(true);
    try {
      const response = await API.post('/api/appointments/book', {
        doctorId,
        date: selectedDate,
        time: selectedTime,
        symptoms,
        aiPreVisitSummary: aiPreview // Save cached summary
      });

      if (response.data.success) {
        showToast('Appointment booked successfully!', 'success');
        setStep(6); // Go to success confirmation screen
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Double booking collision. Slot already booked.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Custom calendar utilities
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDay).fill(null);
    const daysArr = [];
    for (let i = 1; i <= daysInMonth; i++) {
      daysArr.push(new Date(year, month, i));
    }
    return [...blanks, ...daysArr];
  };

  const isDateDisabled = (dayDate) => {
    if (!dayDate) return true;
    if (!doctor) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dayDate < today) return true;

    const dateStr = dayDate.toISOString().split('T')[0];
    if (doctor.leaveDates.includes(dateStr)) return true;

    const dayOfWeek = dayDate.getDay();
    if (!doctor.workingDays.includes(dayOfWeek)) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Preparing wizard...</span>
        </div>
      </div>
    );
  }

  const days = generateDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Static mock variables
  const mockFee = "$120";
  const mockHospital = "HealthHub General Hospital";

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      
      {/* Back button link */}
      {step < 6 && (
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel Booking
          </button>
        </div>
      )}

      {/* Stepper Steps (Step 1 to 5, hidden in Step 6 success) */}
      {step < 6 && (
        <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-custom shadow-soft dark:shadow-none mb-8 items-center justify-between overflow-x-auto gap-4">
          {[
            { num: 1, label: 'Physician' },
            { num: 2, label: 'Date' },
            { num: 3, label: 'Slot' },
            { num: 4, label: 'Symptoms' },
            { num: 5, label: 'Review' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.num 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-150 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-extrabold ${
                step >= s.num ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STEP WIZARD CONTENTS */}
      <AnimatePresence mode="wait">
        
        {/* Step 1: Choose Doctor */}
        {step === 1 && doctor && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 shadow-soft dark:shadow-none flex flex-col gap-6"
          >
            <div className="flex items-start gap-4">
              <img 
                src={doctor.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'} 
                alt={doctor.name} 
                className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 shrink-0"
              />
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dr. {doctor.name}</h2>
                <p className="text-sm font-bold text-primary dark:text-primary-light">{doctor.specialization}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">{doctor.qualification} | {doctor.experience} Years Exp.</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 flex flex-col gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <h3 className="text-slate-850 dark:text-slate-200 font-bold text-sm">Consultation Parameters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 block mb-1">Clinic Site</span>
                  <p className="text-slate-900 dark:text-slate-200 font-extrabold flex items-center gap-1"><Building className="w-3.5 h-3.5 text-primary" />{mockHospital}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 block mb-1">Shift Hours</span>
                  <p className="text-slate-900 dark:text-slate-200 font-extrabold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" />{doctor.workingHours.start} - {doctor.workingHours.end}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 block mb-1">Consultation Fee</span>
                  <p className="text-slate-900 dark:text-slate-200 font-extrabold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-accent" />{mockFee}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-primary w-full mt-4 cursor-pointer"
            >
              Select Consult Date
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Choose Date */}
        {step === 2 && doctor && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 shadow-soft dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-base text-slate-805 dark:text-white">Choose Consult Date</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {weekdays.map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((dayDate, index) => {
                if (!dayDate) return <div key={`blank-${index}`} className="aspect-square"></div>;
                
                const dateStr = dayDate.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const disabled = isDateDisabled(dayDate);
                const dayNum = dayDate.getDate();

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setStep(3);
                    }}
                    disabled={disabled}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-extrabold transition-all border ${
                      isSelected 
                        ? 'bg-primary border-primary text-white shadow-soft font-sans' 
                        : disabled 
                        ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-50 dark:border-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 cursor-pointer'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3: Choose Time Slot */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 shadow-soft dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-6 border-b border-slate-50 dark:border-slate-805/60 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Choose Time Slot</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Consulting Date: {selectedDate}</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
              >
                Change Date
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {['morning', 'afternoon', 'evening'].map((category) => {
                  const list = slots[category] || [];
                  if (list.length === 0) return null;

                  return (
                    <div key={category} className="flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 capitalize">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {category}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {list.map((slot) => {
                          const isSelected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={slot.isBooked}
                              onClick={() => {
                                setSelectedTime(slot.time);
                                setStep(4);
                              }}
                              className={`py-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-primary border-primary text-white shadow-soft' 
                                  : slot.isBooked 
                                  ? 'bg-slate-50 border-slate-100 text-slate-350 dark:bg-slate-800 dark:border-slate-900 dark:text-slate-700 cursor-not-allowed opacity-40 line-through' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Symptoms Form */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 shadow-soft dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50 dark:border-slate-850/60">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Pre-Visit Screening</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{selectedDate} | {selectedTime}</p>
              </div>
              <button
                onClick={() => setStep(3)}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
              >
                Change Time
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); loadAiPreview(); }} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-450" />
                  Describe Symptoms
                </label>
                <textarea
                  name="text"
                  value={symptoms.text}
                  onChange={handleSymptomChange}
                  className="form-input min-h-[90px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                  placeholder="e.g. Sharp pain in the chest, wheezing on deep breaths..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={symptoms.duration}
                    onChange={handleSymptomChange}
                    className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                    placeholder="e.g. 2 Days, 3 Weeks"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Severity</label>
                  <select
                    name="severity"
                    value={symptoms.severity}
                    onChange={handleSymptomChange}
                    className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                    style={{ paddingLeft: '1rem' }}
                  >
                    <option value="low">Low (Mild discomfort)</option>
                    <option value="medium">Medium (Moderate pain)</option>
                    <option value="high">High (Severe discomfort)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Current Medications</label>
                <input
                  type="text"
                  name="currentMedication"
                  value={symptoms.currentMedication}
                  onChange={handleSymptomChange}
                  className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                  placeholder="e.g. Aspirin 81mg, none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-widest">Known Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={symptoms.allergies}
                  onChange={handleSymptomChange}
                  className="form-input text-red-500 bg-white dark:bg-slate-955 dark:border-slate-800"
                  placeholder="e.g. Penicillin, peanuts"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Additional Notes</label>
                <textarea
                  name="notes"
                  value={symptoms.notes}
                  onChange={handleSymptomChange}
                  className="form-input min-h-[60px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                  placeholder="Any details you wish doctor to know beforehand..."
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full mt-4 cursor-pointer"
              >
                Proceed to Review Booking
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 5: Review & AI pre-visit analysis preview */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-8 shadow-soft dark:shadow-none flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Verify Appointment Details</h3>
              <button
                onClick={() => setStep(4)}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
              >
                Edit Symptoms
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-605 dark:text-slate-400">
              <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-150/40 pb-1">Consulting Details</span>
                <div className="flex justify-between"><span>Physician:</span><span className="text-slate-950 dark:text-white font-extrabold">Dr. {doctor?.name}</span></div>
                <div className="flex justify-between"><span>Specialty:</span><span className="text-slate-950 dark:text-white font-extrabold">{doctor?.specialization}</span></div>
                <div className="flex justify-between"><span>Date:</span><span className="text-slate-950 dark:text-white font-extrabold">{selectedDate}</span></div>
                <div className="flex justify-between"><span>Time Slot:</span><span className="text-slate-950 dark:text-white font-extrabold">{selectedTime}</span></div>
                <div className="flex justify-between"><span>Facility:</span><span className="text-slate-950 dark:text-white font-extrabold">{mockHospital}</span></div>
                <div className="flex justify-between"><span>Fee:</span><span className="text-slate-950 dark:text-white font-extrabold">{mockFee}</span></div>
              </div>

              {/* AI Pre-Visit Synopsis Preview */}
              <div className="p-5 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 rounded-2xl border border-primary/10 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-30%] right-[-30%] w-24 h-24 rounded-full bg-primary/10 blur-xl"></div>

                {aiLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">Gemini analyzing symptoms...</span>
                  </div>
                ) : aiPreview ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-primary dark:text-primary-light uppercase tracking-widest block border-b border-primary/10 pb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                      Gemini Clinical Analysis
                    </span>
                    <div className="flex justify-between items-center">
                      <span>Urgency Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        aiPreview.urgencyLevel.toLowerCase().includes('high')
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/20'
                          : 'bg-green-150 text-accent dark:bg-green-950/20 dark:text-green-400 border border-green-200/20'
                      }`}>
                        {aiPreview.urgencyLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Chief Complaint:</span>
                      <p className="text-slate-900 dark:text-slate-200 leading-normal font-bold">{aiPreview.chiefComplaint}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">Preview currently unavailable.</div>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={saving}
              className="btn-primary w-full mt-4 cursor-pointer"
            >
              {saving ? 'Finalizing Appointment...' : 'Complete Booking'}
            </button>
          </motion.div>
        )}

        {/* Step 6: Confirmation Screen */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-10 text-center shadow-soft dark:shadow-none flex flex-col items-center max-w-md mx-auto"
          >
            {/* Animated Success Check circle */}
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/40 text-accent flex items-center justify-center border border-green-100 dark:border-green-900/60 mb-6 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Check className="w-8 h-8" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Booking Confirmed!</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wider">Scheduled with Dr. {doctor?.name}</p>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl w-full my-6 text-xs font-semibold text-slate-600 dark:text-slate-400 flex flex-col gap-2">
              <div className="flex justify-between"><span>Date:</span><span className="text-slate-900 dark:text-slate-200 font-bold">{selectedDate}</span></div>
              <div className="flex justify-between"><span>Time Slot:</span><span className="text-slate-900 dark:text-slate-200 font-bold">{selectedTime}</span></div>
              <div className="flex justify-between"><span>Location:</span><span className="text-slate-900 dark:text-slate-200 font-bold">HealthHub Virtual Clinic</span></div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              A calendar invitation has been sent to your email with meeting details. You will receive notification alerts prior to the slot.
            </p>

            <button
              onClick={() => navigate('/patient/dashboard')}
              className="btn-primary w-full cursor-pointer"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default BookingWizard;
