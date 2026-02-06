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

function mergeAndSortQuestions(questions: Question[]): Question[] {
  const byId = new Map<number, Question>();
  questions.forEach((q) => byId.set(q.id, q));
  return Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Dedupe by question code (first occurrence wins) so the same step never shows the same question twice. */
function dedupeByCode<T extends { code: string }>(list: T[]): T[] {
  return list.filter((q, i, arr) => arr.findIndex((x) => x.code === q.code) === i);
}

export function useQuestionsByStep(stepCode: string | string[] | null) {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (codeOrCodes: string | string[]) => {
    const codes = Array.isArray(codeOrCodes) ? codeOrCodes : [codeOrCodes];
    if (codes.length === 0) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const lists = await Promise.all(codes.map((code) => getQuestionsByStep(code)));
      const merged = mergeAndSortQuestions(lists.flat());
      const withOptions: QuestionWithOptions[] = await Promise.all(
        merged.map(async (q) => {
          const needsOptions =
            q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE';
          const options = needsOptions ? await getQuestionOptions(q.id) : [];
          return { ...q, options };
        })
      );
      setQuestions(dedupeByCode(withOptions));
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

  return {
    questions,
    loading,
    error,
    refetch: () => stepCode && fetchQuestions(stepCode),
  };
}
