// File: src/pages/dashboard/RoomsPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import { MOCK_ROOMS_LIST } from '@/lib/mockData';
import { Search, ChevronRight } from 'lucide-react';
import { motion } from "framer-motion";


export default function RoomsPage() {
  return (
    <PageWrapper>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Race Lobby</h1>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search rooms..." 
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10
                       placeholder-white/40 outline-none focus:border-white/30" 
          />
        </div>
      </div>
      
      {/* Room List */}
      <Panel className="p-0">
        <div className="space-y-0">
          {MOCK_ROOMS_LIST.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex justify-between items-center p-4 border-b border-white/10 last:border-b-0
                         hover:bg-white/5 transition-colors"
            >
              <div>
                <h3 className="font-medium">{room.name}</h3>
                <p className="text-sm text-white/60">{room.circuitName} Circuit</p>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-sm font-medium ${room.status === 'Waiting' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {room.status}
                </span>
                <span className="text-sm text-white/80">{room.currentPlayers}/{room.maxPlayers} Players</span>
                <button className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </PageWrapper>
  );
}