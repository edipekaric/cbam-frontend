import { apiRequest } from '../utils/api';

export type CalculationStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CalculationDto {
  id: number;
  status: CalculationStatus;
  currentStep: string;
  createdAt?: string;
  modifiedAt?: string;
}

interface CalculationResponse {
  success: boolean;
  calculation?: CalculationDto & { company?: { id: number }; createdByUser?: { id: number } };
  message?: string;
}

/**
 * GET /calculations/:id
 */
export async function getCalculation(id: number): Promise<CalculationDto> {
  const result = await apiRequest<CalculationResponse>(`/calculations/${id}`);
  if (result === null || !result.data.success || !result.data.calculation) {
    throw new Error(result?.data?.message ?? 'Failed to fetch calculation');
  }
  const c = result.data.calculation;
  return { id: c.id, status: c.status, currentStep: c.currentStep, createdAt: c.createdAt, modifiedAt: c.modifiedAt };
}

/**
 * PATCH /calculations/:id/wizard
 * Body: { currentStep?: string, status?: CalculationStatus }
 */
export async function patchCalculationWizard(
  id: number,
  body: { currentStep?: string; status?: CalculationStatus }
): Promise<CalculationDto> {
  const result = await apiRequest<CalculationResponse>(`/calculations/${id}/wizard`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (result === null || !result.data.success || !result.data.calculation) {
    throw new Error(result?.data?.message ?? 'Failed to update calculation');
  }
  const c = result.data.calculation;
  return { id: c.id, status: c.status, currentStep: c.currentStep, createdAt: c.createdAt, modifiedAt: c.modifiedAt };
}
