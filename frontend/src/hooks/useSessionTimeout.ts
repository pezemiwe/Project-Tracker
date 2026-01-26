import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from '@tanstack/react-router';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSessionTimeout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const absoluteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loginTimeRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    clearAuth();
    navigate({ to: '/login' });
  }, [clearAuth, navigate]);

  const resetIdleTimer = useCallback(() => {
    // Clear existing idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  const setupAbsoluteTimer = useCallback(() => {
    loginTimeRef.current = Date.now();

    // Clear existing absolute timer
    if (absoluteTimerRef.current) {
      clearTimeout(absoluteTimerRef.current);
    }

    // Set absolute timeout timer
    absoluteTimerRef.current = setTimeout(() => {
      console.log('Session expired due to absolute timeout');
      logout();
    }, ABSOLUTE_TIMEOUT_MS);
  }, [logout]);

  const sendHeartbeat = useCallback(() => {
    // In production, send heartbeat to backend
    // For now, just log
    console.log('Heartbeat: session still active');
  }, []);

  const setupHeartbeat = useCallback(() => {
    // Clear existing heartbeat timer
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    // Set up heartbeat interval
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all timers if not authenticated
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }

    // Set up timers
    resetIdleTimer();
    setupAbsoluteTimer();
    setupHeartbeat();

    // Events that should reset idle timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isAuthenticated, resetIdleTimer, setupAbsoluteTimer, setupHeartbeat]);
}
