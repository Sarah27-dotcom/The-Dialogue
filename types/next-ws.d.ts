// Type declarations for next-ws SOCKET export
declare module 'next-ws' {
  export function SOCKET(
    client: import('ws').WebSocket,
    request: import('http').IncomingMessage,
    server: import('ws').WebSocketServer,
  ): void;
}

declare module 'next-ws/server' {
  export function getHttpServer(): import('http').Server | undefined;
  export function setHttpServer(value: import('http').Server): boolean;
  export function getWebSocketServer(): import('ws').WebSocketServer | undefined;
  export function setWebSocketServer(value: import('ws').WebSocketServer): boolean;
  export function setupWebSocketServer(nextServer: any): void;
}

declare module 'next-ws/client' {
  import { ComponentType, ReactNode } from 'react';

  export interface WebSocketProviderProps {
    children: ReactNode;
    url: string;
    protocols?: string[] | string;
    binaryType?: BinaryType;
  }

  export const WebSocketProvider: ComponentType<WebSocketProviderProps>;

  export function useWebSocket(): WebSocket | null;
}
