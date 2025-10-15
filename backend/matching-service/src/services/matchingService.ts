import { DIFFICULTY, QUESTION_TOPIC, MatchRequest, MatchResult } from '../models/types';
import { QueueService } from '../services/queueService';
import fetch from 'node-fetch';

export class MatchingService {
  private static readonly QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:8003';
  private static readonly COLLABORATION_SERVICE_URL = process.env.COLLABORATION_SERVICE_URL || 'http://localhost:8004';

  // Start matching process
  static async startMatching(socketId: string, request: MatchRequest): Promise<{
    success: boolean;
    roomId?: string;
    waitingUser?: string;
    questions?: any[];
    collaborationRoomId?: string;
  }> {
    try {
      // Validate that at least one preference is provided
      if (!request.difficulty && !request.topic) {
        return { success: false };
      }

      const matchResult = await QueueService.findMatch(socketId, request.difficulty, request.topic);
      
      if (matchResult.matched) {
        // Create room in collaboration service
        const collaborationRoom = await this.createCollaborationRoom();
        
        if (!collaborationRoom.success) {
          console.error('Failed to create collaboration room:', collaborationRoom.error);
          // Still proceed with matching but log the error
        }
        
        // Use the final difficulty and topic determined by the matching logic
        const questions = await this.fetchQuestions(matchResult.finalDifficulty, matchResult.finalTopic);
        
        return {
          success: true,
          roomId: matchResult.roomId,
          waitingUser: matchResult.waitingUser,
          questions,
          collaborationRoomId: collaborationRoom.roomId,
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

  // Create room in collaboration service
  private static async createCollaborationRoom(): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.COLLABORATION_SERVICE_URL}/api/v1/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Collaboration service error: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; room?: { roomId: string } };
      
      if (data.success && data.room) {
        return { success: true, roomId: data.room.roomId };
      } else {
        return { success: false, error: 'Failed to create room' };
      }
    } catch (error) {
      console.error('Error creating collaboration room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Fetch questions from question service
  private static async fetchQuestions(difficulty?: DIFFICULTY, topic?: QUESTION_TOPIC): Promise<any[]> {
    try {
      const requestBody: any = {
        count: 1, // Get 1 question
      };

      // Only include difficulty and topic if they are defined
      if (difficulty) {
        requestBody.difficulty = difficulty;
      }
      if (topic) {
        requestBody.topic = topic;
      }

      const response = await fetch(`${this.QUESTION_SERVICE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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