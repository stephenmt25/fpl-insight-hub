import { TempRadarChart } from "@/components/tempRadarChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";

export function VisualizationSection() {
  return (
    <div className="max-w-[94%] lg:max-w-full">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-1">
          <p className="text-gray-600">Overall Captaincy</p>
          <CaptaincyPieChart/>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <p className="text-gray-600">Distribution</p>
          <TempRadarChart />
        </div>
        <div className="col-span-2">
          <AverageTeamValueAreaChart />
        </div>
        <div className="col-span-2">
          <AveragePtsLineChart />
        </div>
      </div>
    </div>
  );
}