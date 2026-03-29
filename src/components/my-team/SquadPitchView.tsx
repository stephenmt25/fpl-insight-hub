import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SquadPlayer } from "@/hooks/use-my-team-data";
import { AlertCircle } from "lucide-react";

interface SquadPitchViewProps {
  starting11: SquadPlayer[];
  bench: SquadPlayer[];
  formation: string;
  totalPoints: number;
  activeChip: string | null;
  automaticSubs: { element_in: number; element_out: number }[];
}

function PlayerCard({ player }: { player: SquadPlayer }) {
  const isInjured = player.status === 'i' || player.status === 'u' || player.status === 's';

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <div className={`relative rounded-lg px-2 py-1.5 text-center text-xs font-medium w-full ${
        player.isCaptain ? 'bg-yellow-400 text-black' :
        player.isViceCaptain ? 'bg-yellow-200 text-black' :
        player.isBench ? 'bg-gray-700 text-gray-300' :
        'bg-fpl-primary text-white'
      }`}>
        {player.isCaptain && <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">C</span>}
        {player.isViceCaptain && <span className="absolute -top-1.5 -right-1.5 bg-yellow-300 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">V</span>}
        {isInjured && <AlertCircle className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 text-red-500" />}
        <div className="truncate">{player.webName}</div>
      </div>
      <div className="text-xs text-muted-foreground">{player.teamShortName}</div>
      <div className={`text-sm font-bold ${
        player.points >= 8 ? 'text-green-500' :
        player.points >= 4 ? 'text-white' :
        player.points > 0 ? 'text-orange-400' :
        'text-gray-500'
      }`}>
        {player.points * player.multiplier}
        {player.multiplier > 1 && <span className="text-[10px] ml-0.5">({player.points}x{player.multiplier})</span>}
      </div>
    </div>
  );
}

function PitchRow({ players, label }: { players: SquadPlayer[]; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

export function SquadPitchView({ starting11, bench, formation, totalPoints, activeChip, automaticSubs }: SquadPitchViewProps) {
  const gk = starting11.filter(p => p.elementType === 1);
  const def = starting11.filter(p => p.elementType === 2);
  const mid = starting11.filter(p => p.elementType === 3);
  const fwd = starting11.filter(p => p.elementType === 4);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Squad</CardTitle>
          <div className="flex items-center gap-2">
            {activeChip && <Badge variant="secondary">{activeChip.toUpperCase()}</Badge>}
            <Badge variant="outline">{formation}</Badge>
            <span className="text-xl font-bold">{totalPoints} pts</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Pitch */}
        <div className="bg-gradient-to-b from-green-900 via-green-800 to-green-900 rounded-xl p-4 space-y-4">
          <PitchRow players={fwd} label="FWD" />
          <PitchRow players={mid} label="MID" />
          <PitchRow players={def} label="DEF" />
          <PitchRow players={gk} label="GK" />
        </div>

        {/* Bench */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">BENCH</span>
            {automaticSubs.length > 0 && (
              <span className="text-xs text-yellow-500">{automaticSubs.length} auto-sub{automaticSubs.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex justify-center gap-3">
            {bench.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
