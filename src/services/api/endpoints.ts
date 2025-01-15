export const ENDPOINTS = {
  manager: {
    info: (managerId: string) => `/entry/${managerId}/`,
    history: (managerId: string) => `/entry/${managerId}/history/`,
    leagues: (managerId: string) => `/entry/${managerId}/leagues/`
  },
  league: {
    standings: (leagueId: string, pageNumber: string) => `/leagues-classic/${leagueId}/standings/?page_standings=${pageNumber}`
  },
  overall: {
    info: () => '/bootstrap-static/'
  }
};