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
  currentGameweekNumber: number;
  setCurrentGameweekNumber: (gameweek: number) => void;
  totalGameweeks: number;
  liveGameweekData: { id: number };
}

export function GameweekPaginator({
  currentGameweekNumber,
  setCurrentGameweekNumber,
  totalGameweeks,
  liveGameweekData
}: GameweekPaginatorProps) {
  const handlePrevious = () => {
    if (currentGameweekNumber > 1) {
      setCurrentGameweekNumber(currentGameweekNumber - 1);
    }
  };

  const handleNext = () => {
    const maxGameweek = liveGameweekData?.id || totalGameweeks;
    if (currentGameweekNumber < maxGameweek) {
      setCurrentGameweekNumber(currentGameweekNumber + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-2">
      <h2 className="text-xl font-semibold w-auto whitespace-nowrap">
        Gameweek {currentGameweekNumber}
      </h2>
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            {currentGameweekNumber > 1 && (
              <>
              <PaginationPrevious className="hidden lg:flex" onClick={handlePrevious} />
              <ChevronLeft className=" lg:hidden" onClick={handlePrevious} />
              </>
            )}
          </PaginationItem>
          {/* Mobile: Show only current Gameweek */}
          <PaginationItem className="block lg:hidden">
            <PaginationLink isActive>{`GW${currentGameweekNumber}`}</PaginationLink>
          </PaginationItem>

          {/* Desktop: Show a range of Gameweeks */}
          <PaginationItem className="hidden lg:flex">
            {[...Array(3)].map((_, i) => {
              const gameweek = currentGameweekNumber - 1 + i;
              const maxGameweek = liveGameweekData?.id || totalGameweeks;
              if (gameweek > 0 && gameweek <= maxGameweek) {
                return (
                  <PaginationItem className="px-1" key={gameweek}>
                    <PaginationLink
                      className="px-"
                      onClick={() => setCurrentGameweekNumber(gameweek)}
                      isActive={gameweek === currentGameweekNumber}
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
            {currentGameweekNumber < (liveGameweekData?.id || totalGameweeks) && (
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