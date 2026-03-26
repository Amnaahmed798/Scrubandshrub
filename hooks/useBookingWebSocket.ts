import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '@/lib/auth-service';

interface UseBookingWebSocketOptions {
  enabled?: boolean;
  onBookingUpdate?: (booking: any) => void;
  onBookingCreated?: (booking: any) => void;
  onBookingDeleted?: (bookingId: string) => void;
  fallbackPollInterval?: number; // in milliseconds, default 60000 (1 minute)
  onConnected?: () => void; // Called when WebSocket successfully connects
  refreshOnConnect?: boolean; // Whether to trigger refresh on WebSocket connect (default: true)
}

interface WebSocketMessage {
  type: 'booking.created' | 'booking.updated' | 'booking.deleted' | 'booking.assigned' | 'booking.status_changed' | 
        'new_assignment' | 'status_change' | 'status_update' | 'ping' | 'pong';
  booking?: any;
  booking_id?: string;
  data?: any;
  status?: string;
  timestamp?: string;
}

/**
 * Custom hook for real-time booking updates via WebSocket
 * Falls back to slow polling if WebSocket is disconnected
 */
export function useBookingWebSocket({
  enabled = true,
  onBookingUpdate,
  onBookingCreated,
  onBookingDeleted,
  fallbackPollInterval = 60000,
  onConnected,
  refreshOnConnect = true,
}: UseBookingWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const lastConnectedTimeRef = useRef<number>(0);
  const hasSyncedRef = useRef<boolean>(false); // Track if initial sync has happened
  const MIN_RECONNECT_INTERVAL = 5000; // Minimum 5s between onConnected calls

  const connectWebSocket = useCallback(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) {
      console.log('[BookingWebSocket] No token available, skipping connection');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      // Remove trailing /api/v1 if present to avoid duplication
      const baseUrl = backendUrl.replace('/api/v1', '').replace('http', 'ws');
      const wsUrl = baseUrl + `/api/v1/ws/washer?token=${token}`;

      console.log('[BookingWebSocket] Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[BookingWebSocket] Connected');
        setIsConnected(true);
        setUseFallback(false);
        reconnectAttemptsRef.current = 0;

        // Stop fallback polling if WebSocket connects
        if (fallbackIntervalRef.current) {
          clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }

        // Only trigger onConnected (refresh) once per session to catch race condition
        // This prevents duplicate refreshes on reconnection
        if (refreshOnConnect && !hasSyncedRef.current) {
          const now = Date.now();
          const timeSinceLastConnect = now - lastConnectedTimeRef.current;
          
          if (timeSinceLastConnect >= MIN_RECONNECT_INTERVAL) {
            console.log('[BookingWebSocket] Initial sync: triggering onConnected to catch race condition');
            hasSyncedRef.current = true;
            lastConnectedTimeRef.current = now;
            
            // Notify parent that WebSocket is connected (allows them to refresh data)
            if (onConnected) {
              onConnected();
            }
          } else {
            console.log(`[BookingWebSocket] Reconnect too soon (${timeSinceLastConnect}ms < ${MIN_RECONNECT_INTERVAL}ms), skipping onConnected`);
          }
        } else if (refreshOnConnect && hasSyncedRef.current) {
          console.log('[BookingWebSocket] Already synced this session, skipping refresh on reconnect');
        }
      };

      wsRef.current.onclose = () => {
        console.log('[BookingWebSocket] Disconnected');
        setIsConnected(false);

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[BookingWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectWebSocket();
          }, delay);
        } else if (enabled) {
          // Max attempts reached, switch to fallback polling
          console.log('[BookingWebSocket] Max reconnect attempts reached, switching to fallback polling');
          setUseFallback(true);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[BookingWebSocket] Error:', error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[BookingWebSocket] Message received:', message);

          switch (message.type) {
            case 'booking.created':
              if (onBookingCreated && message.booking) {
                onBookingCreated(message.booking);
              }
              break;
            case 'booking.updated':
            case 'booking.status_changed':
            case 'booking.assigned':
            case 'status_update':
            case 'status_change':
              // For status_change, we may need to fetch full booking data
              if (onBookingUpdate && message.booking) {
                onBookingUpdate(message.booking);
              } else if (message.booking_id && onBookingUpdate) {
                // Trigger a refresh if we only have booking_id
                triggerRefresh();
              }
              break;
            case 'new_assignment':
              // New assignment from admin
              if (message.data) {
                if (onBookingCreated) {
                  onBookingCreated(message.data);
                } else {
                  triggerRefresh();
                }
              }
              break;
            case 'booking.deleted':
              if (onBookingDeleted && message.booking_id) {
                onBookingDeleted(message.booking_id);
              }
              break;
            case 'ping':
              // Respond to ping to keep connection alive
              wsRef.current?.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('[BookingWebSocket] Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('[BookingWebSocket] Failed to create WebSocket:', error);
      setUseFallback(true);
    }
  }, [enabled, onBookingUpdate, onBookingCreated, onBookingDeleted]);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connectWebSocket();
    }

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Reset hasSyncedRef so new session can sync again
      hasSyncedRef.current = false;
      console.log('[BookingWebSocket] Cleanup: reset hasSyncedRef for next session');
    };
  }, [enabled, connectWebSocket]);

  // Fallback polling when WebSocket is not available
  useEffect(() => {
    if (useFallback && enabled && fallbackPollInterval > 0) {
      console.log(`[BookingWebSocket] Using fallback polling every ${fallbackPollInterval / 1000}s`);

      fallbackIntervalRef.current = setInterval(() => {
        // Trigger a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('booking-fallback-poll'));
      }, fallbackPollInterval);
    }

    return () => {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [useFallback, enabled, fallbackPollInterval]);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('booking-manual-refresh'));
  }, []);

  return {
    isConnected,
    useFallback,
    triggerRefresh,
  };
}
