export const ENDPOINTS = {
  player: {
    summary: (playerId: string) => `/element-summary/${playerId}/`,
    gameweekStats: (gameweek: string) => `/event/${gameweek}/live/`,
    dreamTeam: (gameweek: string) => `/dream-team/${gameweek}/`
  },
  manager: {
    overview: (managerId: string) => `/entry/${managerId}/`,
    history: (managerId: string) => `/entry/${managerId}/history/`,
    transfers: (managerId: string) => `/entry/${managerId}/transfers/`,
    myTeam: (managerId: string) => `/my-team/${managerId}/`,
    eventPicks: (managerId: string, eventId: string) => `/entry/${managerId}/event/${eventId}/picks/`,
    info: (managerId: string) => `/entry/${managerId}/`,
    leagues: (managerId: string) => `/entry/${managerId}/`,
    picks: (managerId: string) => `/entry/${managerId}/picks/`
  },
  league: {
    classicStandings: (leagueId: string) => `/leagues-classic/${leagueId}/standings/`,
    h2hStandings: (leagueId: string) => `/leagues-h2h/${leagueId}/standings/`,
    h2hMatches: (leagueId: string) => `/leagues-h2h-matches/league/${leagueId}/`,
    standings: (leagueId: string) => `/leagues-classic/${leagueId}/standings/`
  },
  overall: {
    info: () => `/bootstrap-static/`
  }
};