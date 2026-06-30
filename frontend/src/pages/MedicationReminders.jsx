import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { Pill, AlertCircle, ToggleLeft, ToggleRight, Calendar, User, Clock } from 'lucide-react';

const MedicationReminders = () => {
  const { showToast } = useContext(ToastContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const response = await API.get('/api/patients/reminders');
      if (response.data.success) {
        setReminders(response.data.reminders);
      }
    } catch (error) {
      showToast('Error loading medication reminders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleToggleActive = async (reminderId) => {
    try {
      const response = await API.patch(`/api/patients/reminders/${reminderId}/toggle`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setReminders(prev => 
          prev.map(rem => rem._id === reminderId ? { ...rem, isActive: response.data.reminder.isActive } : rem)
        );
      }
    } catch (error) {
      showToast('Error toggling reminder status.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-customBg dark:bg-slate-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading prescription logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full bg-customBg dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Medication Reminders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Keep track of your drug schedule and daily alerts.</p>
      </div>

      {reminders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-custom p-16 text-center shadow-soft dark:shadow-none flex flex-col items-center">
          <Pill className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-4 animate-bounce" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">No medication schedules found</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Prescribed medications from your doctor will automatically appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reminders.map((reminder) => {
            const startDate = new Date(reminder.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const endDate = new Date(reminder.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const doctorName = reminder.appointmentId?.doctorId?.name || 'Your Physician';

            return (
              <div 
                key={reminder._id} 
                className={`bg-white dark:bg-slate-900 border rounded-custom shadow-soft dark:shadow-none p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-200 ${
                  reminder.isActive 
                    ? 'border-slate-100 dark:border-slate-800/80' 
                    : 'border-slate-200 dark:border-slate-800/40 opacity-60 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border shrink-0 ${
                    reminder.isActive 
                      ? 'bg-green-50 dark:bg-green-950/20 text-accent border-green-150 dark:border-green-900/40' 
                      : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-550 border-slate-205 dark:border-slate-800'
                  }`}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{reminder.medicineName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-405 font-bold mt-0.5">Dosage: {reminder.dosage}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {startDate} - {endDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Dr. {doctorName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0 gap-6">
                  {/* Frequency badge */}
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg">
                    {reminder.frequency}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleActive(reminder._id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {reminder.isActive ? (
                      <>
                        <ToggleRight className="w-7 h-7 text-accent" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-7 h-7 text-slate-350 dark:text-slate-700" />
                        Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicationReminders;
