import { Link, useLocation } from "react-router-dom";
import { Home, Users, Search, Trophy, Brain } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/my-team", icon: Users, label: "Team" },
  { path: "/explore", icon: Search, label: "Explore" },
  { path: "/league", icon: Trophy, label: "League" },
  { path: "/insights", icon: Brain, label: "Insights" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-900 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive
                  ? "text-[#00ff87]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
