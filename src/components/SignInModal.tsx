import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/services/fpl-api";

interface SignInModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ isOpen, onOpenChange }: SignInModalProps) {
  const [fplId, setFplId] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { signIn } = useAuth();

  
  const {
    data: manager,
    error: managerError,
    isLoading: isLoadingManager,
  } = useQuery({
    queryKey: ['manager', fplId],
    queryFn: () => managerService.getInfo(fplId),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fplId.match(/^\d+$/)) {
      setError("Please enter a valid FPL ID (numbers only)");
      return;
    }

    // Store FPL ID in localStorage and update auth context
    localStorage.setItem('fplId', fplId);
    if (manager.toString() === 'The game is being updated.' || manager === null || managerError) {
      toast({
        title: "Failed!",
        description: "The game is being updated.",
      });
    } else {
      signIn(fplId, manager);
      toast({
        title: "Success!",
        description: "You're now signed in!",
      });
      onOpenChange(false);
    }  
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In with Your FPL ID</DialogTitle>
          <DialogDescription>
            Connect your FPL account to personalize your experience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">How to Find Your FPL ID:</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li>1. <b>Log in</b> to the Fantasy Premier League website</li>
                <li>2. Go to the <b>"Points" tab</b></li>
                <li>3. <b>Find Your FPL ID:</b> Look at the URL in your browser. Your FPL ID is the number following /entry/</li>
                <p className="text-sm text-muted-foreground italic">
                Example: fantasy.premierleague.com/entry/1234567/event/1
              </p>
                <li>4. <b>For Mobile Users:</b> If you don’t see the full URL, select Request Desktop Site from your browser options.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fpl-id">Enter Your FPL ID</Label>
              <Input
                id="fpl-id"
                placeholder="e.g., 1234567"
                value={fplId}
                onChange={(e) => setFplId(e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Sign In
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              We only use your FPL ID to fetch public data from the Fantasy Premier League API.
              Your account credentials remain secure.
            </p>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}