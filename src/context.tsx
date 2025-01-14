// Create a Context
// context.js
import { createContext, useState, useEffect } from 'react';

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

  // You can potentially store this preference in localStorage
  useEffect(() => {
    const storedTab = localStorage.getItem('activeTab');
    if (storedTab) {
      setActiveTab(storedTab);
    }
  }, []);

  const updateActiveTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  return (
    <TabContext.Provider value={{ activeTab, updateActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export { TabContext, TabProvider };