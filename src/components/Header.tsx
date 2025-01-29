import { useState } from 'react';
import { Link } from "react-router-dom";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { SignInModal } from "./SignInModal";
import { MobileMenu } from "./header/MobileMenu";
import { DesktopNav } from "./header/DesktopNav";
import { UserMenu } from "./header/UserMenu";

export function Header() {
  const { updateActiveTab } = useContext(TabContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  const handleClick = (tab: string) => {
    updateActiveTab(tab);
  };

  return (
    <header className="sticky bg-gray-800 top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link to="/" className="text-3xl text-gray-200">
            FPL Visualizer
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
          <MobileMenu 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <DesktopNav handleClick={handleClick} />
          <UserMenu setIsSignInModalOpen={setIsSignInModalOpen} />
        </div>
      </div>

      <SignInModal
        isOpen={isSignInModalOpen}
        onOpenChange={setIsSignInModalOpen}
      />
    </header>
  );
}
