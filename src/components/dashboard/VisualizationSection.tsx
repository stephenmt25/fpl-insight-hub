import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { useContext } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { ThumbsDown, ThumbsUp } from "lucide-react";

interface VisualizationSectionProps {
  mostCaptPlayerData: any;
  mostCaptPlayerFixture: any;
  selectedGameweekData: any;
  mostTransferredPlayerData: any;
  mostTransferredPlayerTeam: any;
}

export function VisualizationSection({ mostCaptPlayerData, mostCaptPlayerFixture, selectedGameweekData, mostTransferredPlayerData, mostTransferredPlayerTeam }: VisualizationSectionProps) {
  const { liveGameweekData } = useContext(LiveGWContext)
  const getPerformanceIcon = () => {
    if (mostCaptPlayerData) {
      return mostCaptPlayerData[1] < 4 ?
        <ThumbsDown />
        :
        <ThumbsUp />
    }
  }

  let formattedTransfers = new Intl.NumberFormat('en-US').format(Number(selectedGameweekData?.transfers_made));
  return (
    <div className="w-full lg:max-w-full">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="col-span-3 lg:col-span-1">
            <CaptaincyPieChart />
          </div>
          <div className="col-span-3 lg:col-span-1">
            <AveragePtsLineChart />
          </div>
          <div className="col-span-3 lg:col-span-1">

            {mostCaptPlayerData && mostCaptPlayerData[1] ?
              <Card className="lg:h-[48%] lg:w-4/5">
                <CardHeader>
                  <CardDescription>
                    GW Most Captained Points
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row gap-4">
                  <div className="w-full flex justify-between rounded">
                    <div className="text-4xl">
                      {mostCaptPlayerData[0]?.web_name}
                    </div>
                    <div className="text-4xl text-right text-gray-600">
                      {mostCaptPlayerData[1] * 2}({mostCaptPlayerData[1]}x2)
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between rounded">
                    <div className="text-sm text-gray-400">
                      {mostCaptPlayerFixture}
                      <br />
                      Ownership: {mostCaptPlayerData[0]?.selected_by_percent}%
                    </div>
                    <div>
                      {getPerformanceIcon()}
                    </div>
                  </div>
                </CardFooter>
              </Card>
              :
              <Card className="lg:h-[48%] lg:w-4/5">
                <CardHeader>
                  <CardDescription>
                    GW Most Captained Points
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row gap-4">
                  <div className="w-full">
                    <div className='flex justify-between rounded'>
                      <div className="text-4xl">
                        Loading ...
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-gray-400">
                    Loading ...
                  </div>
                </CardFooter>
              </Card>
            }
            <div className="h-3 lg:h-[4%] lg:w-5/5">
            </div>
            {mostTransferredPlayerTeam && mostTransferredPlayerData ?
              <Card className="lg:h-[48%] lg:w-4/5 lg:float-right">
                <CardHeader>
                  <CardDescription>
                    Overall GW Transfer Info
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row gap-4">
                  <div className='flex-row w-full'>
                    <div className="flex justify-between rounded">
                      <div className="">
                        Total Transferred Made in GW
                      </div>
                      <div className="text-xl text-right text-gray-600">
                        {formattedTransfers}
                      </div>
                    </div>

                    <div className="flex justify-between rounded">
                      <div className="">
                        Most Transferred In
                      </div>
                      <div className="text-xl text-right text-gray-600">
                        {mostTransferredPlayerData[0]?.web_name}
                        <br />
                        <div className="text-sm text-gray-400">
                          {mostTransferredPlayerTeam[0]?.short_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              :
              <Card className="lg:h-[48%] lg:w-4/5">
                <CardHeader>
                  <CardDescription>
                    Total Transferred Made in GW
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row gap-4">
                  <div className="w-full">
                    <div className='flex justify-between rounded'>
                      <div className="text-4xl">
                        Loading ...
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-gray-400">
                    Loading ...
                  </div>
                </CardFooter>
              </Card>
            }
          </div>

          {/* {liveGameweekData &&
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardDescription>Dream Team Performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <DreamTeamTable liveGameweek={liveGameweekData.id} currentGameweek={currentGameweek} />
                </CardContent>
              </Card>
            </div>} */}
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