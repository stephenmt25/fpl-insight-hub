import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { path: "/", label: "Dashboard" },
  { path: "/my-team", label: "My Team" },
  { path: "/explore", label: "Explore" },
  { path: "/league", label: "League" },
  { path: "/insights", label: "Insights" },
];

export function DesktopNav() {
  const location = useLocation();

  return (
    <nav className="hidden md:flex items-center text-gray-300 gap-6">
      {navLinks.map(({ path, label }) => {
        const isActive = path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(path);

        return (
          <Link
            key={path}
            to={path}
            className={`text-sm font-medium transition-colors ${
              isActive ? "text-white" : "hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
