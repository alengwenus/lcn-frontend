import { createContext } from "@lit-labs/context";
import { LcnDeviceConfig, LcnEntityConfig } from "types/lcn";

export const deviceConfigsContext =
  createContext<LcnDeviceConfig[]>("deviceConfigs");
export const entityConfigsContext =
  createContext<LcnEntityConfig[]>("entityConfigs");
