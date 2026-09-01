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

// 🔐 Extract CSRF token from document.cookie
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
      // Even if logout endpoint fails, proceed with local cleanup and redirect
    }

    // 2. Manipulate browser history to prevent back navigation
    window.history.replaceState(null, '', '/wecdschemes/Login');
    window.history.pushState(null, '', '/wecdschemes/Login');

    // 3. Perform redirection using window.location
    const redirectPath = '/wecdschemes/Login';
    window.location.replace(redirectPath);
  }, []);

  const login = useCallback((data) => {
    // With cookie-based auth, the backend now manages cookies
    // Response contains: { message, role, unique_id, username }
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
    // With cookie-based auth, we just need to call the refresh endpoint
    // The backend will update the httponly cookies
    if (isRefreshing) {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }
    }

    // Prevent multiple concurrent refresh attempts
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshing = true;
    refreshPromiseRef.current = axios.post(`${API_URL}/refresh-token/`, {}, {
      withCredentials: true,
    });

    try {
      await refreshPromiseRef.current;
      console.log('🔄 Token refreshed via cookie-based auth');
      processQueue(null);
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      console.log('❌ Token refresh failed:', errorData?.error || errorData?.message || error.message);
      processQueue(error);
      logout();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromiseRef.current = null;
    }
  }, [logout]);

  // Initialize auth state on mount (check if user is already authenticated via cookies)
  useEffect(() => {
    // With cookie-based auth, we rely on the backend to validate cookies
    // On page load, we can try to call an authenticated endpoint to check if cookies are valid
    // Or we can just set isReady and let the first API call determine auth state
    // For now, we'll just mark as ready and let the app handle auth state
    setIsReady(true);
    isAuthenticatedRef.current = !!user;
  }, []);

  // Prevent back navigation after logout and block back-to-login when authenticated
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

        if (error.response?.status === 401 && !originalRequest._retry) {
          // If we already tried to refresh, log out immediately
          if (originalRequest._retry) {
            logout();
            return Promise.reject(error);
          }

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              // Retry the original request with new cookies
              return instance(originalRequest);
            }).catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;

          // Reuse the centralized refresh logic
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Cookies are now updated, retry the request
            // For POST/PUT/PATCH/DELETE, re-add CSRF token
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

  // Session status check - set up after api is initialized
  useEffect(() => {
    if (!isAuthenticatedRef.current || !user || !role || !api) {
      // Clear any existing timer if not authenticated
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
        sessionCheckTimerRef.current = null;
      }
      return;
    }

    // Define session check function that uses api
    const checkSessionStatus = async () => {
      try {
        await api.get('/session-status/');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('❌ Session check failed: account logged in elsewhere');
          alert('Your account has been logged in on another device. Please login again.');
          logout();
        }
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