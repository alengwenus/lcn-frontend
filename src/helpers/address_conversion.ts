import type { LcnAddress } from "types/lcn";

export function addressToString(address: LcnAddress): string {
  const result =
    (address[2] ? "g" : "m") +
    address[0].toString().padStart(3, "0") +
    address[1].toString().padStart(3, "0");
  return result;
}

export function stringToAddress(address: string): LcnAddress {
  const isGroup = address.substring(0, 1) === "g";
  const addressId = +address.substring(1, 4);
  const segmentId = +address.substring(4, 7);
  const lcnAddress: LcnAddress = [addressId, segmentId, isGroup];
  return lcnAddress;
}

export function addressToHumanString(address: LcnAddress): string {
  return `S${address[0]} ${address[2] ? "G" : "M"}${address[1]}`;
}
