import { Link } from "react-router-dom";

interface DesktopNavProps {
  handleClick: (tab: string) => void;
}

export function DesktopNav({ handleClick }: DesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center text-gray-300 gap-6">
      <Link
        to="/"
        className="text-sm font-medium hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        to="/performance"
        className="text-sm font-medium hover:text-white"
      >
        Performance
      </Link>
      <Link
        onClick={() => handleClick('table')}
        to="/standings"
        className="text-sm font-medium hover:text-white"
      >
        League Standings
      </Link>
      <Link
        to="/insights"
        className="text-sm font-medium hover:text-white"
      >
        Insights
      </Link>
    </nav>
  );
}