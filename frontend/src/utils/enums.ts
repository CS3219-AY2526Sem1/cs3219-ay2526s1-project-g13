export enum Difficulty {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "Hard",
}

export enum ServiceType {
  MATCHING = "matching",
  COLLABORATION = "collaboration",
}

export enum ProgrammingLanguage {
  CPP = "cpp",
  JAVA = "java",
  JAVASCRIPT = "javascript",
  PYTHON = "python",
}

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
}

export enum WSCloseCode {
  AUTH_FAILED = 4000, // Invalid/missing token
  UNAUTHORIZED = 4001, // User not in room
  ROOM_NOT_FOUND = 4002, // Room doesn't exist
  ROOM_INACTIVE = 4003, // Room is closed
}
