import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BallScene } from "@/three/lazy";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <BallScene />
      <h1 className="chrome-text text-8xl">404</h1>
      <p className="text-muted-foreground">Offside. That page doesn't exist.</p>
      <Button asChild className="btn-chrome"><Link to="/">Back to the dashboard</Link></Button>
    </div>
  );
}
