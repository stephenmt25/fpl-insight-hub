import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FixtureData {
  team: string;
  fixtures: {
    opponent: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
  }[];
}

const mockData: FixtureData[] = [
  {
    team: "Arsenal",
    fixtures: [
      { opponent: "MUN", difficulty: 4 },
      { opponent: "EVE", difficulty: 2 },
      { opponent: "BHA", difficulty: 3 },
      { opponent: "CRY", difficulty: 2 },
      { opponent: "MCI", difficulty: 5 },
    ],
  },
  {
    team: "Liverpool",
    fixtures: [
      { opponent: "NEW", difficulty: 3 },
      { opponent: "BOU", difficulty: 2 },
      { opponent: "AVL", difficulty: 3 },
      { opponent: "TOT", difficulty: 4 },
      { opponent: "BRE", difficulty: 2 },
    ],
  },
];

export function FixtureDifficulty() {
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-green-50 text-green-600";
      case 3:
        return "bg-gray-100 text-gray-800";
      case 4:
        return "bg-red-50 text-red-600";
      case 5:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Fixture Difficulty Ratings</h2>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              {[1, 2, 3, 4, 5].map((gw) => (
                <TableHead key={gw} className="text-center">
                  GW {gw}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((team) => (
              <TableRow key={team.team}>
                <TableCell className="font-medium">{team.team}</TableCell>
                {team.fixtures.map((fixture, index) => (
                  <TableCell
                    key={index}
                    className={`text-center ${getDifficultyColor(
                      fixture.difficulty
                    )}`}
                  >
                    {fixture.opponent}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}