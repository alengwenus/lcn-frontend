import { HomeAssistant } from "@ha/types";

export interface LcnHost {
  name: string;
  id: string;
  ip_address: string;
  port: number;
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
  domain_data: CoverConfig[] | LightConfig[] | SensorConfig[] | SwitchConfig[];
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

export const fetchDevices = (
  hass: HomeAssistant,
  hostId: string
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/devices",
    host_id: hostId,
  });

export const fetchDevice = (
  hass: HomeAssistant,
  hostId: string,
  address: LcnAddress
): Promise<LcnDeviceConfig> =>
  hass.callWS({
    type: "lcn/device",
    host_id: hostId,
    address: address,
  });

export const fetchEntities = (
  hass: HomeAssistant,
  hostId: string,
  address: LcnAddress
): Promise<LcnEntityConfig[]> =>
  hass.callWS({
    type: "lcn/entities",
    host_id: hostId,
    address: address,
  });

export const scanDevices = (
  hass: HomeAssistant,
  hostId: string
): Promise<LcnDeviceConfig[]> =>
  hass.callWS({
    type: "lcn/device/scan",
    host_id: hostId,
  });

export const addEntity = (
  hass: HomeAssistant,
  hostId: string,
  entity: Partial<LcnEntityConfig>
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/entity/add",
    host_id: hostId,
    address: entity.address,
    name: entity.name,
    domain: entity.domain,
    domain_data: entity.domain_data,
  });

export const deleteEntity = (
  hass: HomeAssistant,
  hostId: string,
  entity: LcnEntityConfig
): Promise<void> =>
  hass.callWS({
    type: "lcn/entity/delete",
    host_id: hostId,
    address: entity.address,
    domain: entity.domain,
    resource: entity.resource,
  });

export const addDevice = (
  hass: HomeAssistant,
  hostId: string,
  device: Partial<LcnDeviceConfig>
): Promise<boolean> =>
  hass.callWS({
    type: "lcn/device/add",
    host_id: hostId,
    address: device.address,
    name: device.name,
  });

export const deleteDevice = (
  hass: HomeAssistant,
  hostId: string,
  device: LcnDeviceConfig
): Promise<void> =>
  hass.callWS({
    type: "lcn/device/delete",
    host_id: hostId,
    address: device.address,
  });

export const createAddressString = (address: LcnAddress): string => {
  // convert address tuple into string (e.g. m000007) for use in url
  const segId = address[0].toString().padStart(3, "0");
  const addrId = address[1].toString().padStart(3, "0");
  const isGroup = address[2] ? "g" : "m";
  return isGroup + segId + addrId;
};

export const parseAddressString = (addressString: string): LcnAddress =>
  // convert address string (e.g. m000007) into address tuple
  [
    +addressString.slice(1, 4),
    +addressString.slice(4, 7),
    addressString[0] === "g",
  ];
