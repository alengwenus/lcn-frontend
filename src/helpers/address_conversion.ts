import type { LcnAddress } from "types/lcn";

export function addressToString(address: LcnAddress): string {
  const result =
    (address[2] ? "g" : "m") +
    address[0].toString().padStart(3, "0") +
    address[1].toString().padStart(3, "0");
  return result;
}

export function stringToAddress(address_str: string): LcnAddress {
  const is_group = address_str.substring(0, 1) === "g";
  const address_id = +address_str.substring(1, 4);
  const segment_id = +address_str.substring(4, 7);
  const address: LcnAddress = [address_id, segment_id, is_group];
  return address;
}

export function addressToHumanString(address: LcnAddress): string {
  return `S${address[0]} ${address[2] ? "G" : "M"}${address[1]}`;
}
