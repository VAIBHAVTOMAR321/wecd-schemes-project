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
// IDLE TIMEOUT SETTINGS (1 Minute)
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
// FULL LOGOUT FUNCTION REF (module-level bridge)
// ==========================================================
const fullLogoutRef = {
  current: null,
};

// ==========================================================
// MULTI-DEVICE LOGIN / FORCED LOGOUT HANDLER
// Used when the user is ACTIVE but the backend kicks them out.
// ==========================================================
const handleLoggedInElsewhere = () => {
  if (authFailureHandled) {
    return false;
  }

  authFailureHandled = true;

  alert(
    "Your account has been logged in on another device. Please login again.",
  );

  if (fullLogoutRef.current) {
    fullLogoutRef.current();
  }

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
// HttpOnly JWT cookies (access_token, refresh_token) MUST
// be deleted by the backend /logout/ endpoint.
// ==========================================================
const clearClientCookies = () => {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  cookies.forEach((cookie) => {
    const cookieName = cookie.split("=")[0].trim();

    if (!cookieName) {
      return;
    }

    const paths = [
      "/",
      "/wecdschemes",
      "/wecdschemes/Login",
      "/wecdschemes/DirectorDashboard",
      "/wecdschemes/DPODashboard",
      "/wecdschemes/CDPODashboard",
      "/wecdschemes/SectorDashBoard",
      "/wecdschemes/wecdschemes_backend",
      "/wecdschemes/wecdschemes_backend/api",
    ];

    const domains = ["", window.location.hostname, "localhost", "127.0.0.1"];

    paths.forEach((path) => {
      domains.forEach((domain) => {
        document.cookie =
          `${cookieName}=; ` +
          `Max-Age=0; ` +
          `expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
          (domain ? `domain=${domain}; ` : "") +
          `path=${path};`;
      });
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
  // REAL LOGOUT (FULL PROCEDURE)
  // This is ALWAYS called, even if the session is dead.
  // ========================================================
  const logout = useCallback(async ({ timedOut = false } = {}) => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;

    // Prevent interceptors from firing 401s or logging errors during logout
    authFailureHandled = true;

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
    // Read CSRF BEFORE clearing cookies
    // ----------------------------------------------------
    const csrfToken = getCSRFToken();

    try {
      // ALWAYS CALL BACKEND LOGOUT TO DELETE HTTPONLY COOKIES
      const response = await fetch(`${API_URL}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
      });

      if (!response.ok) {
        console.warn(
          `Logout API responded with status: ${response.status}. ` +
            `If this is 401/403, your backend /logout/ endpoint MUST be set to AllowAny so it can delete HttpOnly cookies even when the JWT is invalid.`,
        );
      }
    } catch (error) {
      console.error("Logout API network error:", error);
    } finally {
      // --------------------------------------------------
      // Clear frontend authentication state
      // --------------------------------------------------
      setUser(null);
      setRole(null);
      setUniqueId(null);

      isAuthenticatedRef.current = false;
      isLoggingOutRef.current = false;

      // --------------------------------------------------
      // Clear storage & JS-accessible cookies
      // --------------------------------------------------
      clearAllStorage();
      clearClientCookies();

      // --------------------------------------------------
      // Idle timeout message (ONLY if timedOut is true)
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
  // REGISTER LOGOUT WITH MODULE-LEVEL BRIDGE
  // ========================================================
  useEffect(() => {
    fullLogoutRef.current = () => logout();
  }, [logout]);

  // ========================================================
  // LOGIN
  // ========================================================
  const login = useCallback(
    (data) => {
      resetAuthFailureFlag();
      isLoggingOutRef.current = false;

      if (data.role && data.unique_id) {
        setUser(data.username || null);
        setRole(data.role);
        setUniqueId(data.unique_id);

        isAuthenticatedRef.current = true;

        lastActivityRef.current = Date.now();
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
    if (authFailureHandled) {
      return false;
    }

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

      if (isAuthenticatedRef.current) {
        // If the refresh token fails, we check if it was due to being idle for 5 minutes
        if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
          await logout({ timedOut: true });
        } else {
          // If they are actively moving the mouse, it means another device logged in
          handleLoggedInElsewhere();
        }
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
  // IDLE TIMEOUT (5 Minutes)
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
        logout({ timedOut: true });
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

        if (authFailureHandled) {
          return new Promise(() => {});
        }

        if (error.response?.status === 401) {
          if (!isAuthenticatedRef.current) {
            return Promise.reject(error);
          }

          // CASE 1: ALREADY RETRIED -> STILL 401
          // The session is completely dead.
          if (originalRequest?._retry) {
            if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
              logout({ timedOut: true });
            } else {
              handleLoggedInElsewhere();
            }
            return new Promise(() => {});
          }

          // CASE 2: FIRST 401 -> TRY REFRESH
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => instance(originalRequest))
              .catch(() => new Promise(() => {}));
          }

          originalRequest._retry = true;

          const refreshed = await refreshAccessToken();

          if (refreshed) {
            const method = originalRequest.method?.toUpperCase();
            if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
              const csrfToken = getCSRFToken();
              if (csrfToken) {
                originalRequest.headers["X-CSRFToken"] = csrfToken;
              }
            }
            return instance(originalRequest);
          }

          return new Promise(() => {});
        }

        return Promise.reject(error);
      },
    );

    return instance;
  }, [logout, refreshAccessToken]);

  // ========================================================
  // SESSION STATUS POLLING
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
      if (authFailureHandled || isRefreshing || isLoggingOutRef.current) {
        return;
      }

      try {
        await api.get("/session-status/");
      } catch (error) {
        // 401 is handled by axios interceptor.
      }
    };

    const initialCheckTimer = setTimeout(() => {
      checkSessionStatus();
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
