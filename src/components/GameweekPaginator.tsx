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
  liveGameweek: number;
}

export function GameweekPaginator({
  currentGameweek,
  setCurrentGameweek,
  totalGameweeks,
  liveGameweek
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
    <div className="flex items-center justify-between max-w-svh">
      <h2 className="text-xl font-semibold text-fpl-primary w-auto whitespace-nowrap">
        Gameweek {currentGameweek}
      </h2>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            {currentGameweek > 1 && (
              <>
              <PaginationPrevious className="hidden lg:flex" onClick={handlePrevious} />
              <ChevronLeft className=" lg:hidden" onClick={handlePrevious} />
              </>
            )}
          </PaginationItem>
          {/* Mobile: Show only current Gameweek */}
          <PaginationItem className="block lg:hidden">
            <PaginationLink isActive>{`GW${currentGameweek}`}</PaginationLink>
          </PaginationItem>

          {/* Desktop: Show a range of Gameweeks */}
          <PaginationItem className="hidden lg:flex">
            {[...Array(3)].map((_, i) => {
              const gameweek = currentGameweek - 2 + i;
              if (gameweek > 0 && gameweek <= totalGameweeks) {
                return (
                  <PaginationItem className="px-1" key={gameweek}>
                    <PaginationLink
                      className="px-"
                      onClick={() => setCurrentGameweek(gameweek)}
                      isActive={gameweek === currentGameweek}
                    >
                      GW{gameweek}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
          </PaginationItem>
          <PaginationItem>
            {currentGameweek !== liveGameweek && (
              <>
              <PaginationNext className="hidden lg:flex" onClick={handleNext} />
              <ChevronRight className=" lg:hidden" onClick={handleNext} />
              </>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}