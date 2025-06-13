import { createContext } from "@lit/context";
import type { LcnDeviceConfig, LcnEntityConfig } from "types/lcn";

export const deviceConfigsContext = createContext<LcnDeviceConfig[]>("deviceConfigs");
export const entityConfigsContext = createContext<LcnEntityConfig[]>("entityConfigs");
