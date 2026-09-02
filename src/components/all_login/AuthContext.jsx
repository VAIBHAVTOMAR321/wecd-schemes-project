import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = '/wecdschemes/wecdschemes_backend/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Extract CSRF token from document.cookie
const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const getCSRFHeaders = () => {
  const csrfToken = getCSRFToken();
  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
  };
};

// Single flag to prevent multiple auth failure alerts
// Once any auth failure is handled, no other alert will show
let authFailureHandled = false;

// Show session timeout - ONLY for refresh-token API failures
const handleSessionTimeout = () => {
  if (authFailureHandled) {
    return false;
  }
  authFailureHandled = true;
  alert('Your account has been logged in on another device. Please login again.');
  return true;
};

// Show logged in elsewhere - ONLY for session-status API failures
const handleLoggedInElsewhere = () => {
  if (authFailureHandled) {
    return false;
  }
  authFailureHandled = true;
  alert('Session timeout. Please login again.');
  return true;
};

// Reset the flag on successful login
const resetAuthFailureFlag = () => {
  authFailureHandled = false;
};

// Simple URL-based checks - no message parsing
const isRefreshTokenRequest = (error) => {
  const requestUrl = error?.config?.url || '';
  return requestUrl.includes('/refresh-token/');
};

const isSessionStatusRequest = (error) => {
  const requestUrl = error?.config?.url || '';
  return requestUrl.includes('/session-status/');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [uniqueId, setUniqueId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const refreshPromiseRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const isAuthenticatedRef = useRef(false);

  const logout = useCallback(async () => {
    console.log('🔴 Logging out...');

    sessionStorage.setItem('post_logout', '1');

    // Reset state
    isRefreshing = false;
    failedQueue = [];
    refreshPromiseRef.current = null;
    setUser(null);
    setRole(null);
    setUniqueId(null);
    isAuthenticatedRef.current = false;

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    // Call logout endpoint with CSRF protection
    try {
      const csrfToken = getCSRFToken();
      await axios.post(`${API_URL}/logout/`, {}, {
        headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
        withCredentials: true,
      });
    } catch (error) {
      console.log('⚠️ Logout endpoint call failed:', error.message);
    }

    // Manipulate browser history to prevent back navigation
    window.history.replaceState(null, '', '/wecdschemes/Login');
    window.history.pushState(null, '', '/wecdschemes/Login');

    // Perform redirection
    window.location.replace('/wecdschemes/Login');
  }, []);

  const login = useCallback((data) => {
    // Reset auth failure flag on successful login
    resetAuthFailureFlag();

    if (data.role && data.unique_id) {
      setUser(data.username || null);
      setRole(data.role);
      setUniqueId(data.unique_id);
      isAuthenticatedRef.current = true;
      console.log('🔑 Login successful. User:', data.username, 'Role:', data.role);
    } else {
      console.error('Login failed: Role or unique_id not found in response');
      logout();
    }
  }, [logout]);

  const refreshAccessToken = useCallback(async () => {
    // If auth failure already handled, don't even try refreshing
    if (authFailureHandled) {
      return false;
    }

    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshing = true;
    refreshPromiseRef.current = axios.post(`${API_URL}/refresh-token/`, {}, {
      withCredentials: true,
      headers: getCSRFHeaders(),
    });

    try {
      await refreshPromiseRef.current;
      console.log('🔄 Token refreshed via cookie-based auth');
      processQueue(null);
      return true;
    } catch (error) {
      console.log('❌ Token refresh failed');

      // ONLY show session timeout for refresh-token API failure
      // Do NOT check for "logged in elsewhere" here
      handleSessionTimeout();

      processQueue(error);
      logout();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromiseRef.current = null;
    }
  }, [logout]);

  // Initialize auth state on mount
  useEffect(() => {
    setIsReady(true);
    isAuthenticatedRef.current = !!user;
  }, [user]);

  // Prevent back navigation after logout
  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticatedRef.current) {
        window.location.replace('/wecdschemes/Login');
      } else {
        const path = window.location.pathname;
        const isLoginPage = path.includes('/Login') || path.includes('/login');
        if (isLoginPage) {
          window.history.forward();
          const confirmed = window.confirm("Are you sure you want to logout?");
          if (confirmed) {
            logout();
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [logout]);

  const sessionCheckTimerRef = useRef(null);

  // Authenticated axios instance with automatic token refresh logic
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use(
      (config) => {
        // For POST, PUT, PATCH, DELETE requests, add CSRF token
        const method = config.method.toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const csrfToken = getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If auth failure already handled by another request, just reject silently
        if (authFailureHandled) {
          return Promise.reject(error);
        }

        // CASE 1: Session-status request failed with 401
        // ONLY show "logged in elsewhere" message for this specific endpoint
        if (error.response?.status === 401 && isSessionStatusRequest(error)) {
          handleLoggedInElsewhere();
          logout();
          return Promise.reject(error);
        }

        // CASE 2: Any other 401 error - try to refresh token
        // If refresh fails, "session timeout" message will be shown by refreshAccessToken()
        if (error.response?.status === 401 && !originalRequest._retry) {
          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return instance(originalRequest);
            }).catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;

          // Attempt to refresh - this will show "session timeout" if it fails
          const refreshed = await refreshAccessToken();

          if (refreshed) {
            // Retry the original request with updated cookies
            const method = originalRequest.method.toUpperCase();
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
              const csrfToken = getCSRFToken();
              if (csrfToken) {
                originalRequest.headers['X-CSRFToken'] = csrfToken;
              }
            }
            return instance(originalRequest);
          }

          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [logout, refreshAccessToken]);

  // Session status check - runs periodically when authenticated
  useEffect(() => {
    if (!isAuthenticatedRef.current || !user || !role || !api) {
      // Clear any existing timer if not authenticated
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
        sessionCheckTimerRef.current = null;
      }
      return;
    }

    const checkSessionStatus = async () => {
      // Don't check if:
      // 1. Auth failure already handled (alert already shown)
      // 2. Currently refreshing token (avoid interference)
      if (authFailureHandled || isRefreshing) {
        return;
      }

      try {
        await api.get('/session-status/');
        // Success - session is valid
      } catch (error) {
        // Error is handled by the interceptor above
        // The interceptor will show "logged in elsewhere" and logout
        // No need to do anything here
      }
    };

    // Delay initial check by 2 seconds to allow cookies to settle
    const initialCheckTimer = setTimeout(() => {
      checkSessionStatus();
      // Check every 30 seconds
      sessionCheckTimerRef.current = setInterval(checkSessionStatus, 30000);
    }, 2000);

    return () => {
      clearTimeout(initialCheckTimer);
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
        sessionCheckTimerRef.current = null;
      }
    };
  }, [user, role, api, logout]);

  const value = useMemo(() => ({
    user,
    role,
    uniqueId,
    login,
    logout,
    api,
    refreshAccessToken,
    isAuthenticated: isAuthenticatedRef.current,
    isReady,
  }), [user, role, uniqueId, api, refreshAccessToken, isReady]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}