// File: src/pages/dashboard/SpectatorDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_RACES_LIST, MOCK_NEWS_TICKER } from '@/lib/mockData';
import { PlayCircle, Search, Radio } from 'lucide-react';

// --- Main Page Component ---
export default function SpectatorDashboard() {
  const featuredRace = MOCK_RACES_LIST.find(r => r.status === 'ACTIVE') || MOCK_RACES_LIST[0];
  const upcomingRaces = MOCK_RACES_LIST.filter(r => r.status === 'UPCOMING');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-full" // Use min-h-full for ticker
    >
      <div className="p-6 md:p-8 space-y-6 pb-20"> {/* Add padding-bottom for ticker */}
        {/* 1. Header Zone */}
        <SpectatorHeader />

        {/* 2. Featured Race Banner */}
        <FeaturedRaceBanner race={featuredRace} />

        {/* 3. Main Layout Zones (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 3a. Main Content (Upcoming Races) */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-2xl font-semibold">Upcoming Races</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingRaces.map(race => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          </div>

          {/* 3b. Right Sidebar (Chat & Trending) */}
          <div className="lg:col-span-1 space-y-6">
            <TrendingTeamsWidget />
            <ChatPreviewWidget />
          </div>

        </div>
      </div>
      
      {/* 4. News Ticker (Bottom) */}
      <NewsTicker items={MOCK_NEWS_TICKER} />
    </motion.div>
  );
}

// --- Header Sub-Component ---
const SpectatorHeader = () => (
  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-2">
      {/* "Live" Button */}
      <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/10 text-white font-medium">
        <Radio className="h-4 w-4 text-red-500 animate-pulse" /> Live
      </button>
      <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-white/60 hover:bg-white/10">
        Upcoming
      </button>
      <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-white/60 hover:bg-white/10">
        Finished
      </button>
    </div>
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
      <input 
        type="text" 
        placeholder="Search races or teams..." 
        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10
                   placeholder-white/40 outline-none focus:border-white/30" 
      />
    </div>
  </div>
);

// --- Widget Sub-Components (Dummies) ---

// Base Panel (re-using from Participant)
const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const FeaturedRaceBanner = ({ race }: { race: typeof MOCK_RACES_LIST[0] }) => (
  <div className="relative rounded-2xl border border-white/10 p-6 md:p-8 
                  overflow-hidden bg-gray-900">
    {/* Fake BG Image */}
    <div 
      className="absolute inset-0 bg-cover bg-center opacity-30" 
      style={{ backgroundImage: `url(${race.circuit.thumbnail})` }} 
    />
    <div className="relative z-10">
      <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-sm font-medium">
        {race.status}
      </span>
      <h1 className="text-3xl font-bold mt-3">{race.name}</h1>
      <p className="text-white/70 max-w-lg">
        {race.circuit.name} Circuit • Lap {race.currentLap || 1}/{race.maxLaps}
      </p>
      <button className="inline-flex items-center gap-2 h-11 px-5 mt-5
                         bg-white text-black font-medium rounded-2xl
                         hover:scale-105 transition-transform">
        <PlayCircle className="h-5 w-5" /> Spectate Now
      </button>
    </div>
  </div>
);

// This is a simplified card for the spectator grid
const RaceCard = ({ race }: { race: typeof MOCK_RACES_LIST[0] }) => (
  <Panel className="p-0 overflow-hidden hover:border-white/30 transition-all">
    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${race.circuit.thumbnail})` }} />
    <div className="p-4">
      <div className="font-semibold">{race.name}</div>
      <div className="text-sm text-white/60">{race.circuit.name}</div>
    </div>
  </Panel>
);

const ChatPreviewWidget = () => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Community Chat</h3>
    <div className="space-y-3 text-sm">
      <p><span className="text-sky-300">@user123:</span> Wow, that overtake!</p>
      <p><span className="text-emerald-300">@racer_fan:</span> GO VIPER!!</p>
      <p><span className="text-white/60">@mod:</span> Please be respectful.</p>
      <p><span className="text-fuchsia-300">@team_gpt:</span> Let's go OpenAI!</p>
    </div>
  </Panel>
);

const TrendingTeamsWidget = () => (
  <Panel>
    <h3 className="text-lg font-semibold mb-4">Following</h3>
    {/* Dummy content */}
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <span className="text-sm font-medium">Aperture Racing</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <span className="text-sm font-medium">OpenAI Dynamics</span>
      </div>
    </div>
  </Panel>
);

const NewsTicker = ({ items }: { items: typeof MOCK_NEWS_TICKER }) => (
  <div className="absolute bottom-0 left-0 right-0 h-12 
                  bg-black/30 backdrop-blur-lg border-t border-white/10
                  flex items-center overflow-hidden">
    <motion.div
      className="flex items-center gap-12 whitespace-nowrap"
      initial={{ x: 0 }}
      animate={{ x: '-100%' }} // This will need to be dynamically calculated
      transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
    >
      {/* We duplicate the content to create a seamless loop */}
      {[...items, ...items].map((item, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className={`font-medium ${item.priority === 'high' ? 'text-red-400' : 'text-sky-300'}`}>
            {item.priority === 'high' ? 'ALERT' : 'UPDATE'}
          </span>
          <span className="text-white/70">{item.message}</span>
        </div>
      ))}
    </motion.div>
  </div>
);