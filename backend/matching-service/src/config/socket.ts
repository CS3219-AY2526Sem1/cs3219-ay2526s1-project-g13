import { Server } from 'socket.io';
import http from 'http';
import { authenticateSocket } from '../middleware/auth-socket';

interface UserConnection {
    socketId: string;
    userId: string;
    connectedAt: number;
    isInQueue: boolean;
}

class SocketManager {
    private io: Server | null = null;
    
    public init(server: http.Server): Server {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        this.io.use(authenticateSocket);
        return this.io;
    }

    public getServer(): Server {
        if (!this.io) {
            throw new Error('Socket.io is not initialized! Call init() first.');
        }
        return this.io;
    }
}

const socketManager = new SocketManager();

export const initSocket = async (server: http.Server): Promise<Server> => {
    return socketManager.init(server);
};

export const getSocket = (): Server => {
    return socketManager.getServer();
};


