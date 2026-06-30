import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CalendarDays, 
  Activity, 
  ToggleLeft, 
  ToggleRight, 
  X, 
  UserPlus 
} from 'lucide-react';

const DoctorManagement = () => {
  const { showToast } = useContext(ToastContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Doctor form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  // Leave Form State
  const [leaveDate, setLeaveDate] = useState('');

  const fetchDoctors = async () => {
    try {
      const response = await API.get('/api/admin/doctors');
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      showToast('Error loading doctors directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleToggleActive = async (doctor) => {
    try {
      const response = await API.patch(`/api/admin/doctors/${doctor._id}/toggle`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setDoctors(prev => 
          prev.map(d => d._id === doctor._id ? { ...d, isActive: response.data.doctor.isActive } : d)
        );
      }
    } catch (error) {
      showToast('Failed to toggle doctor status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor? All their upcoming appointments will be cancelled.')) return;
    try {
      const response = await API.delete(`/api/admin/doctors/${id}`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setDoctors(prev => prev.filter(d => d._id !== id));
      }
    } catch (error) {
      showToast('Error deleting doctor profile.', 'error');
    }
  };

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

  const openCreateModal = () => {
    setSelectedDoctor(null);
    setFormData({
      email: '',
      password: '',
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
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      email: doctor.userId?.email || '',
      password: 'UNCHANGED_MOCK_VAL', // Placeholder bypass
      name: doctor.name,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: String(doctor.experience),
      workingDays: doctor.workingDays,
      workingHoursStart: doctor.workingHours.start,
      workingHoursEnd: doctor.workingHours.end,
      slotDuration: String(doctor.slotDuration),
      maxPatientsPerDay: String(doctor.maxPatientsPerDay),
      profilePhoto: doctor.profilePhoto || '',
    });
    setShowModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      workingHours: {
        start: formData.workingHoursStart,
        end: formData.workingHoursEnd
      }
    };

    try {
      if (selectedDoctor) {
        // Edit Mode
        // We delete password from updates if it was unchanged placeholder
        if (payload.password === 'UNCHANGED_MOCK_VAL') {
          delete payload.password;
        }
        // Admin edits email? In our schema email is in User. Let's send update
        const response = await API.put(`/api/admin/doctors/${selectedDoctor._id}`, payload);
        if (response.data.success) {
          showToast('Doctor profile updated successfully.', 'success');
          setShowModal(false);
          fetchDoctors();
        }
      } else {
        // Create Mode
        const response = await API.post('/api/admin/doctors', payload);
        if (response.data.success) {
          showToast('New doctor profile created successfully!', 'success');
          setShowModal(false);
          fetchDoctors();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving doctor details.', 'error');
    }
  };

  const openLeaveModal = (doctor) => {
    setSelectedDoctor(doctor);
    setLeaveDate('');
    setShowLeaveModal(true);
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) return;

    // Check if leave date is in past
    const today = new Date().toISOString().split('T')[0];
    if (leaveDate < today) {
      showToast('Cannot add leave dates in the past.', 'error');
      return;
    }

    if (selectedDoctor.leaveDates.includes(leaveDate)) {
      showToast('Leave date already scheduled.', 'error');
      return;
    }

    const updatedLeaveDates = [...selectedDoctor.leaveDates, leaveDate].sort();

    try {
      const response = await API.put(`/api/admin/doctors/${selectedDoctor._id}`, {
        leaveDates: updatedLeaveDates
      });
      if (response.data.success) {
        showToast('Leave date scheduled. Conflicting appointments cancelled.', 'success');
        setSelectedDoctor(response.data.doctor);
        // Refresh doctor list
        setDoctors(prev => 
          prev.map(d => d._id === selectedDoctor._id ? { ...d, leaveDates: response.data.doctor.leaveDates } : d)
        );
      }
    } catch (error) {
      showToast('Error scheduling leave date.', 'error');
    }
  };

  const handleRemoveLeave = async (dateToRemove) => {
    const updatedLeaveDates = selectedDoctor.leaveDates.filter(d => d !== dateToRemove);
    try {
      const response = await API.put(`/api/admin/doctors/${selectedDoctor._id}`, {
        leaveDates: updatedLeaveDates
      });
      if (response.data.success) {
        showToast('Leave date removed successfully.', 'success');
        setSelectedDoctor(response.data.doctor);
        setDoctors(prev => 
          prev.map(d => d._id === selectedDoctor._id ? { ...d, leaveDates: response.data.doctor.leaveDates } : d)
        );
      }
    } catch (error) {
      showToast('Error removing leave date.', 'error');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Doctor Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Add, manage, and schedule availability parameters for physicians.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <UserPlus className="w-5 h-5" />
          Add New Doctor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-custom p-16 text-center shadow-soft">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">No doctors registered</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">Start by adding a doctor profile to the network.</p>
          <button onClick={openCreateModal} className="btn-primary mx-auto">Add Doctor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="bg-white border border-slate-100 rounded-custom shadow-soft overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Doctor Details Header */}
              <div className="p-6 border-b border-slate-50 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl uppercase shrink-0">
                  {doctor.name[0]}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-base text-slate-800 truncate">{doctor.name}</h3>
                  <p className="text-xs font-bold text-primary truncate">{doctor.specialization}</p>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">{doctor.qualification}</p>
                </div>
              </div>

              {/* Stats/Configuration */}
              <div className="p-6 bg-slate-50/50 flex flex-col gap-3 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span className="text-slate-900">{doctor.experience} Years</span>
                </div>
                <div className="flex justify-between">
                  <span>Hours:</span>
                  <span className="text-slate-900">{doctor.workingHours.start} - {doctor.workingHours.end}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-slate-900">{doctor.slotDuration} mins / slot</span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Leaves:</span>
                  <span className="text-slate-900 font-bold">{doctor.leaveDates.length} Dates</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-white border-t border-slate-50 flex items-center justify-between">
                {/* Active switch */}
                <button
                  onClick={() => handleToggleActive(doctor)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {doctor.isActive ? (
                    <>
                      <ToggleRight className="w-6 h-6 text-accent" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-6 h-6 text-slate-300" />
                      Inactive
                    </>
                  )}
                </button>

                {/* Edit, Leave Calendar, Delete buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openLeaveModal(doctor)}
                    className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                    title="Schedule Leaves"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(doctor)}
                    className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-50 rounded-lg transition-all"
                    title="Edit Profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor._id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"
                    title="Delete Physician"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-out / Modal: Save Doctor Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-custom max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {selectedDoctor ? 'Modify Doctor Profile' : 'Register Doctor Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="form-input"
                    disabled={!!selectedDoctor}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedDoctor ? 'Password (Leave to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password === 'UNCHANGED_MOCK_VAL' ? '' : formData.password}
                    onChange={handleFormChange}
                    className="form-input"
                    required={!selectedDoctor}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Pediatrics, etc."
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="MD, MBBS"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700">Availability Parameters</span>
                
                {/* Working Days */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Working Days</label>
                  <div className="flex gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                      const isActive = formData.workingDays.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleWorkingDaysToggle(idx)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                            isActive 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Hours</label>
                    <input
                      type="time"
                      name="workingHoursStart"
                      value={formData.workingHoursStart}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Hours</label>
                    <input
                      type="time"
                      name="workingHoursEnd"
                      value={formData.workingHoursEnd}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                {/* Slot Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slot Duration (Min)</label>
                    <input
                      type="number"
                      name="slotDuration"
                      value={formData.slotDuration}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Patients / Day</label>
                    <input
                      type="number"
                      name="maxPatientsPerDay"
                      value={formData.maxPatientsPerDay}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out / Modal: Leave Calendar Scheduler */}
      {showLeaveModal && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-custom max-w-md w-full shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800">Leave Dates Scheduler</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Dr. {selectedDoctor.name}</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Form to add leave date */}
              <form onSubmit={handleAddLeave} className="flex gap-2">
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="form-input flex-1"
                  required
                />
                <button type="submit" className="btn-primary py-2 px-4">
                  Schedule
                </button>
              </form>

              {/* Display existing leaves */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Leave Dates</span>
                {selectedDoctor.leaveDates.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl">
                    No scheduled leaves yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                    {selectedDoctor.leaveDates.map((date) => (
                      <div
                        key={date}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-700 text-xs font-bold"
                      >
                        {date}
                        <button
                          type="button"
                          onClick={() => handleRemoveLeave(date)}
                          className="hover:text-red-950 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-red-500 bg-red-50/50 border border-red-100 p-3 rounded-xl leading-normal mt-2">
                <strong>Important Notice:</strong> Adding a leave date will automatically cancel any booked/rescheduled appointments on that date, remove them from Google Calendar, and send email notifications to the patients.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;
