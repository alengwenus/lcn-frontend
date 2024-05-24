import type { HomeAssistant } from "@ha/types";
import type { ConfigEntry } from "@ha/data/config_entries";
import type { LCNLogger } from "lcn-logger";

export interface LCN {
  language: string;
  config_entries: ConfigEntry[];
  localize(string: string, replace?: Record<string, any>): string;
  log: LCNLogger;
  host: LcnHost;
  address: LcnAddress;
}

export interface LcnHost {
  name: string;
  id: string;
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
    | BinarySensorConfig[]
    | ClimateConfig[]
    | CoverConfig[]
    | LightConfig[]
    | SceneConfig[]
    | SensorConfig[]
    | SwitchConfig[];
  entity_id: string;
}

export interface LcnDeviceConfig {
  address: LcnAddress;
  name: string;
  hardware_serial: number;
  software_serial: number;
  hardware_type: number;
}

export const fetchHosts = (hass: HomeAssistant): Promise<LcnHost[]> =>
  hass.callWS({
    type: "lcn/hosts",
  });

export const fetchDevices = (hass: HomeAssistant, hostId: string): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices",
    host_id: hostId,
  });

export const fetchEntities = (
  hass: HomeAssistant,
  hostId: string,
  address: LcnAddress,
): Promise<LcnEntityConfig[]> =>
  hass.callWS({
    type: "lcn/entities",
    host_id: hostId,
    address: address,
  });

export const scanDevices = (hass: HomeAssistant, hostId: string): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices/scan",
    host_id: hostId,
  });

export const addEntity = (
  hass: HomeAssistant,
  hostId: string,
  entity: Partial<LcnEntityConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/entities/add",
    host_id: hostId,
    address: entity.address,
    name: entity.name,
    domain: entity.domain,
    domain_data: entity.domain_data,
  });

export const deleteEntity = (
  hass: HomeAssistant,
  hostId: string,
  entity: LcnEntityConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/entities/delete",
    host_id: hostId,
    address: entity.address,
    domain: entity.domain,
    resource: entity.resource,
  });

export const addDevice = (
  hass: HomeAssistant,
  hostId: string,
  device: Partial<LcnDeviceConfig>,
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/devices/add",
    host_id: hostId,
    address: device.address,
  });

export const deleteDevice = (
  hass: HomeAssistant,
  hostId: string,
  device: LcnDeviceConfig,
): Promise<void> =>
  hass.callWS({
    type: "lcn/devices/delete",
    host_id: hostId,
    address: device.address,
  });
