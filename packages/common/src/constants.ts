export const EVENTS = {
  GAME: {
    STATUS: "game:status",
    SUCCESS_JOIN: "game:successJoin",
    TOTAL_PLAYERS: "game:totalPlayers",
    ERROR_MESSAGE: "game:errorMessage",
    START_COOLDOWN: "game:startCooldown",
    COOLDOWN: "game:cooldown",
    RESET: "game:reset",
    UPDATE_QUESTION: "game:updateQuestion",
    PLAYER_ANSWER: "game:playerAnswer",
  },
  PLAYER: {
    SUCCESS_RECONNECT: "player:successReconnect",
    UPDATE_LEADERBOARD: "player:updateLeaderboard",
    LOGIN: "player:login",
    RECONNECT: "player:reconnect",
    LEAVE: "player:leave",
    SELECTED_ANSWER: "player:selectedAnswer",
  },
  MANAGER: {
    SUCCESS_RECONNECT: "manager:successReconnect",
    STATUS_UPDATE: "manager:statusUpdate",
    NEW_PLAYER: "manager:newPlayer",
    REMOVE_PLAYER: "manager:removePlayer",
    PLAYER_KICKED: "manager:playerKicked",
    RECONNECT: "manager:reconnect",
    LEAVE: "manager:leave",
    KICK_PLAYER: "manager:kickPlayer",
    START_GAME: "manager:startGame",
    ABORT_QUIZ: "manager:abortQuiz",
    NEXT_QUESTION: "manager:nextQuestion",
    SHOW_LEADERBOARD: "manager:showLeaderboard",
  },
} as const

export const SESSION_ROLES = {
  PLAYER: "player",
  MANAGER: "manager",
} as const

export const NO_TIME_LIMIT = -1

export const MAX_POINTS = 1000

export const QUESTION_TYPES = {
  SINGLE: "single",
  MULTI: "multi",
} as const

export const SCORING_MODES = {
  STRICT: "strict",
  BALANCED: "balanced",
  LENIENT: "lenient",
} as const

export const MEDIA_TYPES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
} as const

export const EXAMPLE_QUIZZ = {
  subject: "Example Quizz",
  questions: [
    {
      question: "What is good answer ?",
      answers: ["No", "Good answer", "No", "No"],
      solutions: [1],
      cooldown: 5,
      time: 15,
    },
    {
      question: "What is good answer with image ?",
      answers: ["No", "No", "No", "Good answer"],
      media: {
        type: MEDIA_TYPES.IMAGE,
        url: "https://placehold.co/600x400.png",
      },
      solutions: [3],
      cooldown: 5,
      time: 20,
    },
    {
      question: "What is good answer with two answers ?",
      answers: ["Good answer", "No"],
      media: {
        type: MEDIA_TYPES.IMAGE,
        url: "https://placehold.co/600x400.png",
      },
      solutions: [0],
      cooldown: 5,
      time: 20,
    },
    {
      question: "Which of these are primary colors ?",
      answers: ["Red", "Green", "Blue", "Yellow"],
      solutions: [0, 2, 3],
      cooldown: 5,
      time: 20,
    },
  ],
} as const
