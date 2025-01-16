import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeagueSelectorProps {
  leagueId: string;
  updateSelectedLeague: (leagueId: string) => void;
}

interface ManagerLeague {
  id: string;
  name: string;
}

export function LeagueSelector({ leagueId, updateSelectedLeague }: LeagueSelectorProps) {
  const [leagues, setLeagues] = useState<ManagerLeague[]>([]);

  useEffect(() => {
    // Check localStorage for managerData
    const managerData = localStorage.getItem("managerData");

    if (managerData) {
      try {
        const parsedData = JSON.parse(managerData);
        // Assume leagues are stored under "classicLeagues"
        const classicLeagues = parsedData?.leagues?.classic || [];
        setLeagues(
          classicLeagues.map((league: { id: string; name: string }) => ({
            id: league.id,
            name: league.name,
          }))
        );
        
      } catch (error) {
        console.error("Error parsing managerData from localStorage:", error);
      }
    } else {
      let classicLeagues = [
        { id: "314", name: "Overall" },
        { id: "321", name: "Second Chance" },
        { id: "276", name: "Gameweek 1" },
      ];
      setLeagues(classicLeagues)
    }

  }, []);

  return (
      <Select
        value={leagueId}
        onValueChange={(value) => updateSelectedLeague(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a league" />
        </SelectTrigger>
        <SelectContent>
          {leagues.length > 0 ? (
            leagues.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no leagues" disabled>No leagues available</SelectItem>
          )}
        </SelectContent>
      </Select>
  );
}
