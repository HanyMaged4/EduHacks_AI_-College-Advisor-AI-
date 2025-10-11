import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Divider,
  CircularProgress,
  Container,
  Stack,
} from '@mui/material';
import { PersonAddOutlined, Google, GitHub } from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import { signupAPI } from '../../APIs/auth';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await signupAPI(
        formData.username,
        formData.email,
        formData.password
      );

      const data = await response.json();

      if (response.ok) {
        login(data.access_token, data.user);
        navigate('/', { replace: true });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ maxWidth: 480, mx: 'auto', boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3}>
              <PersonAddOutlined color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Join College Advisor to get personalized guidance
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={3}>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    variant="outlined"
                    helperText="Password must be at least 6 characters long"
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    variant="outlined"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ py: 1.5 }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Stack>
              </Box>

              <Divider>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Google />}
                  sx={{ py: 1.5 }}
                >
                  Continue with Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<GitHub />}
                  sx={{ py: 1.5 }}
                >
                  Continue with GitHub
                </Button>
              </Stack>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" color="primary" fontWeight="medium">
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SignupPage;