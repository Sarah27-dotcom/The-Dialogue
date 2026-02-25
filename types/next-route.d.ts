// Type declaration for SOCKET export in route handlers
declare namespace NextWebSocket {
  export interface WebSocketRouteHandler {
    SOCKET?: (
      client: import('ws').WebSocket,
      request: import('http').IncomingMessage,
      server: import('ws').WebSocketServer,
    ) => void;
  }
}

declare module 'next/server' {
  export type RouteHandler = NextWebSocket.WebSocketRouteHandler;
}
