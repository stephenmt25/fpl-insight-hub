// Create a Context
// context.js
import { createContext, useState } from 'react';

interface TabContextType {
  activeTab: string;
  updateActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabContextType>({
  activeTab: 'table', 
  updateActiveTab: () => {}, 
});

const TabProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('table');

  const updateActiveTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <TabContext.Provider value={{ activeTab, updateActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export { TabContext, TabProvider };