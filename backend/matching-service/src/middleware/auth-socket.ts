import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

interface JWTPayload {
  userId: string;
  [key: string]: any;
}

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const authHeader = socket.handshake.auth?.authorization || socket.handshake.headers?.authorization;

    if (!authHeader) {
      return next(new Error('Missing Authorization header'));
    }


    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new Error('Invalid Authorization header format'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    (socket as AuthenticatedSocket).data = {
      userId: decoded.userId
    };

    console.log('Socket authenticated for userId:', decoded.userId);
    next();

  } catch (err: any) {
    console.error('Socket authentication failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return next(new Error('Access token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    return next(new Error('Authentication failed'));
  }
};

export type { AuthenticatedSocket };
