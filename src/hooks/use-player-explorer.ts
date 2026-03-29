import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamsContext } from "@/context/teams-context";
import { Database } from "@/integrations/supabase/types";

type PlayerRow = Database['public']['Tables']['plplayerdata']['Row'];

export type SortField = 'total_points' | 'form' | 'now_cost' | 'selected_by_percent' | 'expected_goals' | 'expected_assists' | 'ict_index' | 'points_per_game' | 'ep_next' | 'web_name';
export type SortDirection = 'asc' | 'desc';

export interface PlayerFilters {
  positions: number[]; // element_types: 1=GK, 2=DEF, 3=MID, 4=FWD
  teams: number[];
  minPrice: number;
  maxPrice: number;
  search: string;
  minForm: number;
}

const DEFAULT_FILTERS: PlayerFilters = {
  positions: [],
  teams: [],
  minPrice: 3.5,
  maxPrice: 16,
  search: '',
  minForm: 0,
};

export function usePlayerExplorer() {
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('total_points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const pageSize = 50;

  const { data: teamsData } = useTeamsContext();

  const { data: allPlayers, isLoading } = useQuery({
    queryKey: ['allPlayersExplorer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plplayerdata')
        .select('*')
        .order('total_points', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!allPlayers) return [];

    return allPlayers.filter(player => {
      if (filters.positions.length > 0 && !filters.positions.includes(player.element_type)) return false;
      if (filters.teams.length > 0 && !filters.teams.includes(player.team)) return false;

      const price = (player.now_cost || 0) / 10;
      if (price < filters.minPrice || price > filters.maxPrice) return false;

      if (filters.search) {
        const search = filters.search.toLowerCase();
        const name = (player.web_name || '').toLowerCase();
        const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
        if (!name.includes(search) && !fullName.includes(search)) return false;
      }

      if (filters.minForm > 0) {
        const form = parseFloat(player.form || '0');
        if (form < filters.minForm) return false;
      }

      return true;
    });
  }, [allPlayers, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortField) {
        case 'web_name':
          return sortDirection === 'asc'
            ? (a.web_name || '').localeCompare(b.web_name || '')
            : (b.web_name || '').localeCompare(a.web_name || '');
        case 'form':
        case 'selected_by_percent':
        case 'expected_goals':
        case 'expected_assists':
        case 'ict_index':
        case 'points_per_game':
        case 'ep_next':
          aVal = parseFloat((a as Record<string, unknown>)[sortField] as string || '0');
          bVal = parseFloat((b as Record<string, unknown>)[sortField] as string || '0');
          break;
        default:
          aVal = ((a as Record<string, unknown>)[sortField] as number) || 0;
          bVal = ((b as Record<string, unknown>)[sortField] as number) || 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return arr;
  }, [filtered, sortField, sortDirection]);

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(0);
  };

  const updateFilter = (partial: Partial<PlayerFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const comparePlayers = useMemo(() => {
    if (!allPlayers) return [];
    return compareIds.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as PlayerRow[];
  }, [allPlayers, compareIds]);

  return {
    filters,
    updateFilter,
    resetFilters,
    sortField,
    sortDirection,
    toggleSort,
    players: paginated,
    totalCount: sorted.length,
    page,
    setPage,
    totalPages,
    isLoading,
    teams: teamsData,
    compareIds,
    toggleCompare,
    comparePlayers,
    clearCompare: () => setCompareIds([]),
  };
}
