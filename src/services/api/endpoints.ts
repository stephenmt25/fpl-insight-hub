export const ENDPOINTS = {
  manager: {
    info: (managerId: string) => `/entry/${managerId}/`,
    history: (managerId: string) => `/entry/${managerId}/history/`,
    leagues: (managerId: string) => `/entry/${managerId}/leagues/`
  },
  league: {
    standings: (leagueId: string) => `/leagues-classic/${leagueId}/standings/`
  },
  overall: {
    info: () => '/bootstrap-static/'
  }
};