// File: src/lib/mockData.ts

// This is your dummy data for development

export type Agent = {
  id: string;
  name: string;
  type: string;
  provider?: string;
  personality?: string;
};

export type RaceSummary = {
  id: string;
  name?: string;
  status?: string;
  circuit?: { name?: string };
  currentLap?: number;
  maxLaps?: number;
  cars?: Record<string, any>;
};

export type Room = {
  id: string;
  name: string;
  circuitName: string;
  currentPlayers: number;
  maxPlayers: number;
};


export const MOCK_AGENTS: Agent[] = [
  { id: 'agent_1', name: 'Vertex AI (Demo)', type: 'LLM', provider: 'Gemini', personality: 'aggressive' },
  { id: 'agent_2', name: 'GPT-4 Turbo (Demo)', type: 'LLM', provider: 'OpenAI', personality: 'balanced' },
  { id: 'agent_3', name: 'Local Llama (Demo)', type: 'LLM', provider: 'Groq', personality: 'defensive' },
];

export const MOCK_RACES: RaceSummary[] = [
  { 
    id: 'race_1', 
    name: 'Monaco Mock Race', 
    status: 'ACTIVE', 
    circuit: { name: 'Monaco' }, 
    currentLap: 5, 
    maxLaps: 12,
    cars: {
      'car_1': { id: 'car_1', agentName: 'Vertex AI', team: 'Google' },
      'car_2': { id: 'car_2', agentName: 'GPT-4 Turbo', team: 'OpenAI' },
    }
  },
  { 
    id: 'race_2', 
    name: 'Silverstone Demo', 
    status: 'ACTIVE', 
    circuit: { name: 'Silverstone' }, 
    currentLap: 1, 
    maxLaps: 10,
    cars: {
      'car_3': { id: 'car_3', agentName: 'Local Llama', team: 'Meta' },
    }
  },
];

export const MOCK_ROOMS: Room[] = [
  { id: 'room_1', name: 'Beginner Lobby (Demo)', circuitName: 'Monza', currentPlayers: 3, maxPlayers: 6 },
  { id: 'room_2', name: 'Experts Only (Demo)', circuitName: 'Silverstone', currentPlayers: 5, maxPlayers: 6 },
  { id: 'room_3', name: 'EU Main (Demo)', circuitName: 'Monaco', currentPlayers: 2, maxPlayers: 4 },
];