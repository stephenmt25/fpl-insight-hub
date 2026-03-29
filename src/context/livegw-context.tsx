import { overallService } from '@/services/fpl-api';
import { Status } from '@/types/fpl';
import { Database } from '@/integrations/supabase/types';
import { createContext, useState, ReactNode } from 'react';

type FplOverallDataRow = Database['public']['Tables']['fploveralldata']['Row'];

interface LiveGWContextType {
  liveGameweekData: FplOverallDataRow | null;
  updateLiveGWData: (liveGameweekData: FplOverallDataRow) => void;
  eventStatus: Status;
  updateOverallData: (overallData: FplOverallDataRow[]) => void;
  overallData: FplOverallDataRow[] | null;
}

const LiveGWContext = createContext<LiveGWContextType>({
  liveGameweekData: null,
  updateLiveGWData: () => { },
  eventStatus: null,
  updateOverallData: () => { },
  overallData: null
});

const LiveGWProvider = ({ children }: { children: ReactNode }) => {
  const [liveGameweekData, setLiveGameweekData] = useState<FplOverallDataRow | null>(null);
  const [eventStatus, setEventStatus] = useState<Status>({
    status: [{
      bonus_added: false,
      date: (new Date()).toString(),
      event: 1,
      points: ""
    }],
    leagues: ""
  })
  const [overallData, setOverallData] = useState<FplOverallDataRow[] | null>(null)

  const updateOverallData = async (overallData: FplOverallDataRow[]) => {
    setOverallData(overallData)
  }

  const updateLiveGWData = async (liveGameweekData: FplOverallDataRow) => {
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
