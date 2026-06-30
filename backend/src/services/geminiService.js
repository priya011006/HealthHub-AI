const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

const getGenAIInstance = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. AI features will fallback to default values.');
      return null;
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Extracts and parses JSON block from LLM output text.
 * Handles cases where LLM wraps response in ```json ... ```
 */
const parseJSONResponse = (text) => {
  try {
    const cleanText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse JSON response from Gemini:', text, error);
    throw new Error('Invalid JSON structure returned from AI');
  }
};

/**
 * Analyze pre-visit symptoms using Gemini
 */
const analyzeSymptoms = async (symptomsData) => {
  const client = getGenAIInstance();
  if (!client) {
    return getPreVisitFallback();
  }

  const { text, duration, severity, currentMedication, allergies, notes } = symptomsData;

  const prompt = `
You are an expert AI clinical assistant. Analyze the following patient symptoms and background details to prepare a pre-visit summary for the doctor.

Patient Symptoms Details:
- Symptoms: ${text}
- Duration: ${duration}
- Severity: ${severity}
- Current Medication: ${currentMedication || 'None'}
- Allergies: ${allergies || 'None'}
- Additional Notes: ${notes || 'None'}

You MUST return a JSON object with EXACTLY the following structure (do not include any other text, markdown blocks, or notes outside the JSON):
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "chiefComplaint": "A summary of the primary concern",
  "suggestedQuestions": [
    "Question 1 for doctor to ask patient",
    "Question 2 for doctor to ask patient",
    "Question 3 for doctor to ask patient"
  ]
}
`;

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    return parseJSONResponse(responseText);
  } catch (error) {
    console.error('Gemini analyzeSymptoms error, falling back:', error.message);
    return getPreVisitFallback();
  }
};

/**
 * Convert clinical notes into a patient-friendly summary
 */
const summarizeClinicalNotes = async (consultationData) => {
  const client = getGenAIInstance();
  if (!client) {
    return getPostVisitFallback();
  }

  const { diagnosis, prescription, clinicalNotes } = consultationData;

  const prompt = `
You are an expert, compassionate healthcare practitioner. Convert the following clinical documentation into a friendly, patient-understandable recovery guide.

Clinical Documentation:
- Diagnosis: ${diagnosis}
- Prescription: ${prescription || 'No new prescription'}
- Clinical Notes: ${clinicalNotes || 'No specific notes'}

You MUST return a JSON object with EXACTLY the following structure (do not include any other text, markdown blocks, or notes outside the JSON):
{
  "diagnosisExplanation": "Patient-friendly explanation of the diagnosis in simple terms",
  "medicationSchedule": "Clear layperson instructions on how/when to take the prescribed medications",
  "precautions": "Precautions to take, side effects to watch out for, or activities to avoid",
  "followUpInstructions": "Details on when to follow up or signs that mean they should seek immediate care"
}
`;

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    return parseJSONResponse(responseText);
  } catch (error) {
    console.error('Gemini summarizeClinicalNotes error, falling back:', error.message);
    return getPostVisitFallback(diagnosis);
  }
};

const getPreVisitFallback = () => {
  return {
    urgencyLevel: 'Summary currently unavailable.',
    chiefComplaint: 'Summary currently unavailable.',
    suggestedQuestions: [
      'What are the main triggers for these symptoms?',
      'Have you noticed any change in symptom pattern recently?',
      'Are there any other associated symptoms?'
    ]
  };
};

const getPostVisitFallback = (diagnosis = '') => {
  return {
    diagnosisExplanation: diagnosis ? `Diagnosed with ${diagnosis}. Please follow standard recommendations.` : 'Diagnosis summary currently unavailable.',
    medicationSchedule: 'Please follow the prescription instructions exactly.',
    precautions: 'Rest well and stay hydrated. Contact the clinic if symptoms worsen.',
    followUpInstructions: 'Follow up as advised by your physician.'
  };
};

module.exports = {
  analyzeSymptoms,
  summarizeClinicalNotes
};
