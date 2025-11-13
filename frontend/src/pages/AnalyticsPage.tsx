// File: src/pages/dashboard/AnalyticsPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import ComingSoon from '@/components/ui/ComingSoon';
import { BarChart, LineChart, Target } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <PageWrapper>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Race Analytics</h1>
        <select className="w-full max-w-xs rounded-lg bg-white/5 p-3 outline-none border border-white/10">
          <option>Select a Past Race...</option>
          <option>Monaco GP (Replay)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: Lap Time Chart */}
        <Panel className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <LineChart className="h-5 w-5 text-sky-300" />
            <h3 className="text-xl font-semibold">Lap Time Progression</h3>
          </div>
          <ComingSoon 
            title="Telemetry Graph"
            desc="Full lap-by-lap telemetry data will be available here."
          />
        </Panel>

        {/* Panel 2: Overtake Zones */}
        <Panel className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-5 w-5 text-emerald-300" />
            <h3 className="text-xl font-semibold">Overtake Zones</h3>
          </div>
          <ComingSoon 
            title="Circuit Heatmap"
            desc="Overtake and incident heatmaps are coming soon."
            icon="eye"
          />
        </Panel>

        {/* Panel 3: Performance Breakdown */}
        <Panel className="md:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="h-5 w-5 text-fuchsia-300" />
            <h3 className="text-xl font-semibold">Agent Performance</h3>
          </div>
          <ComingSoon 
            title="Data Not Available"
            desc="Agent vs. Agent performance breakdown is in development."
          />
        </Panel>
      </div>
    </PageWrapper>
  );
}