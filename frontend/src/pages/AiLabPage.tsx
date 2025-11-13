// File: src/pages/dashboard/AiLabPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import ComingSoon from '@/components/ui/ComingSoon';
import { MOCK_AGENTS_LIST } from '@/lib/mockData';
import { Sliders, TestTube } from 'lucide-react';

export default function AiLabPage() {
  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold">AI Lab</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Agent Personality Editor */}
        <Panel className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <Sliders className="h-5 w-5 text-sky-300" />
            <h3 className="text-xl font-semibold">Personality Matrix</h3>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Select an agent to tune their core personality traits.
          </p>
          <select className="w-full rounded-lg bg-white/5 p-3 outline-none border border-white/10 mb-4">
            {MOCK_AGENTS_LIST.map(agent => (
              <option key={agent.id}>{agent.name}</option>
            ))}
          </select>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Aggression</label>
              <input type="range" className="w-full" defaultValue="70" />
            </div>
            <div>
              <label className="text-sm font-medium">Defensive</label>
              <input type="range" className="w-full" defaultValue="40" />
            </div>
          </div>
        </Panel>
        
        {/* Panel 2: Backtesting Simulation */}
        <Panel className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="h-5 w-5 text-emerald-300" />
            <h3 className="text-xl font-semibold">Backtesting Sandbox</h3>
          </div>
          <ComingSoon 
            title="Simulation Engine"
            desc="Run your tuned agents in thousands of simulated races. This feature is in development."
          />
        </Panel>
      </div>
    </PageWrapper>
  );
}