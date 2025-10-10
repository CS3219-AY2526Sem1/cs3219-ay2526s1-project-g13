import { io, Socket, SocketOptions } from "socket.io-client";

interface SocketConfig {
  url: string;
  options?: Partial<SocketOptions>;
}

class SocketManager {
  private sockets: Map<string, Socket> = new Map();

  getSocket(service: string): Socket | null {
    return this.sockets.get(service) || null;
  }

  createSocket(service: string, config: SocketConfig): Socket {
    // Return existing socket if available
    if (this.sockets.has(service)) {
      return this.sockets.get(service)!;
    }

    const socket = io(config.url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config.options,
    });

    this.sockets.set(service, socket);
    return socket;
  }

  disconnect(service: string) {
    const socket = this.sockets.get(service);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(service);
    }
  }

  disconnectAll() {
    this.sockets.forEach((socket) => socket.disconnect());
    this.sockets.clear();
  }

  getConnectionState(
    service: string,
  ): "disconnected" | "connecting" | "connected" | "reconnecting" {
    const socket = this.sockets.get(service);
    if (!socket) return "disconnected";

    if (socket.connected) return "connected";
    if (socket.disconnected) return "disconnected";
    return "connecting";
  }
}

export const socketManager = new SocketManager();
