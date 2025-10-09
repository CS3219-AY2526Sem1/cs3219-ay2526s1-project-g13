import { Socket } from 'socket.io';
import { MatchingService } from '../services/matchingService';
import { QueueService } from '../services/queueService';
import { DIFFICULTY, QUESTION_TOPIC, USER_STATUS } from '../models/types';

export class MatchHandler {
  private socket: Socket;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('matchStart', this.handleMatchStart.bind(this));
    this.socket.on('matchLeave', this.handleMatchLeave.bind(this));
    this.socket.on('matchEndSession', this.handleMatchEndSession.bind(this));
    this.socket.on('stopQueuing', this.handleStopQueuing.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  private async handleMatchStart(data: { difficulty: DIFFICULTY; topic: QUESTION_TOPIC }): Promise<void> {
    try {
      const result = await MatchingService.startMatching(this.socket.id, data);
      
      if (result.success) {
        if (result.roomId && result.waitingUser) {
          // Match found!
          this.socket.join(result.roomId);
          
          // Notify both users
          this.socket.emit('matchSuccess', {
            roomId: result.roomId,
            questions: result.questions,
            partner: result.waitingUser,
          });
          
          this.socket.to(result.waitingUser).emit('matchSuccess', {
            roomId: result.roomId,
            questions: result.questions,
            partner: this.socket.id,
          });
        } else if (result.roomId) {
          // Added to queue, start countdown
          this.socket.join(result.roomId);
          this.startCountdown(result.roomId, data.difficulty, data.topic);
        }
      } else {
        this.socket.emit('matchError', { message: 'Failed to start matching' });
      }
    } catch (error) {
      console.error('Error in handleMatchStart:', error);
      this.socket.emit('matchError', { message: 'Internal server error' });
    }
  }

  private startCountdown(roomId: string, difficulty: DIFFICULTY, topic: QUESTION_TOPIC): void {
    let counter = 30;
    
    const countdown = setInterval(async () => {
      this.socket.emit('matchCountdown', counter);
      
      if (counter <= 0) {
        clearInterval(countdown);
        this.timers.delete(roomId);
        
        // Remove from queue
        await MatchingService.handleUserLeave(this.socket.id);
        this.socket.leave(roomId);
        this.socket.emit('matchTimeout', { message: 'No match found' });
      }
      
      counter--;
    }, 1000);
    
    this.timers.set(roomId, countdown);
  }

  private async handleMatchLeave(): Promise<void> {
    // Find room and notify other user
    const rooms = await QueueService.getActiveRooms();
    
    for (const roomKey of rooms) {
      const roomData = await QueueService.getRoomData(roomKey);
      
      if (roomData.user1 === this.socket.id || roomData.user2 === this.socket.id) {
        const otherUser = roomData.user1 === this.socket.id ? roomData.user2 : roomData.user1;
        
        // Notify other user
        this.socket.to(otherUser).emit('matchLeave', { message: 'Partner left the room' });
        
        // Clean up room
        await QueueService.cleanupRoom(roomKey.split(':')[1]);
        break;
      }
    }
  }

  private async handleMatchEndSession(data: { roomId: string }): Promise<void> {
    this.socket.leave(data.roomId);
    await QueueService.cleanupRoom(data.roomId);
  }

  private async handleStopQueuing(): Promise<void> {
    await MatchingService.handleUserLeave(this.socket.id);
    
    // Clear any active timers
    for (const [roomId, timer] of this.timers) {
      clearInterval(timer);
      this.socket.leave(roomId);
    }
    this.timers.clear();
  }

  private async handleDisconnect(): Promise<void> {
    await MatchingService.handleUserLeave(this.socket.id);
    
    // Clear timers
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}