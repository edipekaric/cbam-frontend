import { apiRequest } from '../utils/api';

export interface CalculationAnswerDto {
  id: number;
  calculation: { id: number };
  question: { id: number };
  valueText: string;
  emissionFactorId?: number | null;
  createdAt?: string;
  modifiedAt?: string;
}

interface CalculationAnswersListResponse {
  success: boolean;
  calculationAnswers?: CalculationAnswerDto[];
  count?: number;
  message?: string;
}

interface CalculationAnswerUpsertResponse {
  success: boolean;
  calculationAnswer?: CalculationAnswerDto;
  message?: string;
}

/**
 * GET /calculation-answers/by-calculation?calculationId=...
 */
export async function getCalculationAnswersByCalculation(
  calculationId: number
): Promise<CalculationAnswerDto[]> {
  const result = await apiRequest<CalculationAnswersListResponse>(
    `/calculation-answers/by-calculation?calculationId=${calculationId}`
  );
  if (result === null || !result.data.success) {
    throw new Error(result?.data?.message ?? 'Failed to fetch calculation answers');
  }
  return result.data.calculationAnswers ?? [];
}

/**
 * POST /calculation-answers/upsert
 * Body: { calculation: { id }, question: { id }, valueText [, emissionFactorId ] }
 */
export async function upsertCalculationAnswer(payload: {
  calculation: { id: number };
  question: { id: number };
  valueText: string;
  emissionFactorId?: number | null;
}): Promise<CalculationAnswerDto> {
  const result = await apiRequest<CalculationAnswerUpsertResponse>('/calculation-answers/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result === null || !result.data.success || !result.data.calculationAnswer) {
    throw new Error(result?.data?.message ?? 'Failed to save calculation answer');
  }
  return result.data.calculationAnswer;
}

/**
 * DELETE /calculation-answers/by-calculation-and-questions
 * Body: { calculationId: number, questionIds: number[] }
 * Deletes all calculation_answer rows for the given calculation and question IDs (e.g. when user presses Back).
 */
export async function deleteCalculationAnswersByCalculationAndQuestions(
  calculationId: number,
  questionIds: number[]
): Promise<{ deleted: number }> {
  const result = await apiRequest<{ success: boolean; deleted?: number; message?: string }>(
    '/calculation-answers/by-calculation-and-questions',
    { method: 'DELETE', body: JSON.stringify({ calculationId, questionIds }) }
  );
  if (result === null || !result.data.success) {
    throw new Error(result?.data?.message ?? 'Failed to delete calculation answers');
  }
  return { deleted: result.data.deleted ?? 0 };
}

/**
 * GET /calculation-answers/by-calculation-question?calculationId=...&questionId=...
 */
export async function getCalculationAnswerByCalculationAndQuestion(
  calculationId: number,
  questionId: number
): Promise<CalculationAnswerDto | null> {
  const result = await apiRequest<{
    success: boolean;
    calculationAnswer?: CalculationAnswerDto;
    message?: string;
  }>(
    `/calculation-answers/by-calculation-question?calculationId=${calculationId}&questionId=${questionId}`
  );
  if (result === null || !result.data.success) {
    return null;
  }
  return result.data.calculationAnswer ?? null;
}
