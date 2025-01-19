// Create a Context
// context.js
import { createContext, useState } from 'react';

interface LiveGWContextType {
  liveGameweekData: {id: number};
  updateLiveGWData: (liveGameweekData: Object) => void;
}

const LiveGWContext = createContext<LiveGWContextType>({
  liveGameweekData: null, 
  updateLiveGWData: () => {}, 
});

const LiveGWProvider = ({ children }) => {
  const [liveGameweekData, setLiveGameweekData] = useState(null);

  const updateLiveGWData = (liveGameweekData) => {
    setLiveGameweekData(liveGameweekData);
  };

  return (
    <LiveGWContext.Provider value={{ liveGameweekData, updateLiveGWData }}>
      {children}
    </LiveGWContext.Provider>
  );
};

export { LiveGWContext, LiveGWProvider };