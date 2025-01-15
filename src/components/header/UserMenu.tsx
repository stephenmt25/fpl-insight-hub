import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";

interface UserMenuProps {
  setIsSignInModalOpen: (value: boolean) => void;
}

export function UserMenu({ setIsSignInModalOpen }: UserMenuProps) {
  const { isSignedIn, signOut } = useAuth();

  return (
    <div className="flex items-center gap-x-4 lg:gap-x-6">
      {!isSignedIn && (
        <Button
          variant="outline"
          className="hidden md:block"
          onClick={() => setIsSignInModalOpen(true)}
        >
          Sign In
        </Button>
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
            <DropdownMenuItem onClick={() => setIsSignInModalOpen(true)}>
              Sign In with FPL ID
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}