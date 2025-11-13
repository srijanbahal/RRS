// File: src/lib/mockData.ts
// We are expanding this file to power the entire dummy-data dashboard.

// --- TYPES ---
export type Agent = {
  id: string;
  name: string;
  type: 'LLM' | 'RL';
  provider?: string;
  personality: 'aggressive' | 'balanced' | 'defensive';
  status: 'online' | 'offline' | 'training';
};

export type RaceSummary = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'UPCOMING' | 'FINISHED';
  circuit: { name: string; thumbnail: string };
  currentLap?: number;
  maxLaps: number;
  cars: Record<string, { id: string; agentName: string; team: string }>;
};

export type Room = {
  id: string;
  name: string;
  circuitName: string;
  currentPlayers: number;
  maxPlayers: number;
  status: 'Waiting' | 'In-Progress';
};

export type Team = {
  id: string;
  name: string;
  logoUrl: string; // URL to a simple logo
  rank: number;
  wins: number;
  races: number;
};

export type LeaderboardEntry = {
  rank: number;
  team: Team;
  points: number;
};

export type AnalyticsData = {
  overtakes: number;
  avgLapTime: number; // in seconds
  pitStops: number;
  winRate: number; // percentage
};

export type NewsTickerItem = {
  id: string;
  message: string;
  priority: 'high' | 'low';
};

// --- MOCK DATA ---

export const MOCK_TEAM_MAIN: Team = {
  id: 'team_01',
  name: 'Aperture Racing',
  logoUrl: '/logo-placeholder.svg', // You can create a simple SVG for this
  rank: 12,
  wins: 2,
  races: 12,
};

export const MOCK_AGENTS_LIST: Agent[] = [
  { id: 'agent_1', name: 'Vertex G-2A', type: 'LLM', provider: 'Gemini', personality: 'aggressive', status: 'online' },
  { id: 'agent_2', name: 'GPT-4o "Turbo"', type: 'LLM', provider: 'OpenAI', personality: 'balanced', status: 'online' },
  { id: 'agent_3', name: 'RL-Policy "Viper"', type: 'RL', personality: 'defensive', status: 'training' },
  { id: 'agent_4', name: 'Groq "Flash"', type: 'LLM', provider: 'Groq', personality: 'balanced', status: 'offline' },
];

export const MOCK_ROOMS_LIST: Room[] = [
  { id: 'room_1', name: 'Monaco GP - Pro Lobby', circuitName: 'Monaco', currentPlayers: 5, maxPlayers: 6, status: 'Waiting' },
  { id: 'room_2', name: 'Silverstone Sprints', circuitName: 'Silverstone', currentPlayers: 6, maxPlayers: 6, status: 'In-Progress' },
  { id: 'room_3', name: 'Monza Beginners', circuitName: 'Monza', currentPlayers: 2, maxPlayers: 4, status: 'Waiting' },
];

export const MOCK_ANALYTICS: AnalyticsData = {
  overtakes: 34,
  avgLapTime: 92.4,
  pitStops: 8,
  winRate: 16.7,
};

export const MOCK_RACE_ARCHIVE: RaceSummary[] = [
  // ... (Can be same as MOCK_RACES_LIST, but with status 'FINISHED')
];

export const MOCK_RACES_LIST: RaceSummary[] = [
  { 
    id: 'race_1', 
    name: 'Monaco Grand Prix', 
    status: 'ACTIVE', 
    circuit: { name: 'Monaco', thumbnail: '/circuits/monaco.jpg' }, 
    currentLap: 5, 
    maxLaps: 12,
    cars: {
      'car_1': { id: 'car_1', agentName: 'Vertex G-2A', team: 'Aperture Racing' },
      'car_2': { id: 'car_2', agentName: 'GPT-4o "Turbo"', team: 'OpenAI' },
    }
  },
  { 
    id: 'race_2', 
    name: 'Silverstone Showdown', 
    status: 'UPCOMING', 
    circuit: { name: 'Silverstone', thumbnail: '/circuits/silverstone.jpg' }, 
    maxLaps: 10,
    cars: {}
  },
  { 
    id: 'race_3', 
    name: 'Monza Endurance', 
    status: 'UPCOMING', 
    circuit: { name: 'Monza', thumbnail: '/circuits/monza.jpg' }, 
    maxLaps: 15,
    cars: {}
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, team: { id: 'team_02', name: 'OpenAI Dynamics', logoUrl: '', rank: 1, wins: 10, races: 15 }, points: 302 },
  { rank: 2, team: { id: 'team_03', name: 'Google DeepMind', logoUrl: '', rank: 2, wins: 8, races: 14 }, points: 280 },
  { rank: 12, team: MOCK_TEAM_MAIN, points: 78 },
];

export const MOCK_NEWS_TICKER: NewsTickerItem[] = [
  { id: 'n1', message: 'AGENT "Viper" (RL-Policy) HAS ENTERED TRAINING MODE.', priority: 'low' },
  { id: 'n2', message: 'NEW CIRCUIT "SUZUKA" ADDED TO PRO LOBBIES.', priority: 'high' },
  { id: 'n3', message: 'TEAM "OpenAI Dynamics" WINS MONZA ENDURANCE.', priority: 'low' },
];