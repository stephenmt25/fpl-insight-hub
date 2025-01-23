import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { useState, useEffect } from "react";
import { managerService } from "@/services/fpl-api";
import { ManagerHistory } from "@/types/fpl";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface WelcomeBannerProps {
}

export function WelcomeBanner({ }: WelcomeBannerProps) {
  const { isSignedIn, currentManager } = useAuth();
  const [managerHistory, setManagerHistory] = useState<ManagerHistory>()

  const triggerSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-fpl-data');
      if (error) throw error;
      toast.success('FPL data sync triggered successfully');
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to sync FPL data');
    }
  };

  useEffect(() => {
    const fetchManagerHistory = async () => {
      try {
        const managerHistoryData = await managerService.getHistory(currentManager?.id);
        setManagerHistory(managerHistoryData)
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }
    fetchManagerHistory()
  }, [])

  let formattedPoints = new Intl.NumberFormat('en-US').format(Number(currentManager?.summary_overall_points));
  let formattedOR = new Intl.NumberFormat('en-US').format(Number(currentManager?.summary_overall_rank));


  const totalPointsSum = managerHistory?.past.reduce((sum: number, season: any) => sum + season.total_points, 0);
  const rankSum = managerHistory?.past.reduce((sum: number, season: any) => sum + season.rank, 0);

  const averagePoints = new Intl.NumberFormat('en-US').format(Math.round(totalPointsSum / managerHistory?.past.length));
  const averageRank = new Intl.NumberFormat('en-US').format(Math.round(rankSum / managerHistory?.past.length));



  if (isSignedIn) {
    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="lg:text-5xl text-3xl font-bold tracking-tight">
            {currentManager?.name}
          </h2>
          <p className="mt-2 flex gap-2 text-muted-foreground lg:text-xl uppercase">
            {currentManager?.player_first_name} {currentManager?.player_last_name} | {currentManager?.player_region_iso_code_long} <span className={`fi fi-${currentManager?.player_region_iso_code_short.toLowerCase()}`}></span>
          </p>
          <p className="mt-2 flex gap-2 text-muted-foreground lg:text-xl uppercase">
            YR
            <div className="text-black">
              {currentManager?.years_active}
            </div>
            | AVG PTS
            <div className="text-black">
              {averagePoints}
            </div>
            | AVG OR
            <div className="text-black">
              {averageRank}
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 lg:w-5"></Info></TooltipTrigger>
              <TooltipContent>
                <p>YR - FPL Seasons Completed</p>
                <p>AVG PTS - Average Total Points</p>
                <p>AVG OR - Average Overall Rank</p>
              </TooltipContent>
            </Tooltip>

            {/* <Info></Info> */}
          </p>
        </div>
        <div className="lg:text-right">
          <p className=" flex gap-2 text-muted-foreground text-2xl sm:text-xl uppercase">
            <div className="text-black">
              {formattedPoints}
            </div>
            | total points
          </p>
          <p className="mt-2 flex gap-2 text-muted-foreground text-2xl sm:text-xl uppercase">
            <div className="text-black">
              {formattedOR}
            </div>
            | Overall ranks
          </p>
        </div>
        {/* <button onClick={triggerSync}>
          trigger
        </button> */}
      </div>
    );
  }
}