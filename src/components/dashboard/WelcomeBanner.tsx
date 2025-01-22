import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Award, Trophy, DollarSign } from "lucide-react";

interface WelcomeBannerProps {
}

export function WelcomeBanner({ }: WelcomeBannerProps) {
  const { isSignedIn, currentManager } = useAuth();

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

  if (isSignedIn && currentManager) {
    // Mock data for demonstration - replace with actual data from your API
    const mockPerformanceData = {
      overallRank: 100000,
      previousRank: 120000,
      teamValue: 105.3,
      previousTeamValue: 105.1,
      yearsPlayed: 7
    };

    const getRankDelta = () => {
      const delta = mockPerformanceData.previousRank - mockPerformanceData.overallRank;
      const isImprovement = delta > 0;
      return {
        value: Math.abs(delta).toLocaleString(),
        icon: isImprovement ? 
          <ArrowUp className="h-4 w-4 text-green-500" /> : 
          <ArrowDown className="h-4 w-4 text-red-500" />,
        color: isImprovement ? 'text-green-500' : 'text-red-500'
      };
    };

    const getValueDelta = () => {
      const delta = mockPerformanceData.teamValue - mockPerformanceData.previousTeamValue;
      const isIncrease = delta > 0;
      return {
        value: delta.toFixed(1),
        icon: isIncrease ? 
          <ArrowUp className="h-4 w-4 text-green-500" /> : 
          <ArrowDown className="h-4 w-4 text-red-500" />,
        color: isIncrease ? 'text-green-500' : 'text-red-500'
      };
    };

    const rankDelta = getRankDelta();
    const valueDelta = getValueDelta();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hello, {currentManager.player_first_name}! Here's your FPL journey at a glance.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Track your progress and make informed decisions for your team.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Team Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Name</p>
                <p className="text-lg font-semibold">{currentManager.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p>{currentManager.player_first_name} {currentManager.player_last_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Rank</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span className="text-lg font-semibold">
                      {mockPerformanceData.overallRank.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${rankDelta.color}`}>
                  {rankDelta.icon}
                  <span>{rankDelta.value}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Value</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-lg font-semibold">£{mockPerformanceData.teamValue}m</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${valueDelta.color}`}>
                  {valueDelta.icon}
                  <span>{valueDelta.value}m</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span className="text-lg font-semibold">Veteran Manager</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {mockPerformanceData.yearsPlayed} seasons of FPL experience
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Sign in with your FPL ID to see your performance analytics.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Track your progress and make informed decisions for your team.
        </p>
      </div>
    </div>
  );
}