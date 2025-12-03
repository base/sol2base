"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AVAILABLE_ENVIRONMENTS,
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
  const initialEnvironment =
    (AVAILABLE_ENVIRONMENTS.includes(DEFAULT_ENVIRONMENT)
      ? DEFAULT_ENVIRONMENT
      : AVAILABLE_ENVIRONMENTS[0]) ?? DEFAULT_ENVIRONMENT;
  const [environment, setEnvironmentState] = useState<BridgeEnvironment>(initialEnvironment);

  const config = useMemo(() => getEnvironmentPreset(environment), [environment]);
  const setEnvironment = useCallback(
    (env: BridgeEnvironment) => {
      if (!AVAILABLE_ENVIRONMENTS.includes(env)) {
        console.warn(`[terminally-onchain] attempted to set disabled environment: ${env}`);
        return;
      }
      setEnvironmentState(env);
    },
    []
  );

  useEffect(() => {
    solanaBridge.setEnvironment(environment);
  }, [environment]);

  const value = useMemo(
    () => ({
      environment,
      config,
      setEnvironment,
    }),
    [environment, config, setEnvironment]
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

