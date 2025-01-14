import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, User, X } from "lucide-react"; // Import X icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useContext } from 'react';
import { TabContext } from '../context';


export function Header() {
  const { updateActiveTab } = useContext(TabContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleClick = (tab: string) => {
    updateActiveTab(tab);
  };
  
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link to="/" className="text-2xl font-bold text-fpl-primary">
            FPL Visualizer
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden relative h-8 w-8 rounded-full bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Dashboard
            </Link>
            <Link
              onClick={() => handleClick('table')}
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
            {/* <Link
              to="/settings"
              className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
            >
              Settings
            </Link> */}
          </nav>
          {/* Mobile Dropdown Menu */}
          <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <span className="md:hidden"> 
                {/* This span will render as a hidden element on desktop */}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem >
                <Link to="/" className="w-full">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem >
                <Link to="/standings" className="w-full">
                  League Standings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem >
                <Link
                  to="/performance"
                  className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
                >
                  Performance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem >
                <Link
                  to="/insights"
                  className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
                >
                  Insights
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem >
                <Link
                  to="/settings"
                  className="text-sm font-medium text-gray-700 hover:text-fpl-primary"
                >
                  Settings
                </Link>
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>

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
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}