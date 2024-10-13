import type { HomeAssistant } from "@ha/types";
import type { ConfigEntry } from "@ha/data/config_entries";
import type { LCNLogger } from "lcn-logger";

export interface LCN {
  language: string;
  localize(string: string, replace?: Record<string, any>): string;
  log: LCNLogger;
  config_entry: ConfigEntry;
}

export type LcnAddress = [number, number, boolean];

export interface BinarySensorConfig {
  source: string;
}

export interface ClimateConfig {
  source: string;
  setpoint: string;
  max_temp: number;
  min_temp: number;
  lockable: boolean;
  unit_of_measurement: string;
}

export interface CoverConfig {
  motor: string;
  reverse_time: string;
}

export interface LightConfig {
  output: string;
  dimmable: boolean;
  transition: number;
}

export interface SceneConfig {
  register: number;
  scene: number;
  outputs: string[];
  transition: number;
}

export interface SensorConfig {
  source: string;
  unit_of_measurement: string;
}

export interface SwitchConfig {
  output: string;
}

export interface LcnEntityConfig {
  address: LcnAddress;
  name: string;
  domain: string;
  resource: string;
  domain_data:
    | BinarySensorConfig
    | ClimateConfig
    | CoverConfig
    | LightConfig
    | SceneConfig
    | SensorConfig
    | SwitchConfig;
}

export interface LcnDeviceConfig {
  address: LcnAddress;
  name: string;
  hardware_serial: number;
  software_serial: number;
  hardware_type: number;
}

export const fetchDevices = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices",
    entry_id: config_entry.entry_id,
  });

export const fetchEntities = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
  address: LcnAddress | undefined = undefined,
): Promise<LcnEntityConfig[]> =>
  hass.callWS({
    type: "lcn/entities",
    entry_id: config_entry.entry_id,
    address: address,
  });

export const scanDevices = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices/scan",
    entry_id: config_entry.entry_id,
  });

export const addEntity = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
  entity: Partial<LcnEntityConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/entities/add",
    entry_id: config_entry.entry_id,
    address: entity.address,
    name: entity.name,
    domain: entity.domain,
    domain_data: entity.domain_data,
  });

export const deleteEntity = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
  entity: LcnEntityConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/entities/delete",
    entry_id: config_entry.entry_id,
    address: entity.address,
    domain: entity.domain,
    resource: entity.resource,
  });

export const addDevice = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
  device: Partial<LcnDeviceConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/devices/add",
    entry_id: config_entry.entry_id,
    address: device.address,
  });

export const deleteDevice = (
  hass: HomeAssistant,
  config_entry: ConfigEntry,
  device: LcnDeviceConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/devices/delete",
    entry_id: config_entry.entry_id,
    address: device.address,
  });
