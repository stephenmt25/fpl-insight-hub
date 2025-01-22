import { overallService } from '@/services/fpl-api';
import { createContext, useState } from 'react';

interface LiveGWContextType {
  liveGameweekData: { id: number } | null;
  updateLiveGWData: (liveGameweekData: Object) => void;
  eventStatus: {
    status: StatusItem[];
    leagues: string;
  } | null;
  updateOverallData: (overallData: Object) => void;
  overallData: Object | null;
}

interface StatusItem {
  bonus_added: boolean;
  date: string;
  event: number;
  points: string;
}

const LiveGWContext = createContext<LiveGWContextType>({
  liveGameweekData: null,
  updateLiveGWData: () => { },
  eventStatus: null,
  updateOverallData: () => { },
  overallData: null
});

const LiveGWProvider = ({ children }) => {
  const [liveGameweekData, setLiveGameweekData] = useState<{ id: number } | null>(null);
  const [eventStatus, setEventStatus] = useState<{ status: StatusItem[]; leagues: string } | null>(null);
  const [overallData, setOverallData] = useState<Object | null>(null);

  const updateOverallData = async (overallData) => {
    setOverallData(overallData);
  }

  const updateLiveGWData = async (liveGameweekData) => {
    try {
      const status = await overallService.getStatus();
      setEventStatus(status);
      setLiveGameweekData(liveGameweekData);
    } catch (error) {
      console.error('Error updating live gameweek data:', error);
      // Don't set the data if there's an error
    }
  };

  return (
    <LiveGWContext.Provider value={{ 
      liveGameweekData, 
      updateLiveGWData, 
      eventStatus, 
      updateOverallData, 
      overallData 
    }}>
      {children}
    </LiveGWContext.Provider>
  );
};

export { LiveGWContext, LiveGWProvider };