import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamFixtures {
  teamId: number;
  teamName: string;
  fixtures: {
    opponent: string;
    difficulty: number;
    isHome: boolean;
    gameweek: number;
  }[];
}

export function FixtureDifficulty() {
  const { data: teams } = useTeamsContext();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['upcomingFixtures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upcoming_fixtures_enriched')
        .select('*')
        .order('gameweek', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-green-50 text-green-600";
      case 3: return "bg-gray-100 text-gray-800";
      case 4: return "bg-red-50 text-red-600";
      case 5: return "bg-red-100 text-red-800";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  if (isLoading || !teams) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Fixture Difficulty Ratings</h2>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Fixture Difficulty Ratings</h2>
        <p className="text-muted-foreground">No upcoming fixture data available.</p>
      </div>
    );
  }

  // Get unique gameweeks (next 5)
  const gameweeks = [...new Set(fixtures.map(f => f.gameweek))].sort((a, b) => a - b).slice(0, 5);

  // Build per-team fixture data
  const teamFixtureMap = new Map<number, TeamFixtures>();

  for (const team of teams) {
    teamFixtureMap.set(team.id, {
      teamId: team.id,
      teamName: team.short_name || team.name,
      fixtures: [],
    });
  }

  for (const fixture of fixtures) {
    if (!gameweeks.includes(fixture.gameweek)) continue;

    // Home team entry
    const homeTeam = teamFixtureMap.get(fixture.home_team_id);
    if (homeTeam) {
      const opponent = teams.find(t => t.id === fixture.away_team_id);
      homeTeam.fixtures.push({
        opponent: opponent?.short_name || '?',
        difficulty: fixture.home_difficulty || 3,
        isHome: true,
        gameweek: fixture.gameweek,
      });
    }

    // Away team entry
    const awayTeam = teamFixtureMap.get(fixture.away_team_id);
    if (awayTeam) {
      const opponent = teams.find(t => t.id === fixture.home_team_id);
      awayTeam.fixtures.push({
        opponent: opponent?.short_name || '?',
        difficulty: fixture.away_difficulty || 3,
        isHome: false,
        gameweek: fixture.gameweek,
      });
    }
  }

  const teamFixtures = Array.from(teamFixtureMap.values())
    .filter(t => t.fixtures.length > 0)
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Fixture Difficulty Ratings</h2>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              {gameweeks.map((gw) => (
                <TableHead key={gw} className="text-center">
                  GW {gw}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamFixtures.map((team) => (
              <TableRow key={team.teamId}>
                <TableCell className="font-medium">{team.teamName}</TableCell>
                {gameweeks.map((gw) => {
                  const fixture = team.fixtures.find(f => f.gameweek === gw);
                  if (!fixture) {
                    return <TableCell key={gw} className="text-center text-muted-foreground">-</TableCell>;
                  }
                  return (
                    <TableCell
                      key={gw}
                      className={`text-center ${getDifficultyColor(fixture.difficulty)}`}
                    >
                      {fixture.opponent} ({fixture.isHome ? 'H' : 'A'})
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
