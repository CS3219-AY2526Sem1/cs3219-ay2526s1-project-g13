import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

interface JWTPayload {
  username: string;
  [key: string]: any;
}

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  const isDebugMode = process.env.DEBUG_MODE === 'true';
  
  try {
    if (isDebugMode) {
      const authHeader = socket.handshake.auth?.authorization || socket.handshake.headers?.authorization;
      
      if (authHeader) {
        const [scheme, token] = authHeader.split(' ');
        if (scheme === 'Bearer' && token.startsWith('mock-token-')) {
          const userId = token.replace('mock-token-', '');
          (socket as AuthenticatedSocket).data = { userId };
          console.log('[DEBUG MODE] Socket authenticated for userId:', userId);
          return next();
        }
      }
      
      // If no valid auth, set a default userId for testing
      (socket as AuthenticatedSocket).data = { userId: `test-user-${Date.now()}` };
      console.log('[DEBUG MODE] Socket authenticated with default userId:', (socket as AuthenticatedSocket).data.userId);
      return next();
    }
    
    // Production mode: JWT verification
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
      userId: decoded.username
    };

    console.log('Socket authenticated for userId:', decoded.username);
    next();

  } catch (err: any) {
    console.error('Socket authentication failed:', err.message);
    
    if (isDebugMode) {
      (socket as AuthenticatedSocket).data = { userId: `error-user-${Date.now()}` };
      return next();
    }
    
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