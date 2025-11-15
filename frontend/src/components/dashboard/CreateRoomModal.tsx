// File: src/components/dashboard/CreateRoomModal.tsx
import React, { useState, useEffect } from 'react'; // 1. Import useEffect
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { AlertCircle, Loader2 } from 'lucide-react';

// Shadcn/UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

// 2. Define a type for the circuit data we will fetch
type Circuit = {
  id: string; // This will be the UUID from the DB
  name: string;
};

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const navigate = useNavigate();
  
  // Form State
  const [name, setName] = useState('');
  const [circuitId, setCircuitId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  
  // API State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. State for our fetched circuits
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [isCircuitLoading, setIsCircuitLoading] = useState(false);

  // 4. Fetch circuits when the modal opens
  useEffect(() => {
    if (open) {
      const fetchCircuits = async () => {
        setIsCircuitLoading(true);
        try {
          const res = await api.circuits.list();
          setCircuits(res.circuits || []);
        } catch (err) {
          console.error(err);
          setError("Failed to load circuits. Please try again.");
          setCircuits([]); // Clear on error
        } finally {
          setIsCircuitLoading(false);
        }
      };
      fetchCircuits();
    } else {
      // Reset form on close
      setName('');
      setCircuitId(null);
      setMaxPlayers(4);
      setIsPrivate(false);
      setError(null);
    }
  }, [open]); // This effect re-runs whenever the 'open' prop changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name) {
      setError('Please enter a room name.');
      return;
    }
    if (!circuitId) {
      setError('Please select a circuit.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name,
        circuit_id: circuitId, // This is now a real UUID!
        max_players: maxPlayers,
        is_private: isPrivate,
      };
      
      const response = await api.rooms.create(payload);
      
      if (response.room?.id) {
        // We can just close the modal. The dashboard will auto-update.
        onClose();
      } else {
        throw new Error('Room created, but no ID was returned.');
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
            <DialogDescription>
              Set up a new lobby and invite your agents to race.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="my-4 bg-destructive/10 border border-destructive/20 text-destructive-foreground p-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Monaco GP - Pro Lobby"
                className="col-span-3"
                disabled={isLoading}
              />
            </div>

            {/* 5. Updated Select component */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="circuit" className="text-right">
                Circuit
              </Label>
              <Select
                value={circuitId || ''}
                onValueChange={(value) => setCircuitId(value || null)}
                disabled={isLoading || isCircuitLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isCircuitLoading ? "Loading circuits..." : "Select a circuit"} />
                </SelectTrigger>
                <SelectContent>
                  {circuits.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {!isCircuitLoading && circuits.length === 0 && (
                    <SelectItem value="null" disabled>
                      No circuits found. (Did you run the seed script?)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="players" className="text-right">
                Players
              </Label>
              <div className="col-span-3 flex items-center gap-3">
                <Slider
                  id="players"
                  min={2}
                  max={6}
                  step={1}
                  value={[maxPlayers]}
                  onValueChange={(value) => setMaxPlayers(value[0])}
                  className="flex-1"
                  disabled={isLoading}
                />
                <span className="w-10 text-center font-medium">{maxPlayers}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="private" className="text-right">
                Private
              </Label>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading || isCircuitLoading}
              className="bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20 hover:brightness-110"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? 'Creating...' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}