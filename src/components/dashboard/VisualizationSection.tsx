import { TempRadarChart } from "@/components/tempRadarChart";
import { AverageTeamValueAreaChart } from "@/components/averageTeamValueAreaChart";
import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";
import { DreamTeamTable } from "../DreamTeamTable";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";

export function VisualizationSection({ liveGameweek }: { liveGameweek: number }) {
  return (
    <div className="w-full lg:max-w-full">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="col-span-3 lg:col-span-1">
            <CaptaincyPieChart />
          </div>
          <div className="col-span-3 lg:col-span-1">
            <Card className="lg:h-[48%] lg:w-4/5">
              <CardHeader>
                <CardDescription>
                  Captaincy Performance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row gap-4">
                <div className="w-full">
                  <div className='flex justify-between rounded'>
                    <div className="text-4xl">
                      M.Salah
                      <br />
                      <div className="text-sm text-gray-400">
                        Liverpool
                        <br />
                        Ownership: 76%
                      </div>
                    </div>
                    <div className="text-4xl text-right text-gray-600">
                      34(17x2)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="h-3 lg:h-[4%] lg:w-5/5">
            </div>
            <Card className="lg:h-[48%] lg:w-4/5 lg:float-right">
              <CardHeader>
                <CardDescription>
                  Transfers
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row gap-4">
                <div className='flex-row w-full'>
                  <div className="flex justify-between rounded">
                    <div className="">
                      Total Transferred Made
                    </div>
                    <div className="text-xl text-right text-gray-600">
                      11,543,203
                    </div>
                  </div>

                  <div className="flex justify-between rounded">
                    <div className="">
                      Most Transferred In
                    </div>
                    <div className="text-xl text-right text-gray-600">
                      Gordon
                      <br />
                      <div className="text-sm text-gray-400">
                        Team
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-3 lg:col-span-1">
            <AveragePtsLineChart />
          </div>
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardDescription>Dream Team Performance</CardDescription>
              </CardHeader>
              <CardContent>
                <DreamTeamTable liveGameweek={liveGameweek} />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-3">
            <DifferentialPicks />
          </div>
          <div className="col-span-3">
            <FormValueAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
}