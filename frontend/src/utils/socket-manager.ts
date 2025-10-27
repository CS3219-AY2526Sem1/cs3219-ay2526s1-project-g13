import { io, Socket, SocketOptions } from "socket.io-client";

interface SocketConfig {
  url: string;
  options?: Partial<SocketOptions>;
  token?: string;
}

import { ServiceType } from "@/utils/enums";

class SocketManager {
  private sockets: Map<ServiceType, Socket> = new Map();

  getSocket(service: ServiceType): Socket | null {
    return this.sockets.get(service) || null;
  }

  createSocket(service: ServiceType, config: SocketConfig): Socket {
    // Return existing socket if available and connected
    const existingSocket = this.sockets.get(service);
    if (existingSocket && existingSocket.connected) {
      return existingSocket;
    }

    // Disconnect existing socket if it exists but not connected
    if (existingSocket) {
      existingSocket.disconnect();
    }

    const socket = io(config.url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: config.token ? { authorization: `Bearer ${config.token}` } : undefined,
      ...config.options,
    });

    this.sockets.set(service, socket);
    return socket;
  }

  connect(service: ServiceType): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.sockets.get(service);
      if (!socket) {
        reject(new Error(`Socket for service ${service} not found`));
        return;
      }

      if (socket.connected) {
        resolve();
        return;
      }

      socket.connect();

      const onConnect = () => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
        resolve();
      };

      const onError = (error: Error) => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
        reject(error);
      };

      socket.on("connect", onConnect);
      socket.on("connect_error", onError);
    });
  }

  disconnect(service: ServiceType) {
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
    service: ServiceType,
  ): "disconnected" | "connecting" | "connected" | "reconnecting" {
    const socket = this.sockets.get(service);
    if (!socket) return "disconnected";

    if (socket.connected) return "connected";
    if (socket.disconnected) return "disconnected";
    return "connecting";
  }

  // Update socket auth token
  updateSocketAuth(service: ServiceType, token: string) {
    const socket = this.sockets.get(service);
    if (socket) {
      socket.auth = { authorization: `Bearer ${token}` };
    }
  }

  // Get all active services
  getActiveServices(): ServiceType[] {
    return Array.from(this.sockets.keys()).filter(
      (service) => this.getConnectionState(service) === "connected",
    );
  }
}

export const socketManager = new SocketManager();
