import React from 'react';

const RaceCard: React.FC<{ race: any }> = ({ race }) => {
  return (
    <div className="rounded-lg border border-white/8 bg-white/3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{race.name || `Race ${race.id.slice(0,6)}`}</div>
          <div className="text-xs text-white/60">Circuit: {race.circuit?.name || 'Unknown'} • Lap {race.currentLap}/{race.maxLaps}</div>
        </div>
        <div className="text-sm text-white/60">{race.status}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.values(race.cars || {}).slice(0,4).map((c:any) => (
          <div key={c.id} className="rounded-md bg-white/2 p-2 text-xs">{c.agentName || c.id.slice(0,6)} — {c.team || '—'}</div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <a href={`/race/${race.id}`} className="text-sm underline">Spectate</a>
        <div className="text-xs text-white/60">Live</div>
      </div>
    </div>
  );
};

export default RaceCard;