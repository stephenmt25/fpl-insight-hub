// contexts/teams-context.tsx
import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

type Team = {
  id: number
  name: string
  short_name: string
  // ... other team fields
}

type TeamsContextType = {
  data: Team[] | null
  isLoading: boolean
  error: Error | null
}

const TeamsContext = createContext<TeamsContextType>({
  data: null,
  isLoading: true,
  error: null,
})

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error } = useQuery<Team[]>({
    queryKey: ['allTeams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plteams')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      return data
    },
    staleTime: Infinity, // Team data rarely changes
  })

  return (
    <TeamsContext.Provider value={{ data, isLoading, error }}>
      {children}
    </TeamsContext.Provider>
  )
}

export const useTeamsContext = () => {
  const context = useContext(TeamsContext)
  if (!context) {
    throw new Error('useTeamsContext must be used within a TeamsProvider')
  }
  return context
}