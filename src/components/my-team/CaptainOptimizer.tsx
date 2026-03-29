import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SquadPlayer } from "@/hooks/use-my-team-data";
import { Crown } from "lucide-react";

interface CaptainOptimizerProps {
  starting11: SquadPlayer[];
}

interface CaptainCandidate {
  player: SquadPlayer;
  score: number;
  reasons: string[];
}

function rankCaptains(players: SquadPlayer[]): CaptainCandidate[] {
  return players
    .map(player => {
      const reasons: string[] = [];
      let score = 0;

      // Expected points (biggest factor)
      score += player.epNext * 2;
      if (player.epNext >= 6) reasons.push(`High xPts (${player.epNext})`);

      // Form
      score += player.form * 1.5;
      if (player.form >= 7) reasons.push(`Excellent form (${player.form})`);
      else if (player.form >= 5) reasons.push(`Good form (${player.form})`);

      // Penalty on injury doubts
      if (player.chanceOfPlaying !== null && player.chanceOfPlaying < 100) {
        score *= (player.chanceOfPlaying / 100);
        reasons.push(`${player.chanceOfPlaying}% chance of playing`);
      }

      if (player.status !== 'a') {
        score *= 0.3;
        reasons.push('Not available');
      }

      return { player, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function CaptainOptimizer({ starting11 }: CaptainOptimizerProps) {
  const candidates = rankCaptains(starting11);
  const top5 = candidates.slice(0, 5);

  const chartData = top5.map(c => ({
    name: c.player.webName,
    score: c.score,
    epNext: c.player.epNext,
    form: c.player.form,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Captain Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded p-2 text-xs">
                        <div className="font-bold">{d.name}</div>
                        <div>Score: {d.score}</div>
                        <div>xPts: {d.epNext}</div>
                        <div>Form: {d.form}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="score" fill="#00ff87" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rankings */}
          <div className="space-y-2">
            {candidates.slice(0, 8).map((candidate, idx) => (
              <div
                key={candidate.player.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  idx === 1 ? 'bg-gray-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{candidate.player.webName}</div>
                    <div className="text-xs text-muted-foreground">
                      {candidate.player.teamShortName} · {candidate.player.position}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {candidate.reasons.slice(0, 1).map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{reason}</Badge>
                  ))}
                  <span className="font-bold text-sm w-10 text-right">{candidate.score}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
