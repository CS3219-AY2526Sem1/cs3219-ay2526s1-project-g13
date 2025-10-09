import { DIFFICULTY, QUESTION_TOPIC, MatchRequest, MatchResult } from '../models/types';
import { QueueService } from '../services/queueService';
import fetch from 'node-fetch';

export class MatchingService {
  private static readonly QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:8003';

  // Start matching process
  static async startMatching(socketId: string, request: MatchRequest): Promise<{
    success: boolean;
    roomId?: string;
    waitingUser?: string;
    questions?: any[];
  }> {
    try {
      const matchResult = await QueueService.findMatch(socketId, request.difficulty, request.topic);
      
      if (matchResult.matched) {
        const questions = await this.fetchQuestions(request.difficulty, request.topic);
        
        return {
          success: true,
          roomId: matchResult.roomId,
          waitingUser: matchResult.waitingUser,
          questions,
        };
      } else {
        const roomId = await QueueService.addToQueue(socketId, request.difficulty, request.topic);
        
        return {
          success: true,
          roomId,
        };
      }
    } catch (error) {
      console.error('Error in matching service:', error);
      return { success: false };
    }
  }

  // Fetch questions from question service
  private static async fetchQuestions(difficulty: DIFFICULTY, topic: QUESTION_TOPIC): Promise<any[]> {
    try {
      const response = await fetch(`${this.QUESTION_SERVICE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty,
          topic,
          count: 1, // Get 1 question
        }),
      });

      if (!response.ok) {
        throw new Error(`Question service error: ${response.statusText}`);
      }

      const data = await response.json() as { questions?: any[] };
      return data.questions || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }

  // Handle user leaving
  static async handleUserLeave(socketId: string): Promise<void> {
    await QueueService.removeFromQueue(socketId);
  }

  // Get queue statistics
  static async getQueueStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    for (const difficulty of Object.values(DIFFICULTY)) {
      for (const topic of Object.values(QUESTION_TOPIC)) {
        const key = `${difficulty}:${topic}`;
        stats[key] = await QueueService.getQueueLength(difficulty, topic);
      }
    }
    
    return stats;
  }
}