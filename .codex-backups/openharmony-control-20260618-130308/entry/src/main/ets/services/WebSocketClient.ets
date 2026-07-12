import webSocket from '@ohos.net.webSocket';

export class WebSocketClient {
  private ws = webSocket.createWebSocket();
  private readonly url: string;
  public onMessageCallback?: (event: string, payload: Object) => void;

  constructor(url: string) {
    this.url = url;
  }

  public connect(): void {
    this.ws.on('open', (err, value) => {
      console.info("WebSocket connection opened");
    });

    this.ws.on('message', (err, value) => {
      if (typeof value === 'string' && this.onMessageCallback) {
        try {
          const data = JSON.parse(value) as Record<string, Object>;
          this.onMessageCallback(data.event as string, data.payload);
        } catch (e) {
          console.error("Invalid WebSocket message format");
        }
      }
    });

    this.ws.on('close', (err, value) => {
      console.info("WebSocket connection closed, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error("WebSocket error", err);
    });

    this.ws.connect(this.url, (err, value) => {
      if (!err) {
        console.info("Connected successfully");
      }
    });
  }
}
