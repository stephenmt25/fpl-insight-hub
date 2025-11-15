import { AveragePtsLineChart } from "@/components/averagePointsLineChart";
import { CaptaincyPieChart } from "../captainsPieChart";
import { FormValueAnalysis } from "../FormValueAnalysis";
import { DifferentialPicks } from "../DifferentialPicks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { useContext } from "react";
import { LiveGWContext } from "@/context/livegw-context";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

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
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* <div className="col-span-3 lg:col-span-1">
            <CaptaincyPieChart />
          </div> */}
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

          <div className="col-span-3 lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowDifferentialModal(true)}>
                <CardHeader>
                  <CardDescription>Differential Picks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
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
                      <DifferentialPicks />
                    </div>
                  </div>
                </div>
              )}
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowFormValueModal(true)}>
                <CardHeader>
                  <CardDescription>Form Value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
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
                      <FormValueAnalysis />
                    </div>
                  </div>
                </div>
              )}
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { }}>
                <CardHeader>
                  <CardDescription>Link 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { }}>
                <CardHeader>
                  <CardDescription>Link 4</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { }}>
                <CardHeader>
                  <CardDescription>Link 5</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { }}>
                <CardHeader>
                  <CardDescription>Link 6</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-12">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
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