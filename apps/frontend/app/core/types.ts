export type Credentials = {
  username: string;
  password: string;
};

export type User = {
  id: string;
  username: string;
  role: Role;
  rounds: PlayerRound[];
};

export type Permission = {
  id: string;
  entity: string;
  action: "create" | "read" | "delete" | "update";
  roles: Role[];
};

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  users: Array<User>;
};

export type Round = {
  id: string;
  name: string;
  hp: number;
  touchedHp: number;
  startedAt: string;
  endedAt: string;
  participants: PlayerRound[];
  winner: User;
};

export type PlayerRound = {
  id: number;
  player: User;
  round: Round;
  clicksCount: number;
};

export type HitInfo = {
  totalClicks: number;
  playerScore: number;
  flushed: boolean;
  leaderboard: Array<{ playerId: string; score: number }>;
};

export type RoundListResponse = {
  items: Array<Round>;
  total: number;
};
