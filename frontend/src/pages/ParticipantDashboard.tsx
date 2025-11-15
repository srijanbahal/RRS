// File: src/pages/ParticipantDashboard.tsx
import React, { useState, useEffect } from 'react'; // 1. Import hooks
import { motion } from 'framer-motion';
import { BarChart, Sliders, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateRoomModal } from '@/components/dashboard/CreateRoomModal';
import { api } from '@/lib/api'; // 2. Import your api lib

// 3. Define types for our new data (based on backend)
// We can build these out more later
type TeamData = {
  name: string;
  rank: number;
  wins: number;
  races: number;
  analytics: {
    overtakes: number;
    avgLapTime: number;
    winRate: number;
    pitStops: number;
  };
};

type AgentData = {
  id: string;
  name: string;
  provider: string;
  type: string;
  personality: string;
  status: string; // Note: 'status' isn't in your DB, you may need to add it
};

type RoomData = {
  id: string;
  name: string;
  circuit_name: string;
  status: 'Waiting' | 'In-Progress' | 'OPEN' | 'FULL'; // Map DB status
  current_players: number;
  max_players: number;
};

// --- Main Page Component ---
export default function ParticipantDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4. Create state for our live data
  const [team, setTeam] = useState<TeamData | null>(null);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all required data in parallel
        const [teamRes, agentsRes, roomsRes] = await Promise.allSettled([
          api.teams.getMyTeam(),
          api.agents.getMyAgents(),
          api.rooms.list(),
        ]);

        // Handle Team data
        if (teamRes.status === 'fulfilled' && teamRes.value.team) {
          setTeam(teamRes.value.team);
        } else {
          throw new Error('Failed to fetch team data.');
        }

        // Handle Agents data
        if (agentsRes.status === 'fulfilled') {
          // Add a fake 'status' for the UI
          const agentsWithStatus = agentsRes.value.agents.map((agent: any) => ({
            ...agent,
            status: 'online', // Your DB doesn't have this, so we mock it
          }));
          setAgents(agentsWithStatus);
        } else {
          throw new Error('Failed to fetch agents.');
        }

        // Handle Rooms data
        if (roomsRes.status === 'fulfilled') {
          // Map DB status 'OPEN' to 'Waiting' for the UI
          const mappedRooms = roomsRes.value.rooms.map((room: any) => ({
            ...room,
            status: room.status === 'OPEN' ? 'Waiting' : 'In-Progress',
          }));
          setRooms(mappedRooms);
        } else {
          throw new Error('Failed to fetch rooms.');
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 6. Handle Loading State
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
      </div>
    );
  }

  // 7. Handle Error State
  if (error || !team) {
    return (
      <div className="p-8">
        <Panel className="border-destructive/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive-foreground">
              Error Loading Dashboard
            </h3>
          </div>
          <p className="mt-2 text-white/70">{error || 'Team data could not be loaded.'}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </Panel>
      </div>
    );
  }

  // 8. Render dashboard with LIVE data
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 md:p-8 space-y-6"
      >
        <ParticipantHeader 
          team={team} 
          onOpenModal={() => setIsModalOpen(true)} 
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <RoomsGrid rooms={rooms} />
            <StatsWidgets analytics={team.analytics} />
            <DummyFeatureCards />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <TeamOverviewWidget team={team} />
            <AgentListWidget agents={agents} />
          </div>
        </div>
      </motion.div>
      
      <CreateRoomModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

// --- Header ---
const ParticipantHeader = ({ team, onOpenModal }: { 
  team: TeamData, 
  onOpenModal: () => void 
}) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-white/10 p-2" />
      <div>
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-white/60">Welcome to your Team Command HQ</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" className="h-11 px-5 rounded-2xl">
        Join Room
      </Button>
      <Button 
        onClick={onOpenModal}
        className="relative h-11 px-5 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20 overflow-hidden hover:brightness-110">
        <span className="absolute inset-0 w-full h-full bg-white/20 animate-[shine_4s_ease-in-out_infinite]" style={{ animationName: 'shine' }} />
        Create Room
      </Button>
    </div>
  </div>
);

// --- Panel ---
const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 ${className}`}
  >
    {children}
  </motion.div>
);

// --- Rooms Grid ---
const RoomsGrid = ({ rooms }: { rooms: RoomData[] }) => (
  <Panel>
    <h3 className="text-xl font-semibold mb-4">Active Rooms</h3>
    <div className="grid md:grid-cols-3 gap-4">
      {rooms.length === 0 && (
        <p className="text-sm text-white/60 md:col-span-3">No active rooms found.</p>
      )}
      {rooms.map(room => (
        <div key={room.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="font-medium">{room.name}</div>
          <div className="text-sm text-white/60">{room.circuit_name}</div>
          <div className="mt-2 flex justify-between items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${room.status === 'Waiting' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {room.status}
            </span>
            <span className="text-sm">{room.current_players}/{room.max_players}</span>
          </div>
        </div>
      ))}
    </div>
  </Panel>
);

// --- Team Overview ---
const TeamOverviewWidget = ({ team }: { team: TeamData }) => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span>Rank</span> <span className="font-medium text-white/80">#{team.rank}</span></div>
      <div className="flex justify-between"><span>Wins</span> <span className="font-medium text-white/80">{team.wins}</span></div>
      <div className="flex justify-between"><span>Races</span> <span className="font-medium text-white/80">{team.races}</span></div>
    </div>
  </Panel>
);

// --- Agent List ---
const AgentListWidget = ({ agents }: { agents: AgentData[] }) => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Your Agents</h3>
    <div className="space-y-3">
      {agents.length === 0 && (
        <p className="text-sm text-white/60">You haven't created any agents yet.</p>
      )}
      {agents.slice(0, 3).map(agent => (
        <div key={agent.id} className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${agent.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          <div>
            <div className="text-sm font-medium">{agent.name}</div>
            <div className="text-xs text-white/60">{agent.provider || agent.type} - {agent.personality}</div>
          </div>
        </div>
      ))}
    </div>
  </Panel>
);

// --- Stats ---
const StatsWidgets = ({ analytics }: { analytics: TeamData['analytics'] }) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Panel className="text-center">
      <div className="text-3xl font-bold text-sky-300">{analytics.overtakes}</div>
      <div className="text-sm text-white/60">Overtakes</div>
    </Panel>
    <Panel className="text-center">
      <div className="text-3xl font-bold text-sky-300">{analytics.avgLapTime}s</div>
      <div className="text-sm text-white/60">Avg. Lap</div>
    </Panel>
    <Panel className="text-center">
      <div className="text-3xl font-bold text-sky-300">{analytics.winRate}%</div>
      <div className="text-sm text-white/60">Win Rate</div>
    </Panel>
    <Panel className="text-center">
      <div className="text-3xl font-bold text-sky-300">{analytics.pitStops}</div>
      <div className="text-sm text-white/60">Pit Stops</div>
    </Panel>
  </div>
);

// --- Dummy Features (no change) ---
const DummyFeatureCards = () => (
  <Panel>
    <h3 className="text-xl font-semibold mb-4">AI Lab (Dummy Features)</h3>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <Sliders className="h-5 w-5 text-sky-300 mb-2" />
        <h4 className="font-medium">Personality Editor</h4>
        <p className="text-sm text-white/60">Tweak aggression & strategy sliders.</p>
      </div>
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <BarChart className="h-5 w-5 text-sky-300 mb-2" />
        <h4 className="font-medium">Telemetry Analysis</h4>
        <p className="text-sm text-white/60">Review post-race performance data.</p>
      </div>
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <ShieldCheck className="h-5 w-5 text-sky-300 mb-2" />
        <h4 className="font-medium">Strategy Builder</h4>
        <p className="text-sm text-white/60">Set fuel & tire compound strategies.</p>
      </div>
    </div>
  </Panel>
);