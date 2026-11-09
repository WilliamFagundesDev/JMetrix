import { WebSocketServer, WebSocket } from 'ws';

let wss = null;

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'subscribe_test') {
          ws.subscribedTestId = data.testId;
        }
      } catch {}
    });

    // Send initial connection ACK
    ws.send(JSON.stringify({ type: 'connected', message: 'JMETRIX Real-time Engine Connected' }));
  });

  // Heartbeat interval to clean up stale connections
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function broadcast(event, payload) {
  if (!wss) return;
  const message = JSON.stringify({ event, data: payload, timestamp: Date.now() });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // If client subscribed to specific test, only send if matches or if general event
      if (!client.subscribedTestId || !payload.testId || client.subscribedTestId === payload.testId) {
        client.send(message);
      }
    }
  });
}

