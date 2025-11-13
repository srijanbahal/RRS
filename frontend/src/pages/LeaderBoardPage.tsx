// File: src/pages/dashboard/LeaderboardPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import { MOCK_LEADERBOARD, MOCK_TEAM_MAIN } from '@/lib/mockData';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const others = MOCK_LEADERBOARD.slice(3);
  
  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold">Global Leaderboard</h1>

      {/* Top 3 Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((entry, i) => (
          <Panel delay={i * 0.1} className={`text-center ${i === 0 ? 'border-sky-400' : ''}`}>
            <Trophy className={`h-8 w-8 mx-auto ${
              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-yellow-700'
            }`} />
            <h3 className="text-2xl font-bold mt-2">#{entry.rank}</h3>
            <p className="text-lg font-semibold">{entry.team.name}</p>
            <p className="text-sm text-white/60">{entry.points} PTS</p>
          </Panel>
        ))}
      </div>

      {/* Your Rank */}
      <Panel delay={0.3}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Your Rank</h3>
            <p className="text-white/80">{MOCK_TEAM_MAIN.name}</p>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-sky-300">#{MOCK_TEAM_MAIN.rank}</h3>
            <p className="text-sm text-white/60">{MOCK_LEADERBOARD.find(t => t.team.id === MOCK_TEAM_MAIN.id)?.points} PTS</p>
          </div>
        </div>
      </Panel>

      {/* Full Table */}
      <Panel delay={0.4} className="p-0">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 text-sm font-semibold text-white/60">Rank</th>
              <th className="p-4 text-sm font-semibold text-white/60">Team</th>
              <th className="p-4 text-sm font-semibold text-white/60">Wins</th>
              <th className="p-4 text-sm font-semibold text-white/60">Points</th>
            </tr>
          </thead>
          <tbody>
            {others.map(entry => (
              <tr key={entry.rank} className="border-b border-white/5 last:border-b-0">
                <td className="p-4 font-medium">#{entry.rank}</td>
                <td className="p-4 font-semibold">{entry.team.name}</td>
                <td className="p-4 text-white/80">{entry.team.wins}</td>
                <td className="p-4 font-bold text-sky-300">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </PageWrapper>
  );
}