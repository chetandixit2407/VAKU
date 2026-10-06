import { useEffect, useRef, useState, useCallback } from 'react';
import type { UserRole, DomainEvent } from '../types/index.ts';

interface RealtimeOptions {
  role?: UserRole;
  userId?: string;
  sessionToken?: string;
  onEvent?: (event: { type: string; payload?: any; eventId?: string; timestamp?: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRealtimeEvents({
  role = 'HR',
  userId = '',
  sessionToken = '',
  onEvent,
  onConnect,
  onDisconnect,
}: RealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{
    type: string;
    payload?: any;
    eventId?: string;
    timestamp: number;
  } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  const onDisconnectRef = useRef(onDisconnect);
  onDisconnectRef.current = onDisconnect;

  const lastEventTimestampRef = useRef<string>(new Date().toISOString());

  const hasConnectedBeforeRef = useRef<boolean>(false);

  // Request missed events on reconnect
  const resyncMissedEvents = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/events/resync?since=${encodeURIComponent(lastEventTimestampRef.current)}&role=${encodeURIComponent(role)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          data.events.forEach((evt: DomainEvent) => {
            if (!processedEventIdsRef.current.has(evt.eventId)) {
              processedEventIdsRef.current.add(evt.eventId);
              if (onEventRef.current) {
                onEventRef.current({
                  type: evt.eventType,
                  payload: evt,
                  eventId: evt.eventId,
                  timestamp: evt.timestamp,
                });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('Failed to resync missed events', err);
    }
  }, [role]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {
        // ignore
      }
    }

    const queryParams = new URLSearchParams();
    if (role) queryParams.set('role', role);
    if (userId) queryParams.set('userId', userId);
    if (sessionToken) queryParams.set('token', sessionToken);

    const url = `/api/events?${queryParams.toString()}`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      if (onConnectRef.current) {
        onConnectRef.current();
      }
      if (hasConnectedBeforeRef.current) {
        // Reconnected after drop: automatically synchronize missed events
        resyncMissedEvents();
      } else {
        hasConnectedBeforeRef.current = true;
      }
    };

    es.onmessage = (e) => {
      try {
        if (!e.data || e.data.startsWith(':')) return; // ignore keepalive
        const data = JSON.parse(e.data);

        // Check for idempotency using eventId
        const eventId = data.eventId || data.payload?.eventId;
        if (eventId && processedEventIdsRef.current.has(eventId)) {
          console.log('[SSE] Duplicate event discarded by idempotency key:', eventId);
          return;
        }

        if (eventId) {
          processedEventIdsRef.current.add(eventId);
          // Bound size of set to 500 items
          if (processedEventIdsRef.current.size > 500) {
            const arr = Array.from(processedEventIdsRef.current);
            processedEventIdsRef.current = new Set(arr.slice(arr.length - 250));
          }
        }

        if (data.timestamp || data.payload?.timestamp) {
          lastEventTimestampRef.current = data.timestamp || data.payload?.timestamp;
        }

        setLastEvent({
          type: data.type,
          payload: data.payload,
          eventId,
          timestamp: Date.now(),
        });

        if (onEventRef.current) {
          onEventRef.current(data);
        }
      } catch (err) {
        console.warn('Failed to parse SSE event data', err);
      }
    };

    es.onerror = () => {
      setConnected(false);
      if (onDisconnectRef.current) {
        onDisconnectRef.current();
      }
      // Browser EventSource automatically retries connection
    };
  }, [role, userId, sessionToken]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [connect]);

  return {
    connected,
    lastEvent,
    reconnect: connect,
    resyncMissedEvents,
  };
}
