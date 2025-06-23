import { io, Socket } from "socket.io-client";
import type { Round, HitInfo } from "./types";

export interface Events {
  "round.hit": HitInfo;
  "round.create": Round;
}

export class WebSocketClient {
  protected client: Socket;

  constructor(
    protected readonly apiUrl: string,
    token: string | null,
  ) {
    this.client = this.initClient(apiUrl, token);
    this.client.on("connect", () => console.log("✅ SOCKET.IO connected"));
    this.client.on("connect_error", (err) =>
      console.error("❌ connect_error:", err.message),
    );
  }
  protected initClient(apiUrl: string, token: string | null): Socket {
    return io(apiUrl, {
      auth: token ? { token: token } : undefined,
    });
  }

  public disconnect(): void {
    this.client.disconnect();
  }

  public reconnect(token: string | null) {
    this.client.auth = token ? { token } : {};
    if (!this.client.connected) {
      this.client.connect();
    }
  }

  public isConnected(): boolean {
    return this.client.connected;
  }

  public on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    this.client.on(event as string, listener);
    return this;
  }

  public off<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    this.client.off(event as string, listener);
    return this;
  }

  public emit<K extends keyof Events>(event: K, payload: Events[K]): this {
    this.client.emit(event as string, payload);
    return this;
  }
}
