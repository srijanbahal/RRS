// File: src/pages/dashboard/SettingsPage.tsx
import React from 'react';
import PageWrapper from '@/components/ui/PageWrapper';
import Panel from '@/components/ui/Panel';
import { MOCK_TEAM_MAIN } from '@/lib/mockData';
import { User, Sun, Moon, ShieldAlert } from 'lucide-react';

// A simple reusable input for the form
const SettingsInput = ({ label, value, type = 'text' }: { label: string, value: string, type?: string }) => (
  <div>
    <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
    <input 
      type={type}
      defaultValue={value}
      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10
                 placeholder-white/40 outline-none focus:border-white/30"
    />
  </div>
);

export default function SettingsPage() {
  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Profile & Appearance */}
        <div className="md:col-span-2 space-y-6">
          <Panel>
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-sky-300" />
              <h3 className="text-xl font-semibold">Profile</h3>
            </div>
            <div className="space-y-4">
              <SettingsInput label="Team Name" value={MOCK_TEAM_MAIN.name} />
              <SettingsInput label="Email Address" value="team-lead@example.com" />
              <button className="h-10 px-5 rounded-lg bg-sky-500 font-medium hover:bg-sky-400">
                Save Changes
              </button>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-xl font-semibold mb-4">Appearance</h3>
            <div className="flex gap-4">
              <button className="flex-1 p-4 rounded-lg bg-white/10 border border-white/20 text-center">
                <Sun className="h-5 w-5 mx-auto mb-1" /> Light
              </button>
              <button className="flex-1 p-4 rounded-lg bg-white/5 border border-white/10 text-center text-white/60">
                <Moon className="h-5 w-5 mx-auto mb-1" /> Dark
              </button>
            </div>
          </Panel>
        </div>

        {/* Column 2: Account */}
        <div className="md:col-span-1">
          <Panel className="border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <h3 className="text-xl font-semibold">Account</h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Manage your account and team settings.
            </p>
            <div className="flex flex-col gap-3">
              <button className="h-10 w-full px-4 rounded-lg bg-white/10 font-medium hover:bg-white/20">
                Sign Out
              </button>
              <button className="h-10 w-full px-4 rounded-lg bg-red-500/20 text-red-300 font-medium hover:bg-red-500/30">
                Delete Team
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </PageWrapper>
  );
}