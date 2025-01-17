export const ENDPOINTS = {
  manager: {
    info: (managerId: string) => `/entry/${managerId}/`,
    history: (managerId: string) => `/entry/${managerId}/history/`,
    leagues: (managerId: string) => `/entry/${managerId}/leagues/`,
    transfers: (managerId: string) => `/entry/${managerId}/transfers/`,
    picks: (managerId: string, gameweek: string) => `/entry/${managerId}/event/${gameweek}/picks/`
  },
  league: {
    standings: (leagueId: string, pageNumber: string) => `/leagues-classic/${leagueId}/standings/?page_standings=${pageNumber}`
  },
  player: {
    summary: (playerId: string) => `/element-summary/${playerId}/`,
    gameweekStats: (gameweek: string) => `/event/${gameweek}/live/`
  },
  overall: {
    info: () => '/bootstrap-static/'
  }
};