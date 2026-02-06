import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useDashboardCalculations } from './Dashboard';

type CalculationStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const statusColor: Record<CalculationStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const CalculationsList: React.FC = () => {
  const navigate = useNavigate();
  const dashboardCalculations = useDashboardCalculations();
  const calculations = dashboardCalculations?.calculations ?? [];
  const loading = dashboardCalculations?.calculationsLoading ?? true;
  const error = dashboardCalculations?.calculationsError ?? null;

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        All calculations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Calculations for your company and their current status.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Current step</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Modified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No calculations yet. Start one from the dashboard.
                  </TableCell>
                </TableRow>
              ) : (
                calculations.map((calc) => (
                  <TableRow key={calc.id} hover>
                    <TableCell>{calc.id}</TableCell>
                    <TableCell>
                      <Chip label={calc.status} color={statusColor[calc.status]} size="small" />
                    </TableCell>
                    <TableCell>{calc.currentStep ?? '—'}</TableCell>
                    <TableCell>{formatDate(calc.createdAt)}</TableCell>
                    <TableCell>{formatDate(calc.modifiedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default CalculationsList;
