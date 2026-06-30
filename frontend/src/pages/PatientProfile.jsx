import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { Save, User, Calendar, Phone, Heart } from 'lucide-react';

const PatientProfile = () => {
  const { showToast } = useContext(ToastContext);
  const { updateProfileState } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    medicalHistory: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/api/patients/profile');
        if (response.data.success) {
          const pat = response.data.patient;
          setFormData({
            name: pat.name,
            phone: pat.phone,
            gender: pat.gender || 'male',
            dateOfBirth: pat.dateOfBirth ? pat.dateOfBirth.split('T')[0] : '',
            medicalHistory: pat.medicalHistory || '',
          });
        }
      } catch (error) {
        showToast('Error loading profile information.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await API.put('/api/patients/profile', formData);
      if (response.data.success) {
        showToast('Health card profile updated successfully!', 'success');
        updateProfileState(response.data.patient);
      }
    } catch (error) {
      showToast('Error saving profile details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Personal Health Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your contact information and general health history records.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-custom shadow-soft dark:shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <User className="w-5 h-5 text-primary" />
            General Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
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
                className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
                className="form-input text-slate-500 bg-white dark:bg-slate-955 dark:border-slate-800 dark:text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className="form-input bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                style={{ paddingLeft: '1rem' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Medical History
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Declare chronic conditions, allergies, or past surgeries</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleFormChange}
                className="form-input min-h-[140px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                placeholder="e.g. Type-2 Diabetes diagnosed in 2021. Allergy to penicillin. Appendectomy in 2018."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full mt-4 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
