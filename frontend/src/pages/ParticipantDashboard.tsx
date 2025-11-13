// File: src/pages/dashboard/ParticipantDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_AGENTS_LIST, MOCK_ROOMS_LIST, MOCK_TEAM_MAIN, MOCK_ANALYTICS } from '@/lib/mockData';
import { ArrowRight, BarChart, Sliders, ShieldCheck } from 'lucide-react';

// --- Main Page Component ---
export default function ParticipantDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 space-y-6"
    >
      {/* 1. Header Zone */}
      <ParticipantHeader team={MOCK_TEAM_MAIN} />

      {/* 2. Main Layout Zones (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 2a. Main Content (Rooms & Stats) */}
        <div className="lg:col-span-3 space-y-6">
          <RoomsGrid rooms={MOCK_ROOMS_LIST} />
          <StatsWidgets analytics={MOCK_ANALYTICS} />
          <DummyFeatureCards />
        </div>

        {/* 2b. Right Sidebar (Team & Agents) */}
        <div className="lg:col-span-1 space-y-6">
          <TeamOverviewWidget team={MOCK_TEAM_MAIN} />
          <AgentListWidget agents={MOCK_AGENTS_LIST} />
        </div>

      </div>
    </motion.div>
  );
}

// --- Header Sub-Component ---
const ParticipantHeader = ({ team }: { team: typeof MOCK_TEAM_MAIN }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-white/10 p-2">
        {/* <img src={team.logoUrl} alt="Team Logo" /> */}
      </div>
      <div>
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-white/60">Welcome to your Team Command HQ</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-5 text-white/90 hover:bg-white/5">
        Join Room
      </button>
      {/* Holographic Shine Button */}
      <button 
        className="relative inline-flex h-11 items-center gap-2 rounded-2xl 
                   bg-gradient-to-r from-sky-500 to-violet-500 px-5 font-medium 
                   shadow-lg shadow-sky-500/20 overflow-hidden">
        <span className="absolute inset-0 w-full h-full bg-white/20 
                         animate-[shine_4s_ease-in-out_infinite]" 
              style={{ animationName: 'shine' }} />
        Create Room
      </button>
    </div>
  </div>
);

// Define shine animation in your global CSS (e.g., index.css)
/*
@keyframes shine {
  0% { transform: translateX(-100%) skewX(-15deg); }
  40% { transform: translateX(100%) skewX(-15deg); }
  100% { transform: translateX(100%) skewX(-15deg); }
}
*/

// --- Widget Sub-Components (Dummies) ---

// Base Panel component for consistent frosted glass style
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

const RoomsGrid = ({ rooms }: { rooms: typeof MOCK_ROOMS_LIST }) => (
  <Panel>
    <h3 className="text-xl font-semibold mb-4">Active Rooms</h3>
    <div className="grid md:grid-cols-3 gap-4">
      {rooms.map(room => (
        <div key={room.id} className="bg-white/5 border border-white/10 rounded-lg p-3
                                      hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="font-medium">{room.name}</div>
          <div className="text-sm text-white/60">{room.circuitName}</div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {room.status}
            </span>
            <span className="text-sm">{room.currentPlayers}/{room.maxPlayers}</span>
          </div>
        </div>
      ))}
    </div>
  </Panel>
);

const TeamOverviewWidget = ({ team }: { team: typeof MOCK_TEAM_MAIN }) => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span>Rank</span> <span className="font-medium text-white/80">#{team.rank}</span></div>
      <div className="flex justify-between"><span>Wins</span> <span className="font-medium text-white/80">{team.wins}</span></div>
      <div className="flex justify-between"><span>Races</span> <span className="font-medium text-white/80">{team.races}</span></div>
    </div>
  </Panel>
);

const AgentListWidget = ({ agents }: { agents: typeof MOCK_AGENTS_LIST }) => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Your Agents</h3>
    <div className="space-y-3">
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

const StatsWidgets = ({ analytics }: { analytics: typeof MOCK_ANALYTICS }) => (
  <div className="grid md:grid-cols-4 gap-4">
    {/* This is where you would put the counter animation */}
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