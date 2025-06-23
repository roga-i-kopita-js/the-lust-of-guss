import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { WebSocketClient } from "./web-socket-client";

export type WebSocketContextValue = {
  client: WebSocketClient;
};

export const webSocketContext = createContext<WebSocketContextValue | null>(
  null,
);

export const WebSocketContext: FC<{
  token: string | null;
  children: ReactNode;
}> = ({ token, children }) => {
  const clientRef = useRef<WebSocketClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = new WebSocketClient(
      import.meta.env.VITE_BACKEND_URL + "rounds",
      token,
    );
  }
  const client = clientRef.current;

  useEffect(() => {
    client.reconnect(token);
  }, [token, client]);

  useEffect(() => {
    return () => {
      client.disconnect();
    };
  }, [client]);

  return (
    <webSocketContext.Provider value={{ client }}>
      {children}
    </webSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(webSocketContext);

  if (!context) {
    throw new Error("WebSocket not provided");
  }

  return context;
};
