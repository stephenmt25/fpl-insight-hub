import { TempRadarChart } from "@/components/tempRadarChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";

export function VisualizationSection() {
  return (
    <div className="max-w-[94%] lg:max-w-full">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-4">
        <FormValueAnalysis />
        <DifferentialPicks />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="col-span-2 lg:col-span-1">
            <CaptaincyPieChart/>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <TempRadarChart />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <AverageTeamValueAreaChart />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <AveragePtsLineChart />
          </div>
        </div>
      </div>
    </div>
  );
}