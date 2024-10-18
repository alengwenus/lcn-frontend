import type { HomeAssistant } from "@ha/types";
import {
  LCN,
  fetchDevices,
  fetchEntities,
  LcnConfig,
  LcnEntityConfig,
  addDevice,
  addEntity,
} from "types/lcn";
import { fileDownload } from "@ha/util/file_download";

export function openFileDialog(): Promise<File> {
  return new Promise<File>((resolve, _reject) => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (ev: Event) => {
      const file: File = (ev.target as HTMLInputElement).files![0];
      resolve(file);
    };
    input.click();
  });
}

async function readConfigFile(file: File): Promise<LcnConfig> {
  return new Promise<LcnConfig>((resolve, _reject) => {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (_event) => {
      const json: LcnConfig = JSON.parse(reader.result!.toString());
      resolve(json);
    };
  });
}

export async function exportConfig(hass: HomeAssistant, lcn: LCN) {
  lcn.log.debug("Exporting config");
  const config: LcnConfig = { devices: [], entities: [] };
  config.devices = await fetchDevices(hass!, lcn.config_entry);
  for await (const device of config.devices) {
    const device_entities: LcnEntityConfig[] = await fetchEntities(
      hass!,
      lcn.config_entry,
      device.address,
    );
    config.entities.push(...device_entities);
  }
  const jsonData = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  fileDownload(url, "lcn_config.json");
  lcn.log.debug(`Exported ${config.devices.length} devices`);
  lcn.log.debug(`Exported ${config.entities.length} entities`);
}

export async function importConfig(hass: HomeAssistant, lcn: LCN) {
  lcn.log.debug("Importing configuration");
  const file: File = await openFileDialog();
  const config: LcnConfig = await readConfigFile(file);

  for await (const device of config.devices) {
    await addDevice(hass, lcn.config_entry, device);
  }
  lcn.log.debug(`Imported ${config.devices.length} devices`);

  for await (const entity of config.entities) {
    await addEntity(hass, lcn.config_entry, entity);
  }
  lcn.log.debug(`Imported ${config.entities.length} entities`);
}
