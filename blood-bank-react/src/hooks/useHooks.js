/**
 * ============================================
 * OPTIMIZED REACT HOOKS
 * ============================================
 * Custom hooks to prevent duplicate API calls and over-rendering
 * 
 * - useFetch: Safe data fetching with cleanup
 * - usePrevious: Track previous values
 * - useDebounce: Debounce search queries
 * - useAsync: Async operations with loading/error states
 * - useSocket: Socket.io connection with auto-reconnect
 * 
 * Usage in components:
 *   const { data, loading, error } = useFetch('/api/endpoint');
 *   const { execute } = useAsync(apiCallFunction);
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * USE FETCH - Prevents multiple API calls
 * Only fetches once per URL (unless dependencies change)
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to track if component is mounted (prevent memory leaks)
  const isMounted = useRef(true);
  
  // Track previous URL to detect changes
  const prevUrl = useRef(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if URL hasn't changed (prevents re-fetching same data)
    if (prevUrl.current === url) {
      setLoading(false);
      return;
    }

    prevUrl.current = url;
    
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    let aborted = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.get(url, options);

        // Only update state if component is still mounted
        if (!isMounted.current || aborted) return;

        if (response.ok) {
          setData(response.data?.data || response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        if (!isMounted.current || aborted) return;
        setError(err.message);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      aborted = true;
    };
  }, [url, options]);

  const refetch = useCallback(async () => {
    prevUrl.current = null; // Reset to force re-fetch
  }, []);

  return { data, loading, error, refetch };
};

/**
 * USE PREVIOUS - Track previous value
 * Useful for detecting prop changes
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * USE DEBOUNCE - Debounce search/filter inputs
 * Prevents API calls on every keystroke
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * USE ASYNC - Handle async operations
 * Returns: { execute, status, data, error }
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState(immediate ? 'pending' : 'idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      setStatus('pending');
      setData(null);
      setError(null);

      try {
        const response = await asyncFunction(...args);
        if (isMounted.current) {
          setData(response);
          setStatus('success');
        }
        return response;
      } catch (err) {
        if (isMounted.current) {
          setError(err);
          setStatus('error');
        }
        throw err;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
};

/**
 * USE SOCKET - Socket.io connection with auto-reconnect
 */
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Lazy load socket.io client only when needed
    const initSocket = async () => {
      try {
        const io = (await import('socket.io-client')).io;
        
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
          auth: {
            token: localStorage.getItem('token') || localStorage.getItem('adminToken')
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
          transports: ['websocket', 'polling']
        });

        // Connection events
        newSocket.on('connect', () => {
          console.log('✅ Socket connected');
          setConnected(true);

          // Send user authentication
          const userId = localStorage.getItem('userId') || localStorage.getItem('adminId');
          if (userId) {
            newSocket.emit('user-connect', {
              userId: userId,
              token: localStorage.getItem('token') || localStorage.getItem('adminToken')
            });
          }
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          setConnected(false);
        });

        newSocket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      } catch (err) {
        console.error('Failed to initialize socket:', err);
      }
    };

    initSocket();
  }, []);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!socket || !connected) return;

    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { timestamp: Date.now() });
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [socket, connected]);

  return { socket, connected };
};

/**
 * USE LOCAL STORAGE - Sync state with localStorage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
};

/**
 * USE NOTIFICATION - Send notifications
 */
export const useNotification = () => {
  const { showSuccess, showError, showWarning, showInfo } = useContext(NotificationContext);

  return {
    success: (message, title = 'Success') => showSuccess(message, title),
    error: (message, title = 'Error') => showError(message, title),
    warning: (message, title = 'Warning') => showWarning(message, title),
    info: (message, title = 'Info') => showInfo(message, title)
  };
};

// Import NotificationContext for useNotification
import { useContext } from 'react';
import NotificationContext from '../context/NotificationContext';
