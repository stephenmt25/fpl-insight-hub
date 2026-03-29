import { render, screen } from "@testing-library/react";
import Index from "../Index";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { LiveGWProvider } from "@/context/livegw-context";
import { TeamsProvider } from "@/context/teams-context";
import { BrowserRouter } from "react-router-dom";

// Mock dependencies
vi.mock("@/services/fpl-api", () => ({
    leagueService: {
        getStandings: vi.fn().mockResolvedValue([]),
    },
    playerService: {
        getGameweekPlayerStats: vi.fn().mockResolvedValue({ elements: [] }),
        getPlayerSummary: vi.fn().mockResolvedValue({ history: [] }),
    },
    managerService: {
        getInfo: vi.fn().mockResolvedValue({}),
    },
    overallService: {
        getStatus: vi.fn().mockResolvedValue({ status: [], leagues: "" }),
    },
}));

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: {} }),
                }),
            }),
        }),
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
        },
    },
}));

vi.mock("@/services/api-client", () => ({
    apiClient: {
        get: vi.fn().mockResolvedValue({ events: [], chips: [], phases: [], elements: [], teams: [], element_types: [], game_config: { scoring: {} } }),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <LiveGWProvider>
                    <TeamsProvider>
                        <BrowserRouter>
                            {component}
                        </BrowserRouter>
                    </TeamsProvider>
                </LiveGWProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

describe("Index Page", () => {
    it("renders the welcome message and sign in options", () => {
        renderWithProviders(<Index />);
        expect(screen.getByText(/FPL 2025 Season at a Glance/i)).toBeInTheDocument();
        expect(screen.getByText("Sign In with FPL ID")).toBeInTheDocument();
        expect(screen.getByText("Try as Guest")).toBeInTheDocument();
    });

    it("renders the gameweek stats section", () => {
        renderWithProviders(<Index />);
        // StatsOverview renders stat cards with loading states
        expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
    });
});
