import { fireEvent } from "@ha/common/dom/fire_event";
import { LCN, LcnDeviceConfig, LcnEntityConfig } from "types/lcn";

export interface LcnEntityDialogParams {
  lcn: LCN,
  device: LcnDeviceConfig,
  entity: LcnEntityConfig,
  editEntity: (values: Partial<LcnEntityConfig>) => Promise<unknown>;
}

export const loadLCNEditEntityDialog = () =>
  import("./lcn-edit-entity-dialog");

export const showLCNEditEntityDialog = (
  element: HTMLElement,
  lcnEntityParams: LcnEntityDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "lcn-edit-entity-dialog",
    dialogImport: loadLCNEditEntityDialog,
    dialogParams: lcnEntityParams,
  });
};
