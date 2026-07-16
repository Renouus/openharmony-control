// Task 12 will replace this demo default through the product build profile.
// Runtime code must consume this single value instead of declaring endpoints.
export const SERVICE_API_BASE_URL: string = 'http://10.0.2.2:3443';
export const WEBSOCKET_EVENTS_PATH: string = '/ws/events';

export function buildWebSocketUrl(baseUrl: string, clientId: string, ticket: string): string {
  let socketBase = baseUrl;
  if (socketBase.startsWith('https://')) {
    socketBase = `wss://${socketBase.substring(8)}`;
  } else if (socketBase.startsWith('http://')) {
    socketBase = `ws://${socketBase.substring(7)}`;
  }
  while (socketBase.endsWith('/')) {
    socketBase = socketBase.substring(0, socketBase.length - 1);
  }
  return `${socketBase}${WEBSOCKET_EVENTS_PATH}?ticket=${encodeURIComponent(ticket)}&clientId=${encodeURIComponent(clientId)}`;
}
