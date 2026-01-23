const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Decode JWT token and check if it's expired
 * Returns true if token is expired, false if valid, null if token is invalid/missing
 */
export const isTokenExpired = (token: string | null): boolean | null => {
  if (!token) {
    return null;
  }

  try {
    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Makes an authenticated API request with automatic token handling
 * Returns null if token is expired (401), which should trigger session expired screen
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; response: Response } | null> => {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null; // Signal that session expired
  }

  const data = await response.json();
  return { data, response };
};

/**
 * Check if token exists and is valid by making a test request
 */
export const isTokenValid = async (): Promise<boolean> => {
  const result = await apiRequest('/users/me');
  return result !== null;
};