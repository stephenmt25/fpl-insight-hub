import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Check, Clock, X } from "lucide-react";
import type { ChipDefinition, BootstrapEvent } from "@/types/bootstrap";
import type { ManagerHistory } from "@/types/fpl";

interface ChipPlannerProps {
  chips: ChipDefinition[];
  events: BootstrapEvent[];
  currentGameweek: number | null;
  managerHistory: ManagerHistory | null;
}

const CHIP_LABELS: Record<string, { label: string; description: string }> = {
  wildcard: { label: "Wildcard", description: "Unlimited free transfers for one gameweek" },
  freehit: { label: "Free Hit", description: "Temporary squad for one gameweek" },
  bboost: { label: "Bench Boost", description: "Bench players score points" },
  "3xc": { label: "Triple Captain", description: "Captain scores 3x points" },
};

export function ChipPlanner({ chips, events, currentGameweek, managerHistory }: ChipPlannerProps) {
  if (!currentGameweek || chips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Chip Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading chip data...</p>
        </CardContent>
      </Card>
    );
  }

  // Group chips by name (wildcard has 2 entries: first and second half)
  const chipMap = new Map<string, ChipDefinition[]>();
  for (const chip of chips) {
    const existing = chipMap.get(chip.name) || [];
    existing.push(chip);
    chipMap.set(chip.name, existing);
  }

  // Find which GWs had highest chip usage
  const chipPopularity = new Map<string, { gw: number; count: number }>();
  for (const event of events) {
    if (!event.chip_plays) continue;
    for (const play of event.chip_plays) {
      const current = chipPopularity.get(play.chip_name);
      if (!current || play.num_played > current.count) {
        chipPopularity.set(play.chip_name, { gw: event.id, count: play.num_played });
      }
    }
  }

  // Get current GW chip usage stats
  const currentEvent = events.find(e => e.id === currentGameweek);
  const currentChipPlays = currentEvent?.chip_plays || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Chip Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chip Status Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from(chipMap.entries()).map(([chipName, chipDefs]) => {
              const meta = CHIP_LABELS[chipName] || { label: chipName, description: '' };
              // Determine if chip is available in current half of season
              const availableChip = chipDefs.find(
                c => currentGameweek >= c.start_event && currentGameweek <= c.stop_event
              );
              const isAvailable = !!availableChip;
              const popularity = chipPopularity.get(chipName);
              const thisGWUsage = currentChipPlays.find(p => p.chip_name === chipName);

              return (
                <div
                  key={chipName}
                  className={`rounded-lg border p-3 space-y-2 ${
                    isAvailable ? 'border-green-500/30 bg-green-500/5' : 'border-gray-500/30 bg-gray-500/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{meta.label}</span>
                    {isAvailable ? (
                      <Badge variant="outline" className="text-green-500 border-green-500/50">
                        <Clock className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <X className="h-3 w-3 mr-1" />
                        Used/Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {availableChip && (
                      <span>GW{availableChip.start_event}–{availableChip.stop_event}</span>
                    )}
                    {thisGWUsage && (
                      <span>{(thisGWUsage.num_played / 1000).toFixed(0)}k used this GW</span>
                    )}
                  </div>
                  {popularity && (
                    <div className="text-xs text-muted-foreground">
                      Most popular: GW{popularity.gw} ({(popularity.count / 1000).toFixed(0)}k managers)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* This GW chip usage summary */}
          {currentChipPlays.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">GW{currentGameweek} Chip Usage</p>
              <div className="flex flex-wrap gap-2">
                {currentChipPlays.map(play => (
                  <Badge key={play.chip_name} variant="secondary" className="text-xs">
                    {CHIP_LABELS[play.chip_name]?.label || play.chip_name}: {(play.num_played / 1000).toFixed(0)}k
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
