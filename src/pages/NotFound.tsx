import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h1 className="text-6xl font-bold text-fpl-primary">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
    </div>
  );
}
