import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  User, 
  Activity, 
  Sparkles, 
  ClipboardList, 
  Pill, 
  FileText, 
  ArrowLeft, 
  Save, 
  HeartHandshake 
} from 'lucide-react';

const ConsultationPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Consult Notes Form
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await API.get(`/api/appointments/${id}`);
        if (response.data.success) {
          setAppointment(response.data.appointment);
          // Set initial values if doctor returns to edit completed consult
          setDiagnosis(response.data.appointment.diagnosis || '');
          setPrescription(response.data.appointment.prescription || '');
          setClinicalNotes(response.data.appointment.clinicalNotes || '');
        }
      } catch (error) {
        showToast('Error loading appointment clinical file.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis || !clinicalNotes) {
      showToast('Please provide a diagnosis and clinical notes.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await API.put(`/api/doctors/appointments/${id}/consultation`, {
        diagnosis,
        prescription,
        clinicalNotes
      });

      if (response.data.success) {
        showToast('Consultation saved. Recovery guides and medication reminders generated!', 'success');
        navigate('/doctor/dashboard');
      }
    } catch (error) {
      showToast('Failed to save consultation details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading patient file...</span>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-slate-500">Appointment files not found.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  const patient = appointment.patientId;
  const symptoms = appointment.symptoms;
  const preVisit = appointment.aiPreVisitSummary;

  // Calculate age
  let age = 'N/A';
  if (patient?.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    age = currentYear - birthYear;
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Back Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-xs font-bold text-slate-400">Appointment ID: {appointment._id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Profile, Symptoms, AI pre-visit summary (Spans 1) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Patient Card */}
          <div className="bg-white border border-slate-100 p-6 rounded-custom shadow-soft">
            <h3 className="font-bold text-base text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
              <User className="w-5 h-5 text-primary" />
              Patient Profile
            </h3>
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="text-slate-900">{patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Gender:</span>
                <span className="text-slate-900 capitalize">{patient?.gender}</span>
              </div>
              <div className="flex justify-between">
                <span>Age:</span>
                <span className="text-slate-900">{age} Years</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="text-slate-900">{patient?.phone}</span>
              </div>
              {patient?.medicalHistory && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="block mb-1 text-slate-500">Medical History:</span>
                  <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{patient.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>

          {/* Symptom Card */}
          <div className="bg-white border border-slate-100 p-6 rounded-custom shadow-soft">
            <h3 className="font-bold text-base text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
              <Activity className="w-5 h-5 text-primary" />
              Symptom Details
            </h3>
            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-slate-500">Chief Complaint:</span>
                <p className="text-slate-900 font-bold mt-1 text-sm">{symptoms.text}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <p className="text-slate-900 font-bold mt-0.5">{symptoms.duration}</p>
                </div>
                <div>
                  <span className="text-slate-500">Severity:</span>
                  <p className="text-slate-900 font-bold capitalize mt-0.5">{symptoms.severity}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Current Medications:</span>
                <p className="text-slate-900 font-medium mt-0.5">{symptoms.currentMedication || 'None declared'}</p>
              </div>
              <div>
                <span className="text-slate-500">Allergies:</span>
                <p className="text-slate-900 font-medium mt-0.5 text-red-500">{symptoms.allergies || 'None declared'}</p>
              </div>
            </div>
          </div>

          {/* AI Pre-Visit Summary */}
          <div className="bg-white border border-slate-100 p-6 rounded-custom shadow-soft relative overflow-hidden">
            {/* Background sparkle blur */}
            <div className="absolute top-[-30%] right-[-30%] w-24 h-24 rounded-full bg-primary/10 blur-xl"></div>
            
            <h3 className="font-bold text-base text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Pre-Visit Assessment
            </h3>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-slate-500">Urgency Level:</span>
                <span className={`block w-fit px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${
                  preVisit.urgencyLevel.toLowerCase().includes('high')
                    ? 'bg-red-100 text-red-700'
                    : preVisit.urgencyLevel.toLowerCase().includes('medium')
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {preVisit.urgencyLevel}
                </span>
              </div>

              <div>
                <span className="text-slate-500">AI Chief Complaint:</span>
                <p className="text-slate-900 mt-1 leading-relaxed">{preVisit.chiefComplaint}</p>
              </div>

              {preVisit.suggestedQuestions && preVisit.suggestedQuestions.length > 0 && (
                <div>
                  <span className="text-slate-500 block mb-1.5">Suggested Interview Questions:</span>
                  <ul className="flex flex-col gap-2 list-none">
                    {preVisit.suggestedQuestions.map((q, idx) => (
                      <li key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 font-medium leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Consultation entry form (Spans 2) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-custom p-8 shadow-soft">
            <h3 className="font-bold text-base text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
              Document Consultation
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Diagnosis */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <HeartHandshake className="w-4 h-4 text-slate-400" />
                  Primary Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="form-input font-bold"
                  placeholder="e.g. Acute Viral Bronchitis"
                  required
                />
              </div>

              {/* Prescription */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Pill className="w-4 h-4 text-slate-400" />
                  Medications & Prescription
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="form-input min-h-[100px]"
                  placeholder="Format line by line:&#10;Amoxicillin 500mg - Twice Daily - 7 days&#10;Paracetamol 650mg - Night - 3 days"
                />
                <span className="text-[10px] text-slate-400 leading-normal">
                  Write each medication on a new line. The platform will automatically parse frequency tags (Morning, Night, Once Daily, Twice Daily) and create active notification reminders for the patient.
                </span>
              </div>

              {/* Clinical Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Clinical / Progress Notes
                </label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="form-input min-h-[160px]"
                  placeholder="Enter private clinical findings, symptoms observations, recovery advice, precautions, or follow-up timelines..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full mt-4"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving & Generating AI Guides...' : 'Complete Consultation & Save'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPanel;
