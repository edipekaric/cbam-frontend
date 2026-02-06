import { apiRequest } from '../utils/api';

export type QuestionType = 'VALUE' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';

export interface Question {
  id: number;
  code: string;
  questionType: QuestionType;
  label: string;
  helpText: string | null;
  stepCode: string;
  sortOrder: number;
  createdAt?: string;
}

export interface QuestionOption {
  id: number;
  code: string;
  label: string;
  sortOrder: number;
  question?: { id: number };
}

/** Question with options embedded (from GET /questions/with-options or /questions/next-step). */
export interface QuestionWithOptionsDto extends Question {
  isRouting?: boolean;
  required?: boolean;
  options: QuestionOption[];
}

interface QuestionsByStepResponse {
  success: boolean;
  questions?: Question[];
  count?: number;
  message?: string;
}

interface QuestionsAllResponse {
  success: boolean;
  questions?: Question[];
  count?: number;
  message?: string;
}

interface QuestionOptionsResponse {
  success: boolean;
  questionOptions?: QuestionOption[];
  count?: number;
  message?: string;
}

/**
 * GET /questions/all
 */
export async function getAllQuestions(): Promise<Question[]> {
  const result = await apiRequest<QuestionsAllResponse>('/questions/all');
  if (result === null || !result.data.success || !result.data.questions) {
    throw new Error(result?.data?.message ?? 'Failed to fetch questions');
  }
  return result.data.questions;
}

/**
 * GET /questions/by-step?stepCode=...
 */
export async function getQuestionsByStep(stepCode: string): Promise<Question[]> {
  const encoded = encodeURIComponent(stepCode);
  const result = await apiRequest<QuestionsByStepResponse>(`/questions/by-step?stepCode=${encoded}`);
  if (result === null || !result.data.success || !result.data.questions) {
    throw new Error(result?.data?.message ?? 'Failed to fetch questions');
  }
  return result.data.questions;
}

/**
 * GET /question-options/by-question?questionId=...
 */
export async function getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
  const result = await apiRequest<QuestionOptionsResponse>(
    `/question-options/by-question?questionId=${questionId}`
  );
  if (result === null || !result.data.success) {
    throw new Error(result?.data?.message ?? 'Failed to fetch question options');
  }
  return result.data.questionOptions ?? [];
}

interface QuestionsWithOptionsResponse {
  success: boolean;
  questions?: QuestionWithOptionsDto[];
  count?: number;
  message?: string;
}

/**
 * GET /questions/with-options?stepCode=...
 */
export async function getQuestionsWithOptions(stepCode: string): Promise<QuestionWithOptionsDto[]> {
  const encoded = encodeURIComponent(stepCode);
  const result = await apiRequest<QuestionsWithOptionsResponse>(`/questions/with-options?stepCode=${encoded}`);
  if (result === null || !result.data.success || !result.data.questions) {
    throw new Error(result?.data?.message ?? 'Failed to fetch questions');
  }
  return result.data.questions;
}

interface NextStepResponse {
  success: boolean;
  fromStepCode?: string;
  toStepCode?: string;
  questions?: QuestionWithOptionsDto[];
  count?: number;
  message?: string;
}

/**
 * GET /questions/next-step?calculationId=...&fromStepCode=...
 * Returns next step code and questions for that step (empty if toStepCode is COMPLETE).
 */
export async function getNextStep(
  calculationId: number,
  fromStepCode: string
): Promise<{ toStepCode: string; questions: QuestionWithOptionsDto[] }> {
  const result = await apiRequest<NextStepResponse>(
    `/questions/next-step?calculationId=${calculationId}&fromStepCode=${encodeURIComponent(fromStepCode)}`
  );
  if (result === null || !result.data.success) {
    throw new Error(result?.data?.message ?? 'Failed to get next step');
  }
  return {
    toStepCode: result.data.toStepCode ?? 'COMPLETE',
    questions: result.data.questions ?? [],
  };
}
