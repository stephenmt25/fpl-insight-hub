import { createContext, useState } from 'react';
import { LiveGWContextType, EventStatus, OverallData } from '@/types/context';
import { overallService } from '@/services/fpl-api';

const defaultContext: LiveGWContextType = {
  liveGameweekData: null,
  updateLiveGWData: () => {},
  eventStatus: null,
  updateOverallData: () => {},
  overallData: null,
};

export const LiveGWContext = createContext<LiveGWContextType>(defaultContext);

export function LiveGWProvider({ children }: { children: React.ReactNode }) {
  const [liveGameweekData, setLiveGameweekData] = useState<LiveGWContextType['liveGameweekData']>(null);
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
  const [overallData, setOverallData] = useState<OverallData[] | null>(null);

  const updateLiveGWData = async (data: any) => {
    const status = await overallService.getStatus();
    setEventStatus(status);
    setLiveGameweekData(data);
  };

  const updateOverallData = (data: OverallData[]) => {
    setOverallData(data);
  };

  return (
    <LiveGWContext.Provider 
      value={{ 
        liveGameweekData, 
        updateLiveGWData, 
        eventStatus, 
        updateOverallData, 
        overallData 
      }}
    >
      {children}
    </LiveGWContext.Provider>
  );
}