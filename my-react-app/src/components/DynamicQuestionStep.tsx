import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import type { QuestionWithOptions } from '../hooks/useQuestionsByStep';

interface DynamicQuestionStepProps {
  questions: QuestionWithOptions[];
  loading: boolean;
  error: string | null;
  getAnswer: (questionId: number) => string;
  setAnswer: (questionId: number, valueText: string) => void | Promise<void>;
  onOptionSelect?: (questionCode: string, optionCode: string) => void;
  onValueChange?: (questionCode: string, valueText: string) => void;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export function DynamicQuestionStep({
  questions,
  loading,
  error,
  getAnswer,
  setAnswer,
  onOptionSelect,
  onValueChange,
  onBack,
  onNext,
  nextDisabled = false,
}: DynamicQuestionStepProps) {
  const isHasCarbonYes = (val: string) => val === 'YES' || val === 'yes' || val === 'DA' || val === 'da';
  // Conditional visibility: ALU_ANODE_CARBON_PERCENT / ALU_SODERBERG_CARBON_PERCENT only when has-carbon is Da (YES/yes/DA/da)
  const visibleQuestions = questions.filter((q) => {
    if (q.code === 'ALU_ANODE_CARBON_PERCENT') {
      const hasCarbonQ = questions.find((x) => x.code === 'ALU_HAS_CARBON_PERCENT');
      return hasCarbonQ != null && isHasCarbonYes(getAnswer(hasCarbonQ.id));
    }
    if (q.code === 'ALU_SODERBERG_CARBON_PERCENT') {
      const hasCarbonQ = questions.find((x) => x.code === 'ALU_SODERBERG_HAS_CARBON_PERCENT');
      return hasCarbonQ != null && isHasCarbonYes(getAnswer(hasCarbonQ.id));
    }
    return true;
  });
  // Dedupe by question code so the same question is never shown twice (avoids double declaration step etc.)
  const uniqueVisibleQuestions = visibleQuestions.filter(
    (q, i, arr) => arr.findIndex((x) => x.code === q.code) === i
  );

  const canProceed =
    !nextDisabled &&
    uniqueVisibleQuestions.every((q) => {
      const val = getAnswer(q.id);
      if (q.questionType === 'VALUE') return val != null && String(val).trim() !== '';
      if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE')
        return val != null && val !== '';
      return true;
    });

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

  if (questions.length === 0) {
    return null;
  }

  return (
    <>
      <Grid container spacing={3}>
        {uniqueVisibleQuestions.map((q) => (
          <Grid size={12} key={q.id}>
            {q.questionType === 'VALUE' && (
              <>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  {q.label}
                </Typography>
                {q.helpText && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {q.helpText}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  label={q.label}
                  value={getAnswer(q.id)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAnswer(q.id, val);
                    onValueChange?.(q.code, val);
                  }}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                  helperText={q.helpText ?? undefined}
                />
              </>
            )}
            {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE') && (
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                  {q.label}
                </FormLabel>
                {q.helpText && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {q.helpText}
                  </Typography>
                )}
                <RadioGroup
                  value={getAnswer(q.id)}
                  onChange={(e) => {
                    const optionCode = e.target.value;
                    setAnswer(q.id, optionCode);
                    onOptionSelect?.(q.code, optionCode);
                  }}
                >
                  {q.options
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((opt) => (
                      <FormControlLabel
                        key={opt.id}
                        value={opt.code}
                        control={<Radio />}
                        label={opt.label}
                        sx={{ mb: 1 }}
                      />
                    ))}
                </RadioGroup>
              </FormControl>
            )}
          </Grid>
        ))}
        <Grid size={12}>
          <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button type="button" variant="outlined" size="large" startIcon={<ArrowBack />} onClick={onBack}>
              Back
            </Button>
            <Button
              type="button"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={onNext}
              disabled={!canProceed}
            >
              Next
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
