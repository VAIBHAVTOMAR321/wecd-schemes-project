import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = "/wecdschemes/wecdschemes_backend/api";

// ==========================================================
// IDLE TIMEOUT SETTINGS (5 Minutes)
// ==========================================================
const IDLE_TIMEOUT_MINUTES = 5;
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// ==========================================================
// REFRESH CONTROL
// ==========================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// ==========================================================
// CSRF TOKEN
// ==========================================================
const getCSRFToken = () => {
  const name = "csrftoken";
  let cookieValue = null;

  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      if (cookie.substring(0, name.length + 1) === name + "=") {
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
    "Content-Type": "application/json",
    ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
  };
};

// ==========================================================
// AUTH FAILURE FLAG
// ==========================================================
let authFailureHandled = false;

// ==========================================================
// REFRESH TOKEN FAILURE
// This means authentication/refresh has failed.
// ==========================================================
const handleSessionTimeout = () => {
  if (authFailureHandled) {
    return false;
  }

  authFailureHandled = true;

  alert("Your session has expired. Please login again.");

  return true;
};

// ==========================================================
// SESSION STATUS FAILURE
// Usually means login_version changed / another login.
// ==========================================================
const handleLoggedInElsewhere = () => {
  if (authFailureHandled) {
    return false;
  }

  authFailureHandled = true;

  alert(
    "Your account has been logged in on another device. Please login again.",
  );

  return true;
};

// ==========================================================
// RESET AUTH FAILURE FLAG AFTER LOGIN
// ==========================================================
const resetAuthFailureFlag = () => {
  authFailureHandled = false;
};

// ==========================================================
// CLEAR JAVASCRIPT-ACCESSIBLE COOKIES
// HttpOnly JWT cookies cannot be removed by JS.
// Backend /logout/ removes those.
// ==========================================================
const clearClientCookies = () => {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  cookies.forEach((cookie) => {
    const cookieName = cookie.split("=")[0].trim();

    if (!cookieName) {
      return;
    }

    [
      "/",
      "/wecdschemes",
      "/wecdschemes/Login",
      "/wecdschemes/DirectorDashboard",
      "/wecdschemes/DPODashboard",
      "/wecdschemes/CDPODashboard",
      "/wecdschemes/SectorDashBoard",
      "/wecdschemes/wecdschemes_backend",
      "/wecdschemes/wecdschemes_backend/api",
    ].forEach((path) => {
      document.cookie =
        `${cookieName}=; ` +
        `Max-Age=0; ` +
        `expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
        `path=${path}`;
    });
  });
};

// ==========================================================
// CLEAR STORAGE
// ==========================================================
const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
};

// ==========================================================
// REQUEST CHECKS
// ==========================================================
const isRefreshTokenRequest = (error) => {
  const requestUrl = error?.config?.url || "";

  return requestUrl.includes("/refresh-token/");
};

const isSessionStatusRequest = (error) => {
  const requestUrl = error?.config?.url || "";

  return requestUrl.includes("/session-status/");
};

// ==========================================================
// AUTH PROVIDER
// ==========================================================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [uniqueId, setUniqueId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const refreshPromiseRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const sessionCheckTimerRef = useRef(null);

  const isAuthenticatedRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  const lastActivityRef = useRef(Date.now());

  // ========================================================
  // LOCAL SESSION CLEANUP
  //
  // IMPORTANT:
  // This DOES NOT call /logout/.
  //
  // Used when session-status returns 401 because the
  // server has already invalidated this session.
  // ========================================================
  const clearSessionAndRedirect = useCallback((message = null) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    if (sessionCheckTimerRef.current) {
      clearInterval(sessionCheckTimerRef.current);
      sessionCheckTimerRef.current = null;
    }

    setUser(null);
    setRole(null);
    setUniqueId(null);

    isAuthenticatedRef.current = false;

    clearAllStorage();
    clearClientCookies();

    if (message) {
      alert(message);
    }

    window.history.replaceState(null, "", "/wecdschemes/Login");

    window.location.replace("/wecdschemes/Login");
  }, []);

  // ========================================================
  // REAL LOGOUT
  //
  // This DOES call /logout/.
  //
  // Backend:
  //     login_version += 1
  //     delete auth cookies
  //
  // Used for:
  //     1. User clicking Logout
  //     2. 5-minute idle timeout
  //     3. Refresh-token failure
  // ========================================================
  const logout = useCallback(async ({ timedOut = false } = {}) => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;

    // ----------------------------------------------------
    // Stop refresh/retry processing
    // ----------------------------------------------------
    isRefreshing = false;

    failedQueue.forEach(({ reject }) => {
      if (reject) {
        reject(new Error("Logout in progress"));
      }
    });

    failedQueue = [];
    refreshPromiseRef.current = null;

    // ----------------------------------------------------
    // Stop idle timer
    // ----------------------------------------------------
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    // ----------------------------------------------------
    // Stop session polling
    // ----------------------------------------------------
    if (sessionCheckTimerRef.current) {
      clearInterval(sessionCheckTimerRef.current);

      sessionCheckTimerRef.current = null;
    }

    // ----------------------------------------------------
    // IMPORTANT:
    // Read CSRF BEFORE clearing cookies.
    // ----------------------------------------------------
    const csrfToken = getCSRFToken();

    try {
      await fetch(`${API_URL}/logout/`, {
        method: "POST",
        credentials: "include",

        headers: {
          ...(csrfToken
            ? {
                "X-CSRFToken": csrfToken,
              }
            : {}),
        },
      });
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // --------------------------------------------------
      // Clear frontend authentication state
      // --------------------------------------------------
      setUser(null);
      setRole(null);
      setUniqueId(null);

      isAuthenticatedRef.current = false;

      // --------------------------------------------------
      // Clear storage
      // --------------------------------------------------
      clearAllStorage();

      // --------------------------------------------------
      // Clear JS-accessible cookies
      // HttpOnly JWT cookies are deleted by backend.
      // --------------------------------------------------
      clearClientCookies();

      // --------------------------------------------------
      // Idle timeout message
      // --------------------------------------------------
      if (timedOut) {
        alert(
          `You were idle for ${IDLE_TIMEOUT_MINUTES} minutes. ` +
            "Your session has expired. Please login again.",
        );
      }

      // --------------------------------------------------
      // Redirect to login
      // --------------------------------------------------
      window.history.replaceState(null, "", "/wecdschemes/Login");

      window.location.replace("/wecdschemes/Login");
    }
  }, []);

  // ========================================================
  // LOGIN
  // ========================================================
  const login = useCallback(
    (data) => {
      resetAuthFailureFlag();

      if (data.role && data.unique_id) {
        setUser(data.username || null);
        setRole(data.role);
        setUniqueId(data.unique_id);

        isAuthenticatedRef.current = true;

        lastActivityRef.current = Date.now();

        isLoggingOutRef.current = false;
      } else {
        logout();
      }
    },
    [logout],
  );

  // ========================================================
  // REFRESH ACCESS TOKEN
  // ========================================================
  const refreshAccessToken = useCallback(async () => {
    // ----------------------------------------------------
    // Don't refresh after auth failure
    // ----------------------------------------------------
    if (authFailureHandled) {
      return false;
    }

    // ----------------------------------------------------
    // Existing refresh request
    // ----------------------------------------------------
    if (isRefreshing && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshing = true;

    refreshPromiseRef.current = axios.post(
      `${API_URL}/refresh-token/`,
      {},
      {
        withCredentials: true,
        headers: getCSRFHeaders(),
      },
    );

    try {
      await refreshPromiseRef.current;

      processQueue(null);

      return true;
    } catch (error) {
      console.error("Refresh token failed:", error);

      // --------------------------------------------------
      // If idle timeout reached
      // --------------------------------------------------
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        await logout({
          timedOut: true,
        });
      } else {
        // ------------------------------------------------
        // Active user but refresh failed
        // ------------------------------------------------
        handleSessionTimeout();

        await logout();
      }

      processQueue(error);

      return false;
    } finally {
      isRefreshing = false;
      refreshPromiseRef.current = null;
    }
  }, [logout]);

  // ========================================================
  // INITIALIZE AUTH STATE
  // ========================================================
  useEffect(() => {
    setIsReady(true);

    isAuthenticatedRef.current = !!user;
  }, [user]);

  // ========================================================
  // IDLE TIMEOUT
  //
  // This DOES call /logout/.
  // ========================================================
  useEffect(() => {
    if (!user || !role || !isAuthenticatedRef.current) {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);

        logoutTimerRef.current = null;
      }

      return undefined;
    }

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();

      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      logoutTimerRef.current = setTimeout(() => {
        logout({
          timedOut: true,
        });
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });

      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);

        logoutTimerRef.current = null;
      }
    };
  }, [user, role, logout]);

  // ========================================================
  // PREVENT BACK NAVIGATION AFTER LOGOUT
  // ========================================================
  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticatedRef.current) {
        window.location.replace("/wecdschemes/Login");
      } else {
        const path = window.location.pathname;

        const isLoginPage = path.includes("/Login") || path.includes("/login");

        if (isLoginPage) {
          window.history.forward();

          const confirmed = window.confirm("Are you sure you want to logout?");

          if (confirmed) {
            logout();
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [logout]);

  // ========================================================
  // AUTHENTICATED AXIOS INSTANCE
  // ========================================================
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true,

      headers: {
        "Content-Type": "application/json",
      },
    });

    // ======================================================
    // REQUEST INTERCEPTOR
    // ======================================================
    instance.interceptors.request.use(
      (config) => {
        const method = config.method?.toUpperCase();

        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          const csrfToken = getCSRFToken();

          if (csrfToken) {
            config.headers["X-CSRFToken"] = csrfToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // ======================================================
    // RESPONSE INTERCEPTOR
    // ======================================================
    instance.interceptors.response.use(
      (response) => response,

      async (error) => {
        const originalRequest = error.config;

        // --------------------------------------------------
        // If another request already handled auth failure
        // --------------------------------------------------
        if (authFailureHandled) {
          return Promise.reject(error);
        }

        // ==================================================
        // CASE 1:
        // SESSION STATUS FAILED
        //
        // IMPORTANT:
        // DO NOT CALL /logout/
        //
        // Server already rejected this session.
        // ==================================================
        if (error.response?.status === 401 && isSessionStatusRequest(error)) {
          if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
            clearSessionAndRedirect(
              `You were idle for ${IDLE_TIMEOUT_MINUTES} minutes. ` +
                "Your session has expired. Please login again.",
            );
          } else {
            handleLoggedInElsewhere();

            clearSessionAndRedirect();
          }

          return Promise.reject(error);
        }

        // ==================================================
        // CASE 2:
        // ANY OTHER 401
        //
        // Try refresh token.
        // ==================================================
        if (error.response?.status === 401 && !originalRequest?._retry) {
          // ------------------------------------------------
          // If refresh already running, queue request
          // ------------------------------------------------
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({
                resolve,
                reject,
              });
            })
              .then(() => {
                return instance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;

          // ------------------------------------------------
          // Try refresh
          // ------------------------------------------------
          const refreshed = await refreshAccessToken();

          if (refreshed) {
            // ----------------------------------------------
            // Add latest CSRF token
            // ----------------------------------------------
            const method = originalRequest.method?.toUpperCase();

            if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
              const csrfToken = getCSRFToken();

              if (csrfToken) {
                originalRequest.headers["X-CSRFToken"] = csrfToken;
              }
            }

            return instance(originalRequest);
          }

          return Promise.reject(error);
        }

        return Promise.reject(error);
      },
    );

    return instance;
  }, [logout, refreshAccessToken, clearSessionAndRedirect]);

  // ========================================================
  // SESSION STATUS POLLING
  //
  // Calls:
  //     GET /session-status/
  //
  // If 401:
  //     interceptor handles it
  //
  // It does NOT call /logout/.
  // ========================================================
  useEffect(() => {
    if (!isAuthenticatedRef.current || !user || !role || !api) {
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);

        sessionCheckTimerRef.current = null;
      }

      return undefined;
    }

    const checkSessionStatus = async () => {
      // --------------------------------------------------
      // Don't check after auth failure
      // --------------------------------------------------
      if (authFailureHandled || isRefreshing || isLoggingOutRef.current) {
        return;
      }

      try {
        await api.get("/session-status/");
      } catch (error) {
        // ------------------------------------------------
        // 401 is handled by axios interceptor.
        // Do nothing here.
        // ------------------------------------------------
      }
    };

    // ------------------------------------------------------
    // Initial check after 2 seconds
    // ------------------------------------------------------
    const initialCheckTimer = setTimeout(() => {
      checkSessionStatus();

      // --------------------------------------------------
      // Check every 30 seconds
      // --------------------------------------------------
      sessionCheckTimerRef.current = setInterval(checkSessionStatus, 30000);
    }, 2000);

    return () => {
      clearTimeout(initialCheckTimer);

      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);

        sessionCheckTimerRef.current = null;
      }
    };
  }, [user, role, api]);

  // ========================================================
  // CONTEXT VALUE
  // ========================================================
  const value = useMemo(
    () => ({
      user,
      role,
      uniqueId,

      login,
      logout,

      api,
      refreshAccessToken,

      isAuthenticated: isAuthenticatedRef.current,

      isReady,
    }),
    [user, role, uniqueId, login, logout, api, refreshAccessToken, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==========================================================
// USE AUTH
// ==========================================================
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}