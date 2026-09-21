import { createContext, useContext, useState, type ReactNode } from "react";

interface ServicesContextValue {
  active: string | null;
  open: (id: string | null) => void;
}

const ServicesContext = createContext<ServicesContextValue>({
  active: null,
  open: () => {},
});

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <ServicesContext.Provider value={{ active, open: setActive }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  return useContext(ServicesContext);
}