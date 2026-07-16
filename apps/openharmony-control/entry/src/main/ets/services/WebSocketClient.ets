import webSocket from '@ohos.net.webSocket';
import http from '@ohos.net.http';
import { buildWebSocketUrl } from '../config/ServiceEndpointConfig';
import { AuthenticatedHttpClient, AuthenticatedHttpError, createAuthenticatedHttp } from './authenticated-http';

interface WebSocketTicketResponse { ticket: string; }
interface WebSocketTicketRequest { clientId: string; }

export function reconnectDelayMs(attempt: number, jitter: number = Math.random()): number {
  const base = Math.min(30000, 1000 * Math.pow(2, attempt));
  const factor = 0.5 + jitter;
  return Math.min(30000, Math.round(base * factor));
}

export class WebSocketClient {
  private readonly ws = webSocket.createWebSocket();
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly httpClient: AuthenticatedHttpClient;
  private reconnectAttempt: number = 0;
  private reconnectTimer: number = 0;
  private connecting: boolean = false;
  private stopped: boolean = false;
  public onMessageCallback?: (event: string, payload: Object) => void;
  public onConnectionError?: (message: string) => void;

  constructor(baseUrl: string, clientId: string = 'openharmony-control') {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.httpClient = createAuthenticatedHttp();
    this.bindListeners();
  }

  private bindListeners(): void {
    this.ws.on('open', () => { this.connecting = false; this.reconnectAttempt = 0; });
    this.ws.on('message', (err, value) => {
      if (typeof value !== 'string' || this.onMessageCallback === undefined) return;
      try {
        const data = JSON.parse(value) as Record<string, Object>;
        this.onMessageCallback(data.event as string, data.payload);
      } catch (error) { console.error('Invalid WebSocket message format'); }
    });
    this.ws.on('close', () => { this.connecting = false; this.scheduleReconnect(); });
    this.ws.on('error', () => { this.connecting = false; this.scheduleReconnect(); });
  }

  public connect(): void { void this.connectWithFreshTicket(); }

  private async connectWithFreshTicket(): Promise<void> {
    if (this.stopped || this.connecting) return;
    this.connecting = true;
    try {
      const request: WebSocketTicketRequest = { clientId: this.clientId };
      const response = await this.httpClient.request(`${this.baseUrl}/api/auth/websocket-ticket`, {
        method: http.RequestMethod.POST,
        header: { 'content-type': 'application/json' },
        extraData: JSON.stringify(request),
        expectDataType: http.HttpDataType.STRING,
      });
      const ticketResponse = JSON.parse(response.result as string) as WebSocketTicketResponse;
      const url = buildWebSocketUrl(this.baseUrl, this.clientId, ticketResponse.ticket);
      this.ws.connect(url, (error) => {
        if (error) { this.connecting = false; this.scheduleReconnect(); }
      });
    } catch (error) {
      this.connecting = false;
      if (error instanceof AuthenticatedHttpError && error.statusCode === 401) {
        this.stopped = true;
        if (this.onConnectionError !== undefined) this.onConnectionError('AUTH_CREDENTIAL_REJECTED');
        return;
      }
      const retryAfter = error instanceof AuthenticatedHttpError ? error.retryAfterSeconds : undefined;
      this.scheduleReconnect(retryAfter);
    }
  }

  private scheduleReconnect(retryAfterSeconds?: number): void {
    if (this.stopped || this.reconnectTimer !== 0) return;
    const delay = retryAfterSeconds === undefined ? reconnectDelayMs(this.reconnectAttempt) : retryAfterSeconds * 1000;
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = 0;
      void this.connectWithFreshTicket();
    }, delay);
  }

  public shutdown(): void {
    this.stopped = true;
    this.connecting = false;
    if (this.reconnectTimer !== 0) { clearTimeout(this.reconnectTimer); this.reconnectTimer = 0; }
    this.ws.close();
  }
}
