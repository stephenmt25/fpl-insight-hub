import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link to="/" className="text-2xl font-bold text-fpl-primary">
            FPL Visualizer
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/standings"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              League Standings
            </Link>
            <Link
              to="/performance"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Performance
            </Link>
            <Link
              to="/insights"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Insights
            </Link>
            <Link
              to="/settings"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full bg-gray-100"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}