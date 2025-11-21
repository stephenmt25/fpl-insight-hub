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
    it("renders the welcome message or sign in options", () => {
        renderWithProviders(<Index />);
        // Check for sign in options since we are not authenticated by default
        expect(screen.getByText(/Here's the FPL 2025 season at a glance/i)).toBeInTheDocument();
        expect(screen.getByText("Sign In with FPL ID")).toBeInTheDocument();
    });

    it("renders the tabs", () => {
        renderWithProviders(<Index />);
        expect(screen.getByText("FPL Stats")).toBeInTheDocument();
        expect(screen.getByText("FPL Standings")).toBeInTheDocument();
    });
});
