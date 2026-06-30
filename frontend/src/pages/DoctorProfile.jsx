import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { Save, Calendar, Clock, Sparkles } from 'lucide-react';

const DoctorProfile = () => {
  const { showToast } = useContext(ToastContext);
  const { updateProfileState } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    slotDuration: '30',
    maxPatientsPerDay: '15',
    profilePhoto: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/api/doctors/profile');
        if (response.data.success) {
          const doc = response.data.doctor;
          setFormData({
            name: doc.name,
            phone: doc.phone,
            specialization: doc.specialization,
            qualification: doc.qualification,
            experience: String(doc.experience),
            workingDays: doc.workingDays,
            workingHoursStart: doc.workingHours.start,
            workingHoursEnd: doc.workingHours.end,
            slotDuration: String(doc.slotDuration),
            maxPatientsPerDay: String(doc.maxPatientsPerDay),
            profilePhoto: doc.profilePhoto || '',
          });
        }
      } catch (error) {
        showToast('Error loading profile details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleWorkingDaysToggle = (dayNum) => {
    setFormData(prev => {
      const days = [...prev.workingDays];
      if (days.includes(dayNum)) {
        return { ...prev, workingDays: days.filter(d => d !== dayNum) };
      } else {
        return { ...prev, workingDays: [...days, dayNum].sort() };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      workingHours: {
        start: formData.workingHoursStart,
        end: formData.workingHoursEnd
      }
    };

    try {
      const response = await API.put('/api/doctors/profile', payload);
      if (response.data.success) {
        showToast('Schedule and profile parameters saved successfully.', 'success');
        updateProfileState(response.data.doctor);
      }
    } catch (error) {
      showToast('Error updating profile configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Availability & Profile Setup</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Configure clinic working days, consult slot durations, and bio.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-custom shadow-soft dark:shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-6 flex flex-col gap-5">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Work Schedule
            </h3>

            {/* Working Days */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                  const isActive = formData.workingDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleWorkingDaysToggle(idx)}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-primary dark:text-primary-light shadow-sm dark:bg-primary/20 dark:border-primary/80' 
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Shift Start Time
                </label>
                <input
                  type="time"
                  name="workingHoursStart"
                  value={formData.workingHoursStart}
                  onChange={handleFormChange}
                  className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Shift End Time
                </label>
                <input
                  type="time"
                  name="workingHoursEnd"
                  value={formData.workingHoursEnd}
                  onChange={handleFormChange}
                  className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Slot details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slot duration (Minutes)</label>
                <input
                  type="number"
                  name="slotDuration"
                  value={formData.slotDuration}
                  onChange={handleFormChange}
                  className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maximum Daily Patient Capacity</label>
                <input
                  type="number"
                  name="maxPatientsPerDay"
                  value={formData.maxPatientsPerDay}
                  onChange={handleFormChange}
                  className="form-input bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full mt-4 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving updates...' : 'Save Availability Parameters'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;
