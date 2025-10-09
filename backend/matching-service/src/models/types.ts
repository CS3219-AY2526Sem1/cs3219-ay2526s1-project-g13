export enum DIFFICULTY {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
  }
  
  export enum USER_STATUS {
    IDLE = 'IDLE',
    IN_QUEUE = 'IN_QUEUE',
    IN_ROOM = 'IN_ROOM',
  }
  
  export enum QUESTION_TOPIC {
    ARRAYS = 'ARRAYS',
    STRINGS = 'STRINGS',
    TREES = 'TREES',
    GRAPHS = 'GRAPHS',
    DYNAMIC_PROGRAMMING = 'DYNAMIC_PROGRAMMING',
    SORTING = 'SORTING',
    SEARCHING = 'SEARCHING',
    MATH = 'MATH',
    HASH_TABLES = 'HASH_TABLES',
    LINKED_LISTS = 'LINKED_LISTS',
  }
  
  export interface User {
    socketId: string;
    status: USER_STATUS;
    difficulty?: DIFFICULTY;
    topic?: QUESTION_TOPIC;
    joinedAt?: number;
  }
  
  export interface MatchRequest {
    difficulty: DIFFICULTY;
    topic: QUESTION_TOPIC;
  }
  
  export interface MatchResult {
    roomId: string;
    questions: any[];
    user1: string;
    user2: string;
  }