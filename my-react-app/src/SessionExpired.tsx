import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import {
  LockClock,
  ArrowForward,
} from '@mui/icons-material';

const SessionExpired: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    // Clear any remaining localStorage data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 6, borderRadius: 2, textAlign: 'center' }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <LockClock sx={{ fontSize: 80, color: 'warning.main' }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            Session Expired
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
            Your session has expired for security reasons. Please log in again to continue.
          </Alert>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            For your security, sessions automatically expire after a period of inactivity. 
            Don't worry, your data is safe and you can log back in to continue where you left off.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleGoToLogin}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
            }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default SessionExpired;