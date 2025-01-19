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
    eventPicks: (managerId: string, eventId: string) => `/entry/${managerId}/event/${eventId}/picks/`
  },
  league: {
    classicStandings: (leagueId: string) => `/leagues-classic/${leagueId}/standings/`,
    h2hStandings: (leagueId: string) => `/leagues-h2h/${leagueId}/standings/`,
    h2hMatches: (leagueId: string) => `/leagues-h2h-matches/league/${leagueId}/`
  },
  stats: {
    dreamTeam: () => `/dream-team/`,
    mostValuableTeams: () => `/stats/most-valuable-teams/`,
    bestClassicPrivateLeagues: () => `/stats/best-classic-private-leagues/`
  },
  event: {
    status: () => `/event-status/`
  },
  fixtures: {
    all: () => `/fixtures/`,
    byEvent: (eventId: string) => `/fixtures/?event=${eventId}`
  },
  playerData: {
    all: () => `/element-summary/`,
    byId: (playerId: string) => `/element-summary/${playerId}/`
  }
};
