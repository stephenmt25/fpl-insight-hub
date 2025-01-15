import { Link } from "react-router-dom";

interface DesktopNavProps {
  handleClick: (tab: string) => void;
}

export function DesktopNav({ handleClick }: DesktopNavProps) {
  return (
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
    </nav>
  );
}