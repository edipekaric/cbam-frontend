import { Grid, Paper, Typography } from '@mui/material';
import { DynamicQuestionStep } from './DynamicQuestionStep';
import type { QuestionWithOptions } from '../hooks/useQuestionsByStep';

export interface AnodeStepProps {
  currentStepCode: string;
  questionsFromApi: QuestionWithOptions[];
  questionsLoading: boolean;
  questionsError: string | null;
  getAnswerForStep: (questionId: number) => string;
  setAnswer: (questionId: number, valueText: string) => void | Promise<void>;
  onOptionSelect: (questionCode: string, optionCode: string) => void;
  onValueChange: (questionCode: string, valueText: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function AnodeStep({
  currentStepCode,
  questionsFromApi,
  questionsLoading,
  questionsError,
  getAnswerForStep,
  setAnswer,
  onOptionSelect,
  onValueChange,
  onBack,
  onNext,
}: AnodeStepProps) {
  if (currentStepCode === 'ALU_ANODES_INPUT') {
    const qtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODES_QTY');
    const hasCarbonQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_HAS_CARBON_PERCENT');
    const carbonPercentQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODE_CARBON_PERCENT');
    // Use getAnswerForStep so local state (e.g. "Da" before Next) is reflected
    const qtyVal = qtyQ != null ? getAnswerForStep(qtyQ.id) : '';
    const hasCarbonVal = hasCarbonQ != null ? getAnswerForStep(hasCarbonQ.id) : '';
    const carbonPercentVal = carbonPercentQ != null ? getAnswerForStep(carbonPercentQ.id) : '';
    const showCarbonPercent =
      hasCarbonVal === 'YES' || hasCarbonVal === 'yes' || hasCarbonVal === 'DA' || hasCarbonVal === 'da';
    // Always include carbon % question when it exists; DynamicQuestionStep shows it only when "Da" is selected (same as Söderberg)
    const prebakedQuestions: QuestionWithOptions[] = [qtyQ, hasCarbonQ, carbonPercentQ].filter(
      (q): q is QuestionWithOptions => q != null
    );
    if (prebakedQuestions.length === 0) {
      return (
        <Typography color="text.secondary">No questions available for this step.</Typography>
      );
    }
    const amount = Number.parseFloat(String(qtyVal)) || 0;
    const percent = Number.parseFloat(String(carbonPercentVal)) || 0;
    const prebakedEmissions = showCarbonPercent
      ? amount * (percent / 100) * (44 / 12)
      : amount * (44 / 12) * 0.85;
    return (
      <Grid container spacing={3}>
        <Grid size={12}>
          <DynamicQuestionStep
            questions={prebakedQuestions}
            loading={questionsLoading}
            error={questionsError}
            getAnswer={getAnswerForStep}
            setAnswer={setAnswer}
            onOptionSelect={onOptionSelect}
            onValueChange={onValueChange}
            onBack={onBack}
            onNext={onNext}
          />
        </Grid>
        {qtyVal &&
          (hasCarbonVal === 'NO' ||
            hasCarbonVal === 'no' ||
            (showCarbonPercent && carbonPercentVal)) && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  <strong>Izračunate emisije:</strong> {prebakedEmissions.toFixed(2)} tonnes CO₂e
                  {showCarbonPercent
                    ? ' (formula: amount × (percent/100) × (44/12))'
                    : ' (formula: amount × (44/12) × 85%)'}
                </Typography>
              </Paper>
            </Grid>
          )}
      </Grid>
    );
  }

  if (currentStepCode === 'ALU_ANODES_SODERBERG') {
    const pasteQtyQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_SODERBERG_PASTE_QTY');
    const hasCarbonQ = questionsFromApi.find(
      (q: { code: string }) => q.code === 'ALU_SODERBERG_HAS_CARBON_PERCENT'
    );
    const carbonPercentQ = questionsFromApi.find(
      (q: { code: string }) => q.code === 'ALU_SODERBERG_CARBON_PERCENT'
    );
    // Use getAnswerForStep so local state (e.g. "Da" before Next) is reflected, same as Pre-baked
    const pasteQtyVal = pasteQtyQ != null ? getAnswerForStep(pasteQtyQ.id) : '';
    const hasCarbonVal = hasCarbonQ != null ? getAnswerForStep(hasCarbonQ.id) : '';
    const carbonPercentVal = carbonPercentQ != null ? getAnswerForStep(carbonPercentQ.id) : '';
    const showCarbonPercent =
      hasCarbonVal === 'YES' || hasCarbonVal === 'yes' || hasCarbonVal === 'DA' || hasCarbonVal === 'da';
    const soderbergQuestions: QuestionWithOptions[] = [pasteQtyQ, hasCarbonQ].filter(
      (q): q is QuestionWithOptions => q != null
    );
    if (showCarbonPercent && carbonPercentQ) soderbergQuestions.push(carbonPercentQ);
    if (soderbergQuestions.length === 0) {
      return (
        <Typography color="text.secondary">No questions available for this step.</Typography>
      );
    }
    const amount = Number.parseFloat(String(pasteQtyVal)) || 0;
    const percent = Number.parseFloat(String(carbonPercentVal)) || 0;
    const soderbergEmissions = showCarbonPercent
      ? amount * (percent / 100) * (44 / 12)
      : amount * (44 / 12) * 0.85;
    return (
      <Grid container spacing={3}>
        <Grid size={12}>
          <DynamicQuestionStep
            questions={soderbergQuestions}
            loading={questionsLoading}
            error={questionsError}
            getAnswer={getAnswerForStep}
            setAnswer={setAnswer}
            onOptionSelect={onOptionSelect}
            onValueChange={onValueChange}
            onBack={onBack}
            onNext={onNext}
          />
        </Grid>
        {pasteQtyVal &&
          (hasCarbonVal === 'NO' ||
            hasCarbonVal === 'no' ||
            (showCarbonPercent && carbonPercentVal)) && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200',
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  <strong>Izračunate emisije:</strong> {soderbergEmissions.toFixed(2)} tonnes CO₂e
                  {showCarbonPercent
                    ? ' (formula: amount × (percent/100) × (44/12))'
                    : ' (formula: amount × (44/12) × 85%)'}
                </Typography>
              </Paper>
            </Grid>
          )}
      </Grid>
    );
  }

  // ALU_ANODE_TYPE: show anode type question (Pre-baked / Söderberg) until user clicks Next
  const anodeTypeQuestion = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_ANODE_TYPE');
  if (anodeTypeQuestion != null) {
    return (
      <DynamicQuestionStep
        questions={[anodeTypeQuestion]}
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
  return null;
}
