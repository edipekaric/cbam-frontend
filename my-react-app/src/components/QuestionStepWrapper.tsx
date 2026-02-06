import { Box, CircularProgress, Typography } from '@mui/material';
import { DynamicQuestionStep } from './DynamicQuestionStep';
import type { QuestionWithOptions } from '../hooks/useQuestionsByStep';

export interface QuestionStepWrapperProps {
  questions: QuestionWithOptions[];
  loading: boolean;
  error: string | null;
  getAnswer: (questionId: number) => string;
  setAnswer: (questionId: number, valueText: string) => void | Promise<void>;
  onOptionSelect?: (questionCode: string, optionCode: string) => void;
  onValueChange?: (questionCode: string, valueText: string) => void;
  onBack: () => void;
  onNext: () => void;
  /** Optional title rendered above the questions (e.g. "Unesite:") */
  title?: React.ReactNode;
}

export function QuestionStepWrapper({
  questions,
  loading,
  error,
  getAnswer,
  setAnswer,
  onOptionSelect,
  onValueChange,
  onBack,
  onNext,
  title,
}: QuestionStepWrapperProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Typography color="error" sx={{ mb: 2 }}>
        {error}
      </Typography>
    );
  }
  if (!questions || questions.length === 0) {
    return (
      <Typography color="text.secondary">
        No questions available for this step.
      </Typography>
    );
  }
  return (
    <>
      {title}
      <DynamicQuestionStep
        questions={questions}
        loading={false}
        error={null}
        getAnswer={getAnswer}
        setAnswer={setAnswer}
        onOptionSelect={onOptionSelect}
        onValueChange={onValueChange}
        onBack={onBack}
        onNext={onNext}
      />
    </>
  );
}
