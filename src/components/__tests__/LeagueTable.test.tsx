import { render, screen, fireEvent } from "@testing-library/react";
import { LeagueTable } from "../LeagueTable";
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/services/fpl-api", () => ({
    managerService: {
        getGameweekTeamPicks: vi.fn().mockResolvedValue({
            picks: [],
            entry_history: { event_transfers_cost: 0 },
            active_chip: null,
        }),
    },
}));

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => Promise.resolve({ data: [{ web_name: "Salah" }], error: null }),
            }),
        }),
    },
}));

const mockLeagueData = [
    {
        id: 1,
        event_total: 50,
        player_name: "John Doe",
        rank: 1,
        last_rank: 2,
        rank_sort: 1,
        total: 100,
        entry: 123,
        entry_name: "Team A",
        has_played: true,
    },
    {
        id: 2,
        event_total: 40,
        player_name: "Jane Smith",
        rank: 2,
        last_rank: 1,
        rank_sort: 2,
        total: 90,
        entry: 456,
        entry_name: "Team B",
        has_played: true,
    },
];

describe("LeagueTable", () => {
    it("renders the table with correct headers", () => {
        render(
            <LeagueTable
                leagueData={mockLeagueData}
                selectedLeague="Test League"
                pageNumber="1"
                setPageNumber={vi.fn()}
                updateSelectedLeague={vi.fn()}
                hasNext={false}
                leagueId="1"
                gameweekNumber={1}
            />
        );

        expect(screen.getByText("Test League Standings")).toBeInTheDocument();
        expect(screen.getByText("Team & Manager")).toBeInTheDocument();
        expect(screen.getByText("GW Points")).toBeInTheDocument();
    });

    it("renders league data correctly", () => {
        render(
            <LeagueTable
                leagueData={mockLeagueData}
                selectedLeague="Test League"
                pageNumber="1"
                setPageNumber={vi.fn()}
                updateSelectedLeague={vi.fn()}
                hasNext={false}
                leagueId="1"
                gameweekNumber={1}
            />
        );

        expect(screen.getByText("Team A")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Team B")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("handles pagination clicks", () => {
        const setPageNumber = vi.fn();
        render(
            <LeagueTable
                leagueData={mockLeagueData}
                selectedLeague="Test League"
                pageNumber="1"
                setPageNumber={setPageNumber}
                updateSelectedLeague={vi.fn()}
                hasNext={true}
                leagueId="1"
                gameweekNumber={1}
            />
        );

        const nextButtons = screen.getAllByText("Next");
        fireEvent.click(nextButtons[0]);
        expect(setPageNumber).toHaveBeenCalled();
    });
});
