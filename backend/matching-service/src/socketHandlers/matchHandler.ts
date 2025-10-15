import { Socket } from 'socket.io';
import { MatchingService } from '../services/matchingService';
import { DIFFICULTY, QUESTION_TOPIC } from '../models/types';

export class MatchHandler {
  private socket: Socket;
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('matchStart', this.handleMatchStart.bind(this));
    this.socket.on('stopQueuing', this.handleStopQueuing.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  private async handleMatchStart(data: { difficulty?: DIFFICULTY; topic?: QUESTION_TOPIC }): Promise<void> {
    try {
      const result = await MatchingService.startMatching(this.socket.id, data);

      if (!result.success) {
        this.socket.emit('matchError', { message: 'Failed to start matching' });
        return;
      }

      if (result.roomId && result.waitingUser) {
        // Match found — stop countdowns for BOTH sockets
        MatchHandler.clearTimerFor(this.socket.id);
        MatchHandler.clearTimerFor(result.waitingUser);

        this.socket.join(result.roomId);

        this.socket.emit('matchSuccess', {
          roomId: result.roomId,
          questions: result.questions,
          partner: result.waitingUser,
          collaborationRoomId: result.collaborationRoomId,
        });

        this.socket.to(result.waitingUser).emit('matchSuccess', {
          roomId: result.roomId,
          questions: result.questions,
          partner: this.socket.id,
          collaborationRoomId: result.collaborationRoomId,
        });
      } else if (result.roomId) {
        this.socket.join(result.roomId);
        this.startCountdown(this.socket.id);
      }
    } catch (error) {
      console.error('Error in handleMatchStart:', error);
      this.socket.emit('matchError', { message: 'Internal server error' });
    }
  }

  private startCountdown(socketId: string): void {
    // Prevent duplicate intervals for the same user
    MatchHandler.clearTimerFor(socketId);

    let counter = 30;

    const countdown = setInterval(async () => {
      this.socket.emit('matchCountdown', counter);

      if (counter <= 0) {
        clearInterval(countdown);
        MatchHandler.timers.delete(socketId);

        await MatchingService.handleUserLeave(this.socket.id);
        this.socket.emit('matchTimeout', { message: 'No match found' });
      }

      counter--;
    }, 1000);

    MatchHandler.timers.set(socketId, countdown);
  }


  private static clearTimerFor(socketId: string): void {
    const t = MatchHandler.timers.get(socketId);
    if (t) {
      clearInterval(t);
      MatchHandler.timers.delete(socketId);
    }
  }

  private async handleStopQueuing(): Promise<void> {
    await MatchingService.handleUserLeave(this.socket.id);
    MatchHandler.clearTimerFor(this.socket.id);
  }

  private async handleDisconnect(): Promise<void> {
    await MatchingService.handleUserLeave(this.socket.id);
    MatchHandler.clearTimerFor(this.socket.id);
  }
}