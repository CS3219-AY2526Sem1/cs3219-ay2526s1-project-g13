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
  C = "c",
  CPP = "cpp",
  CSHARP = "csharp",
  GO = "go",
  JAVA = "java",
  JAVASCRIPT = "javascript",
  KOTLIN = "kotlin",
  PHP = "php",
  PYTHON = "python",
  RUBY = "ruby",
  RUST = "rust",
  SWIFT = "swift",
  TYPESCRIPT = "typescript",
}

export enum ProgrammingLanguageDisplay {
  C = "C",
  CPP = "C++",
  CSHARP = "C#",
  GO = "Go",
  JAVA = "Java",
  JAVASCRIPT = "JavaScript",
  KOTLIN = "Kotlin",
  PHP = "PHP",
  PYTHON = "Python",
  RUBY = "Ruby",
  RUST = "Rust",
  SCALA = "Scala",
  SWIFT = "Swift",
  TYPESCRIPT = "TypeScript",
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
