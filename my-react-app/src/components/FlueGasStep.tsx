import { DynamicQuestionStep } from './DynamicQuestionStep';
import type { QuestionWithOptions } from '../hooks/useQuestionsByStep';

export interface FlueGasStepProps {
  questionsFromApi: QuestionWithOptions[];
  questionsLoading: boolean;
  questionsError: string | null;
  getAnswer: (questionId: number) => string;
  getAnswerForStep: (questionId: number) => string;
  setAnswer: (questionId: number, valueText: string) => void | Promise<void>;
  onOptionSelect: (questionCode: string, optionCode: string) => void;
  onValueChange: (questionCode: string, valueText: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function FlueGasStep({
  questionsFromApi,
  questionsLoading,
  questionsError,
  getAnswer,
  getAnswerForStep,
  setAnswer,
  onOptionSelect,
  onValueChange,
  onBack,
  onNext,
}: FlueGasStepProps) {
  const flueGasQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_TREATMENT');
  const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_FLUE_GAS_QTY');
  const flueGasAnswer = flueGasQ != null ? getAnswer(flueGasQ.id) : '';
  const needsQty =
    flueGasAnswer === 'SODA_ASH' ||
    flueGasAnswer === 'soda-ash' ||
    flueGasAnswer === 'LIMESTONE' ||
    flueGasAnswer === 'limestone';
  const step9Questions = flueGasQ
    ? needsQty && qtyQ
      ? [flueGasQ, qtyQ]
      : [flueGasQ]
    : questionsFromApi;
  return (
    <DynamicQuestionStep
      questions={step9Questions}
      loading={questionsLoading}
      error={questionsError}
      getAnswer={getAnswerForStep}
      setAnswer={setAnswer}
      onOptionSelect={onOptionSelect}
      onValueChange={onValueChange}
      onBack={onBack}
      onNext={onNext}
    />
  );
}
