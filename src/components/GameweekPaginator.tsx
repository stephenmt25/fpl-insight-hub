import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface GameweekPaginatorProps {
  currentGameweek: number;
  setCurrentGameweek: (gameweek: number) => void;
  totalGameweeks: number;
}

export function GameweekPaginator({
  currentGameweek,
  setCurrentGameweek,
  totalGameweeks,
}: GameweekPaginatorProps) {
  const handlePrevious = () => {
    if (currentGameweek > 1) {
      setCurrentGameweek(currentGameweek - 1);
    }
  };

  const handleNext = () => {
    if (currentGameweek < totalGameweeks) {
      setCurrentGameweek(currentGameweek + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-fpl-primary">
        Gameweek {currentGameweek}
      </h2>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              disabled={currentGameweek === 1}
            />
          </PaginationItem>
          {[...Array(5)].map((_, i) => {
            const gameweek = currentGameweek - 2 + i;
            if (gameweek > 0 && gameweek <= totalGameweeks) {
              return (
                <PaginationItem key={gameweek}>
                  <PaginationLink
                    onClick={() => setCurrentGameweek(gameweek)}
                    isActive={gameweek === currentGameweek}
                  >
                    {gameweek}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            return null;
          })}
          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              disabled={currentGameweek === totalGameweeks}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}