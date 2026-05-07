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
  target_value_locked: number;
  unit_of_measurement: string;
}

export interface CoverConfig {
  motor: string;
  positioning_mode: string;
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

export type LcnDomainData =
  | BinarySensorConfig
  | ClimateConfig
  | CoverConfig
  | LightConfig
  | SceneConfig
  | SensorConfig
  | SwitchConfig;

export interface LcnEntityConfig {
  address: LcnAddress;
  name: string;
  domain: string;
  domain_data: LcnDomainData;
}

export interface LcnDeviceConfig {
  address: LcnAddress;
  name: string;
  hardware_serial: number;
  software_serial: number;
  hardware_type: number;
}

export interface LcnConfig {
  devices: Partial<LcnDeviceConfig>[];
  entities: LcnEntityConfig[];
}

export const fetchDevices = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices",
    entry_id: configEntry.entry_id,
  });

export const fetchEntities = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
  address: LcnAddress | undefined = undefined,
): Promise<LcnEntityConfig[]> =>
  hass.callWS({
    type: "lcn/entities",
    entry_id: configEntry.entry_id,
    address: address,
  });

export const scanDevices = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices/scan",
    entry_id: configEntry.entry_id,
  });

export const addEntity = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
  entity: Partial<LcnEntityConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/entities/add",
    entry_id: configEntry.entry_id,
    address: entity.address,
    name: entity.name,
    domain: entity.domain,
    domain_data: entity.domain_data,
  });

export const deleteEntity = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
  entity: LcnEntityConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/entities/delete",
    entry_id: configEntry.entry_id,
    address: entity.address,
    domain: entity.domain,
    domain_data: entity.domain_data,
  });

export const addDevice = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
  device: Partial<LcnDeviceConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/devices/add",
    entry_id: configEntry.entry_id,
    address: device.address,
  });

export const deleteDevice = (
  hass: HomeAssistant,
  configEntry: ConfigEntry,
  device: LcnDeviceConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/devices/delete",
    entry_id: configEntry.entry_id,
    address: device.address,
  });
