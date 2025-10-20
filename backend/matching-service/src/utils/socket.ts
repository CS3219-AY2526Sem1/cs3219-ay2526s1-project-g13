import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server): Server => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    return io;
}

export const getSocket = (): Server => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
}

export const isValidSocketId = (io: Server, socketId: string): boolean => {
    return io.sockets.sockets.has(socketId);
}
