import { ref, onMounted, onUnmounted } from 'vue';

const isConnected = ref(false);
const subscribers = new Map();
let socket = null;
let reconnectTimer = null;

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      isConnected.value = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onclose = () => {
      isConnected.value = false;
      // Auto-reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    socket.onerror = () => {
      isConnected.value = false;
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventName = payload.event;
        if (eventName && subscribers.has(eventName)) {
          const callbacks = subscribers.get(eventName);
          callbacks.forEach(cb => cb(payload.data, payload.timestamp));
        }
      } catch {}
    };
  } catch (err) {
    isConnected.value = false;
  }
}

export function useWebSocket() {
  function subscribe(eventName, callback) {
    if (!subscribers.has(eventName)) {
      subscribers.set(eventName, new Set());
    }
    subscribers.get(eventName).add(callback);

    return () => {
      if (subscribers.has(eventName)) {
        subscribers.get(eventName).delete(callback);
      }
    };
  }

  function subscribeTest(testId) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe_test', testId }));
    }
  }

  onMounted(() => {
    connect();
  });

  return {
    isConnected,
    subscribe,
    subscribeTest
  };
}

