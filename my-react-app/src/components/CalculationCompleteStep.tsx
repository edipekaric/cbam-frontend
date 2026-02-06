import { Box, Button, Paper, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export interface CalculationCompleteStepProps {
  questionsFromApi: { id: number; code: string }[];
  getAnswer: (questionId: number) => string;
  onBack: () => void;
  onBackToDashboard: () => void;
  onNewCalculation: () => void;
}

export function CalculationCompleteStep({
  questionsFromApi,
  getAnswer,
  onBack,
  onBackToDashboard,
  onNewCalculation,
}: CalculationCompleteStepProps) {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Calculation complete
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your pre-calculated emissions have been saved.
      </Typography>
      {questionsFromApi.length >= 2 &&
        (() => {
          const directQ = questionsFromApi.find((q: { code: string }) => q.code === 'ALU_TOTAL_DIRECT_EMISSIONS');
          const indirectQ = questionsFromApi.find(
            (q: { code: string }) => q.code === 'ALU_TOTAL_INDIRECT_EMISSIONS'
          );
          const directVal = directQ ? getAnswer(directQ.id) : '';
          const indirectVal = indirectQ ? getAnswer(indirectQ.id) : '';
          const total =
            (Number.parseFloat(String(directVal)) || 0) + (Number.parseFloat(String(indirectVal)) || 0);
          return (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: 'primary.50',
                border: '1px solid',
                borderColor: 'primary.200',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Summary
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Total direct emissions: {String(directVal || '—')} tonnes CO₂e
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Total indirect emissions: {String(indirectVal || '—')} tonnes CO₂e
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Total: {total.toFixed(2)} tonnes CO₂e
              </Typography>
            </Paper>
          );
        })()}
      <Box display="flex" gap={2} flexWrap="wrap">
        <Button variant="outlined" size="large" startIcon={<ArrowBack />} onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" size="large" onClick={onBackToDashboard}>
          Back to Dashboard
        </Button>
        <Button variant="outlined" size="large" onClick={onNewCalculation}>
          New calculation
        </Button>
      </Box>
    </Box>
  );
}
