
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { managerService } from "@/services/fpl-api";
import { toast } from "sonner";

interface UserMenuProps {
  setIsSignInModalOpen: (value: boolean) => void;
}

export function UserMenu({ setIsSignInModalOpen }: UserMenuProps) {
  const { isSignedIn, signOut, signIn } = useAuth();
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);

  const handleGuestSignIn = async () => {
    const guestFplId = "7788626"; // The provided FPL ID
    
    setIsGuestSigningIn(true);
    try {
      const managerData = await managerService.getInfo(guestFplId);
      
      if (!managerData) {
        toast.error("Unable to fetch guest manager data. Please try again.");
        return;
      }

      // Store FPL ID in localStorage
      localStorage.setItem('fplId', guestFplId);
      signIn(guestFplId, managerData);
      
      toast.success("You're now signed in as a guest!");
    } catch (error) {
      console.error("Error during guest sign-in:", error);
      toast.error("Error signing in as guest. Please try again later.");
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  return (
    <div className="flex items-center gap-x-4 lg:gap-x-6">
      {!isSignedIn && (
        <>
          <Button
            variant="outline"
            className="hidden md:block"
            onClick={() => setIsSignInModalOpen(true)}
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            className="hidden md:block"
            onClick={handleGuestSignIn}
            disabled={isGuestSigningIn}
          >
            {isGuestSigningIn ? "Signing in..." : "Try as Guest"}
          </Button>
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full bg-gray-100"
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isSignedIn ? (
            <>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                signOut();
                localStorage.removeItem('fplId');
                localStorage.removeItem('managerData');
              }}>
                Log out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setIsSignInModalOpen(true)}>
                Sign In with FPL ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGuestSignIn} disabled={isGuestSigningIn}>
                {isGuestSigningIn ? "Signing in..." : "Try as Guest"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
