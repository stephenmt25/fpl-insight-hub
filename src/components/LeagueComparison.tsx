import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeagueTable } from "@/components/LeagueTable";
import { ComparisonMetrics } from "@/components/ComparisonMetrics"
import { HistoricalComparison } from "@/components/HistoricalComparison";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { useNavigate } from 'react-router-dom';
import { BarChart } from "lucide-react";

export function LeagueComparison() {
  const [selectedLeague, setSelectedLeague] = useState("1");
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const navigate = useNavigate();
  const { updateActiveTab } = useContext(TabContext);

  const handleClick = (tab: string) => {
    updateActiveTab(tab);
    navigate('/standings');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-fpl-primary">
          Compare Your Performance with League Members
        </h1>
        <p className="text-xl text-muted-foreground">
          Analyze your progress and stats against other FPL managers in your league
        </p>
        <div className="w-full max-w-xs">
          <div className="flex items-center pb-2">
            <BarChart className="h-4 w-4" />
            <label className="text-sm font-medium">League Select</label>
          </div>
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger>
              <SelectValue placeholder="Select a league" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">My Mini League</SelectItem>
              <SelectItem value="2">Work League</SelectItem>
              <SelectItem value="3">Friends League</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
            </CardHeader>
            <CardContent>
              <LeagueTable onManagerSelect={setSelectedManager} />
            </CardContent>
          </Card>
          <Button onClick={() => handleClick('insights')} className="w-full" variant="outline">
            View League Insights
          </Button>
        </div>
        <div className="space-y-4">
          <ComparisonMetrics selectedManager={selectedManager} />
          <HistoricalComparison selectedManager={selectedManager} />
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={() => handleClick('table')} variant="outline">Analyze Another League</Button>
        <Button onClick={() => handleClick('trends')} >View Detailed League Trends</Button>
      </div>
    </div>
  );
}