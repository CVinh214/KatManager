// AI Service using Google Gemini API with load balancing
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export type AIFunction = 'analyze' | 'predict' | 'risk' | 'schedule' | 'chat' | 'classify';

export interface AIRequest {
  function: AIFunction;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  constraints?: any;
  data?: any;
  config?: any;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Load balancing across 3 API keys
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
  }
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function analyzeEmployeePerformance(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const prompt = `Analyze employee performance for ID ${employeeId} from ${startDate} to ${endDate}. 
  Provide insights on productivity, attendance patterns, and recommendations.
  Return response in JSON format with keys: productivity_score, attendance_rate, insights, recommendations.`;

  const response = await callGemini(prompt);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      productivity_score: 0,
      attendance_rate: 0,
      insights: response,
      recommendations: ['Unable to parse AI response'],
    };
  }
}

export async function analyzeWorkPatterns(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const prompt = `Predict work patterns for employee ID ${employeeId} from ${startDate} to ${endDate}.
  Analyze historical data and provide predictions for optimal work schedule.
  Return response in JSON format with keys: predicted_schedule, confidence_score, recommendations.`;

  const response = await callGemini(prompt);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      predicted_schedule: [],
      confidence_score: 0,
      recommendations: [response],
    };
  }
}

export async function assessRisks(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const prompt = `Assess risks for employee ID ${employeeId} from ${startDate} to ${endDate}.
  Identify potential burnout, overwork patterns, or scheduling conflicts.
  Return response in JSON format with keys: risk_level, risk_factors, mitigation_strategies.`;

  const response = await callGemini(prompt);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      risk_level: 'unknown',
      risk_factors: [response],
      mitigation_strategies: [],
    };
  }
}

export async function optimizeSchedule(
  startDate: string,
  endDate: string,
  constraints?: any
) {
  const prompt = `Optimize work schedule from ${startDate} to ${endDate}.
  Constraints: ${JSON.stringify(constraints || {})}.
  Provide an optimal schedule that balances workload and employee preferences.
  Return response in JSON format with keys: optimized_schedule, efficiency_gain, notes.`;

  const response = await callGemini(prompt);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      optimized_schedule: [],
      efficiency_gain: 0,
      notes: [response],
    };
  }
}
