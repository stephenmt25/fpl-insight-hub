export const ENDPOINTS = {
  manager: {
    info: (managerId: number) => `/entry/${managerId}/`,
    history: (managerId: number) => `/entry/${managerId}/history/`,
    leagues: (managerId: number) => `/entry/${managerId}/leagues/`
  },
  league: {
    standings: (leagueId: number) => `/leagues-classic/${leagueId}/standings/`
  },
  overall: {
    info: () => '/bootstrap-static/'
  }
};