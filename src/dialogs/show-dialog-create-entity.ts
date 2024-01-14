import { fireEvent } from "@ha/common/dom/fire_event";
import { LCN, LcnEntityConfig, LcnDeviceConfig } from "types/lcn";

export interface LcnEntityDialogParams {
  lcn: LCN;
  device: LcnDeviceConfig;
  createEntity: (values: Partial<LcnEntityConfig>) => Promise<unknown>;
}

export const loadLCNCreateEntityDialog = () => import("./lcn-create-entity-dialog");

export const showLCNCreateEntityDialog = (
  element: HTMLElement,
  lcnEntityParams: LcnEntityDialogParams,
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "lcn-create-entity-dialog",
    dialogImport: loadLCNCreateEntityDialog,
    dialogParams: lcnEntityParams,
  });
};
