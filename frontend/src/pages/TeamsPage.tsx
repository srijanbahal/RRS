// File: src/pages/dashboard/TeamsPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import { MOCK_LEADERBOARD, MOCK_TEAM_MAIN } from '@/lib/mockData';
import { Search } from 'lucide-react';

export default function TeamsPage() {
  const otherTeams = MOCK_LEADERBOARD.filter(t => t.team.id !== MOCK_TEAM_MAIN.id);

  return (
    <PageWrapper>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teams</h1>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search teams..." 
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10
                       placeholder-white/40 outline-none focus:border-white/30" 
          />
        </div>
      </div>

      {/* Your Team Panel */}
      <Panel delay={0.1} className="bg-gradient-to-r from-sky-500/10 to-fuchsia-500/10 border-sky-400/30">
        <h3 className="text-xl font-semibold mb-3">Your Team</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10 p-2">
            {/* <img src={MOCK_TEAM_MAIN.logoUrl} alt="Team Logo" /> */}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{MOCK_TEAM_MAIN.name}</h2>
            <p className="text-white/60">Rank: #{MOCK_TEAM_MAIN.rank} • {MOCK_TEAM_MAIN.wins} Wins</p>
          </div>
        </div>
      </Panel>

      {/* Other Teams Grid */}
      <h2 className="text-2xl font-semibold pt-4">All Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherTeams.map((entry, i) => (
          <Panel key={entry.team.id} delay={0.2 + i * 0.05} className="hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div>
                <h4 className="text-lg font-semibold">{entry.team.name}</h4>
                <p className="text-sm text-white/60">Rank: #{entry.rank} • {entry.points} PTS</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </PageWrapper>
  );
}