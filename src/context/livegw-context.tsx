// Create a Context
// context.js
import { overallService } from '@/services/fpl-api';
import { createContext, useState } from 'react';

interface LiveGWContextType {
  liveGameweekData: { id: number };
  updateLiveGWData: (liveGameweekData: Object) => void;
  eventStatus: {
    status: StatusItem[]; // Array of status items
    leagues: string;
  };
  updateOverallData: (overallData: Object) => void;
  overallData: Object;
}

interface StatusItem {
  bonus_added: boolean; // Whether bonus points have been added
  date: string; // Date in the format "YYYY-MM-DD"
  event: number; // Gameweek or event number
  points: string; // Points scored or status
}

const LiveGWContext = createContext<LiveGWContextType>({
  liveGameweekData: null,
  updateLiveGWData: () => { },
  eventStatus: null,
  updateOverallData: () => { },
  overallData: null
});

const LiveGWProvider = ({ children }) => {
  const [liveGameweekData, setLiveGameweekData] = useState(null);
  const [eventStatus, setEventStatus] = useState<{ status: StatusItem[]; leagues: string }>({
    status: [{
      bonus_added: false,
      date: (new Date()).toString(),
      event: 1,
      points: ""
    }], 
    leagues: ""
  })
  const [overallData, setOverallData] = useState(null)

  const updateOverallData = async (overallData) => {
    setOverallData(overallData)
  }

  const updateLiveGWData = async (liveGameweekData) => {
    const status = await overallService.getStatus();
    setEventStatus(status)
    setLiveGameweekData(liveGameweekData);
  };

  return (
    <LiveGWContext.Provider value={{ liveGameweekData, updateLiveGWData, eventStatus, updateOverallData, overallData }}>
      {children}
    </LiveGWContext.Provider>
  );
};

export { LiveGWContext, LiveGWProvider };