import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useContext } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { ThumbsDown, ThumbsUp, TrendingUp, DollarSign, Trophy, LineChart, Users, Target } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface VisualizationSectionProps {
  mostCaptPlayerData: any;
  mostCaptPlayerFixture: any;
  selectedGameweekData: any;
  mostTransferredPlayerData: any;
  mostTransferredPlayerTeam: any;
}

export function VisualizationSection({ mostCaptPlayerData, mostCaptPlayerFixture, selectedGameweekData, mostTransferredPlayerData, mostTransferredPlayerTeam }: VisualizationSectionProps) {
  const { liveGameweekData } = useContext(LiveGWContext)
  const navigate = useNavigate();

  const getPerformanceIcon = () => {
    if (mostCaptPlayerData) {
      return mostCaptPlayerData[1] < 4 ?
        <ThumbsDown />
        :
        <ThumbsUp />
    }
  }

  let formattedTransfers = new Intl.NumberFormat('en-US').format(Number(selectedGameweekData?.transfers_made));
  // local state to control the Differential Picks modal
  const [showDifferentialModal, setShowDifferentialModalState] = useState(false);

  // local state to control the Form Value modal
  const [showFormValueModal, setShowFormValueModalState] = useState(false);

  // expose a simple setter with the requested signature
  function setShowDifferentialModal(open: boolean): void {
    setShowDifferentialModalState(open);
  }

  function setShowFormValueModal(open: boolean): void {
    setShowFormValueModalState(open);
  }
  return (
    <div className="w-full lg:max-w-full">
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* <div className="col-span-3 lg:col-span-1">
            <CaptaincyPieChart />
          </div> */}
          <div className="col-span-3 lg:col-span-1 order-2 lg:order-1">
            <AveragePtsLineChart />
          </div>
          <div className="col-span-3 lg:col-span-1 order-1 lg:order-2">
            {mostCaptPlayerData && mostCaptPlayerData[1] ?
              <Card className="lg:h-[54%] lg:w-4/5">
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
              <Card className="lg:h-[54%] lg:w-4/5">
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
              <Card className="lg:h-[43%] lg:w-4/5 lg:float-right">
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

          <div className="col-span-3 lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              <Card className="hidden lg:block cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowDifferentialModal(true)}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Differential Picks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              {showDifferentialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg max-h-xl mx-32">
                    <button
                      onClick={() => setShowDifferentialModal(false)}
                      className="float-right p-2 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                    <div className="p-4">
                      <CardHeader>
                        <CardTitle>ML-Powered Differential Analysis</CardTitle>
                        <CardDescription>
                          K-means clustering identifies player groups based on form, ownership, xG/xA, and ICT index
                        </CardDescription>
                      </CardHeader>
                      <DifferentialPicks />
                    </div>
                  </div>
                </div>
              )}
              <Card className="hidden lg:block cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowFormValueModal(true)}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Form Value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              {showFormValueModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg max-h-xl mx-32">
                    <button
                      onClick={() => setShowFormValueModal(false)}
                      className="float-right p-2 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                    <div className="p-4">
                      <CardHeader>
                        <CardTitle>Form Value Analysis</CardTitle>
                        <CardDescription>
                          Visualizing players based on their form, price, and ownership
                        </CardDescription>
                      </CardHeader>
                      <FormValueAnalysis />
                    </div>
                  </div>
                </div>
              )}
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/performance')}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Your Performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/insights')}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <LineChart className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/standings')}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/insights')}>
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">Transfers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-8">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
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
          {/* <div className="col-span-3">
            <DifferentialPicks />
          </div>
          <div className="col-span-3">
            <FormValueAnalysis />
          </div> */}
        </div>
      </div>
    </div>
  );
}