"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_ENVIRONMENT,
  getEnvironmentPreset,
  type BridgeEnvironment,
  type BridgeEnvironmentConfig,
} from "../lib/constants";
import { solanaBridge } from "../lib/bridge";

interface NetworkContextValue {
  environment: BridgeEnvironment;
  config: BridgeEnvironmentConfig;
  setEnvironment: (env: BridgeEnvironment) => void;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [environment, setEnvironment] = useState<BridgeEnvironment>(DEFAULT_ENVIRONMENT);

  const config = useMemo(() => getEnvironmentPreset(environment), [environment]);

  useEffect(() => {
    solanaBridge.setEnvironment(environment);
  }, [environment]);

  const value = useMemo(
    () => ({
      environment,
      config,
      setEnvironment,
    }),
    [environment, config]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextValue => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

