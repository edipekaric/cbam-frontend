import { useState, useEffect, useCallback } from 'react';
import {
  getCalculationAnswersByCalculation,
  upsertCalculationAnswer,
} from '../api/calculationAnswers';

/** Map questionId -> valueText (or option code for single/multi choice) */
export type AnswersMap = Record<number, string>;

export function useCalculationAnswers(calculationId: number | null) {
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = useCallback(async (calcId: number) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCalculationAnswersByCalculation(calcId);
      const map: AnswersMap = {};
      list.forEach((a) => {
        const qId = a.question?.id ?? (a as unknown as { questionId?: number }).questionId;
        if (qId != null && a.valueText != null) {
          map[qId] = a.valueText;
        }
      });
      setAnswers(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load answers');
      setAnswers({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (calculationId != null) {
      fetchAnswers(calculationId);
    } else {
      setAnswers({});
      setError(null);
    }
  }, [calculationId, fetchAnswers]);

  const setAnswer = useCallback(
    async (questionId: number, valueText: string, emissionFactorId?: number | null) => {
      if (calculationId == null) return;
      setAnswers((prev) => ({ ...prev, [questionId]: valueText }));
      try {
        await upsertCalculationAnswer({
          calculation: { id: calculationId },
          question: { id: questionId },
          valueText,
          ...(emissionFactorId != null && { emissionFactorId }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save answer');
      }
    },
    [calculationId]
  );

  const getAnswer = useCallback(
    (questionId: number): string => {
      return answers[questionId] ?? '';
    },
    [answers]
  );

  return {
    answers,
    loading,
    error,
    setAnswer,
    getAnswer,
    refetch: () => calculationId != null && fetchAnswers(calculationId),
  };
}
