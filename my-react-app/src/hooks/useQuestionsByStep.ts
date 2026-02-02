import { useState, useEffect, useCallback } from 'react';
import {
  getQuestionsByStep,
  getQuestionOptions,
  type Question,
  type QuestionOption,
} from '../api/questions';

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export function useQuestionsByStep(stepCode: string | null) {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getQuestionsByStep(code);
      const withOptions: QuestionWithOptions[] = await Promise.all(
        list.map(async (q) => {
          const needsOptions =
            q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE';
          const options = needsOptions ? await getQuestionOptions(q.id) : [];
          return { ...q, options };
        })
      );
      setQuestions(withOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stepCode) {
      fetchQuestions(stepCode);
    } else {
      setQuestions([]);
      setError(null);
    }
  }, [stepCode, fetchQuestions]);

  return { questions, loading, error, refetch: () => stepCode && fetchQuestions(stepCode) };
}
