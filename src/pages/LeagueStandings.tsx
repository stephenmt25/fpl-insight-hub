import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";
import { LeagueInsights } from "@/components/LeagueInsights";
import { LeagueTrends } from "@/components/LeagueTrends";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContext } from 'react';
import { TabContext } from '../context/standings-tabs-context';
import { BarChart } from "lucide-react";

export default function LeagueStandings() {
  const [selectedLeague, setSelectedLeague] = useState("1");
  const { activeTab } = useContext(TabContext);
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-fpl-primary">League Standings</h1>
        <p className="text-xl text-muted-foreground">
          Track and analyze your mini-league performance
        </p>
        <div className="w-full max-w-xs">
          <div className="flex items-center  pb-2">
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
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="table">League Table</TabsTrigger>
          <TabsTrigger value="insights">League Insights</TabsTrigger>
          <TabsTrigger value="trends">Detailed Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <LeagueTable />
        </TabsContent>
        <TabsContent value="insights">
          <LeagueInsights selectedLeague={selectedLeague} />
        </TabsContent>
        <TabsContent value="trends">
          <LeagueTrends selectedLeague={selectedLeague} />
        </TabsContent>
      </Tabs>
    </div>
  );
}