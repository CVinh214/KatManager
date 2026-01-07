'use client';

import { useState } from 'react';
import type { AIFunction, AIRequest, AIResponse } from '@/lib/ai-service';

/**
 * Custom hook để gọi AI API
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAI = async (
    functionName: AIFunction,
    data: any,
    config?: any
  ): Promise<AIResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const request: AIRequest = {
        function: functionName,
        data,
        config,
      };

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI request failed');
      }

      const result: AIResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('AI Hook Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tạo lịch tự động
   */
  const generateSchedule = async (
    pastWeek: any[],
    requests: any[],
    rules: any,
    config?: any
  ) => {
    return callAI('schedule', { pastWeek, requests, rules }, config);
  };

  /**
   * Dự đoán đăng ký ca
   */
  const predictShifts = async (history: any[], config?: any) => {
    return callAI('predict', { history }, config);
  };

  /**
   * Phát hiện rủi ro
   */
  const detectRisks = async (schedule: any[], config?: any) => {
    return callAI('risk', { schedule }, config);
  };

  /**
   * Phân tích giờ công
   */
  const analyzeTimeLogs = async (timeLogs: any[], config?: any) => {
    return callAI('analysis', { timeLogs }, config);
  };

  /**
   * Chat/hỏi đáp
   */
  const chat = async (question: string, context?: any, config?: any) => {
    return callAI('chat', { question, context }, config);
  };

  /**
   * Phân loại ghi chú
   */
  const classifyNote = async (note: string, config?: any) => {
    return callAI('classify', { note }, config);
  };

  return {
    loading,
    error,
    callAI,
    generateSchedule,
    predictShifts,
    detectRisks,
    analyzeTimeLogs,
    chat,
    classifyNote,
  };
}
