import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DrillDownFilter = {
  field: string;
  value: string | number | boolean;
  label: string;
};

type DrillDownContextValue = {
  activeFilter: DrillDownFilter | null;
  setFilter: (filter: DrillDownFilter | null) => void;
  clearFilter: () => void;
  isFiltered: boolean;
};

const DrillDownContext = createContext<DrillDownContextValue | null>(null);

type DrillDownProviderProps = {
  children: ReactNode;
};

// Provides drill-down filter state to stat cards and data tables on the same page.
// Clicking a stat card sets the active filter; tables consume it to show a subset.
export const DrillDownProvider = ({ children }: DrillDownProviderProps) => {
  const [activeFilter, setActiveFilter] = useState<DrillDownFilter | null>(null);

  const setFilter = useCallback((filter: DrillDownFilter | null) => {
    setActiveFilter(filter);
  }, []);

  const clearFilter = useCallback(() => {
    setActiveFilter(null);
  }, []);

  return (
    <DrillDownContext.Provider
      value={{ activeFilter, setFilter, clearFilter, isFiltered: activeFilter !== null }}
    >
      {children}
    </DrillDownContext.Provider>
  );
};

export const useDrillDown = (): DrillDownContextValue => {
  const context = useContext(DrillDownContext);
  if (context === null) {
    throw new Error('useDrillDown must be used within a DrillDownProvider');
  }
  return context;
};
