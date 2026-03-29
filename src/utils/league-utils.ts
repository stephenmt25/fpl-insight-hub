const DEFAULT_LEAGUES: Record<string, string> = {
  "314": "Overall",
  "321": "Second Chance",
  "276": "Gameweek 1",
};

export function resolveLeagueName(leagueId: string): string {
  const managerData = localStorage.getItem("managerData");
  if (managerData) {
    try {
      const parsedData = JSON.parse(managerData);
      const classicLeagues = parsedData?.leagues?.classic || [];
      const league = classicLeagues.find(
        (league: { id: number | string; name: string }) =>
          String(league.id) === leagueId
      );
      if (league) return league.name;
    } catch {
      // Fall through to defaults
    }
  }
  return DEFAULT_LEAGUES[leagueId] || "Overall";
}
