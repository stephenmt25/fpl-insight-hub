import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WelcomeBannerProps {
  selectedLeague: string;
  updateSelectedLeague: (leagueName: string) => void;
}

export function WelcomeBanner({ selectedLeague, updateSelectedLeague }: WelcomeBannerProps) {
  const { isSignedIn, currentManager } = useAuth();

  const triggerSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-fpl-data');
      if (error) throw error;
      toast.success('FPL data sync triggered successfully');
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to sync FPL data');
    }
  };

  if (isSignedIn) {
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hello, {currentManager?.player_first_name}! Here's your FPL journey at a glance.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Track your progress and make informed decisions for your team.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={triggerSync} variant="outline" className="mb-2">
            Sync FPL Data
          </Button>
          <div className="flex items-center gap-2 w-full max-w-xs">
            <BarChart className="h-4 w-4" />
            <label className="text-sm font-medium">League Select</label>
          </div>
          <Select value={selectedLeague} onValueChange={updateSelectedLeague}>
            <SelectTrigger>
              <SelectValue placeholder="Select a league" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Overall">Overall</SelectItem>
              <SelectItem value="Second Chance">Second Chance</SelectItem>
              <SelectItem value="Gameweek 1">Gameweek 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Here's the FPL 2025 season at a glance.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Overall FPL data and statistics.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <div className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          <label className="text-sm font-medium">League Select</label>
        </div>
        <Select value={selectedLeague} onValueChange={updateSelectedLeague}>
          <SelectTrigger>
            <SelectValue placeholder="Select a league" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Overall">Overall</SelectItem>
            <SelectItem value="Second Chance">Second Chance</SelectItem>
            <SelectItem value="Gameweek 1">Gameweek 1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}