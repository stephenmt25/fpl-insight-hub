import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-6 text-sm text-gray-500">
          <Link to="/privacy" className="hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-gray-900">
            Terms of Service
          </Link>
          <Link to="/credits" className="hover:text-gray-900">
            API Credits
          </Link>
        </div>
      </div>
    </footer>
  );
}