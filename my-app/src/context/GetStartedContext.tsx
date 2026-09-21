import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "../api/client";

interface GetStartedContextValue {
  isOpen: boolean;
  open: (presetRole?: Role) => void;
  close: () => void;
  presetRole: Role | undefined;
}

const GetStartedContext = createContext<GetStartedContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  presetRole: undefined,
});

export function GetStartedProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetRole, setPresetRole] = useState<Role | undefined>(undefined);

  return (
    <GetStartedContext.Provider
      value={{
        isOpen,
        open: (presetRole?: Role) => {
          setPresetRole(presetRole);
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
        presetRole,
      }}
    >
      {children}
    </GetStartedContext.Provider>
  );
}

export function useGetStarted() {
  return useContext(GetStartedContext);
}