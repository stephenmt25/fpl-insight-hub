import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface MobileMenuProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export function MobileMenu({ isMobileMenuOpen, setIsMobileMenuOpen }: MobileMenuProps) {
  return (
    <>
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

      <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DropdownMenuContent align="end" className="w-48 md:hidden">
          <DropdownMenuItem>
            <Link to="/" className="w-full">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/standings" className="w-full">League Standings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/performance" className="w-full">Performance</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/insights" className="w-full">Insights</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}