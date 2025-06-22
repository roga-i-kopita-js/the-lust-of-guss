import { io, Socket } from "socket.io-client";

interface Events {
  joined: { gameId: string };
  update: {
    totalClicks: number;
    playerScore: number;
    flushed: boolean;
    leaderboard: Array<{ playerId: string; score: number }>;
  };
  finished: {
    winnerId: string;
    leaderboard: Array<{ playerId: string; score: number }>;
  };
}

export class WebSocketClient {
  protected readonly client: Socket;

  constructor(apiUrl: string, token: string | null) {
    this.client = io(apiUrl, {
      transports: ["websocket"],
      auth: token ? { token: `Bearer ${token}` } : undefined,
    });
  }

  public disconnect(): void {
    this.client.disconnect();
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
