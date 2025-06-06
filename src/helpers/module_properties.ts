export interface LcnSerial {
  year: number;
  month: number;
  day: number;
  serial?: number;
}

const serialRegExp =
  /(?<year>[A-F0-9]{2}).(?<month>[A-F0-9])(?<day>[A-F0-9]{2})(?<serial>[A-F0-9]{4})?/;

export function parseSerialNumber(serialNumber: number): LcnSerial {
  const result = serialRegExp.exec(serialNumber.toString(16).toUpperCase());
  if (!result) throw new Error("Wrong serial number");

  const isSoftwareSerial = result![4] === undefined;

  return {
    year: Number("0x" + result![1]) + 1990,
    month: Number("0x" + result![2]),
    day: Number("0x" + result![3]),
    serial: isSoftwareSerial ? undefined : Number("0x" + result![4]),
  };
}

export function getHardwareType(hardwareId: number): string | undefined {
  switch (hardwareId) {
    case 1:
      return "LCN-SW1.0";
    case 2:
      return "LCN-SW1.1";
    case 3:
      return "LCN-UP1.0";
    case 4:
      return "LCN-UP2";
    case 5:
      return "LCN-SW2";
    case 6:
      return "LCN-UP-Profi1-Plus";
    case 7:
      return "LCN-DI12";
    case 8:
      return "LCN-HU";
    case 9:
      return "LCN-SH";
    case 10:
      return "LCN-UP2";
    case 11:
      return "LCN-UPP";
    case 12:
      return "LCN-SK";
    case 14:
      return "LCN-LD";
    case 15:
      return "LCN-SH-Plus";
    case 17:
      return "LCN-UPS";
    case 18:
      return "LCN_UPS24V";
    case 19:
      return "LCN-GTM";
    case 20:
      return "LCN-SHS";
    case 21:
      return "LCN-ESD";
    case 22:
      return "LCN-EB2";
    case 23:
      return "LCN-MRS";
    case 24:
      return "LCN-EB11";
    case 25:
      return "LCN-UMR";
    case 26:
      return "LCN-UPU";
    case 27:
      return "LCN-UMR24V";
    case 28:
      return "LCN-SHD";
    case 29:
      return "LCN-SHU";
    case 30:
      return "LCN-SR6";
    case 31:
      return "LCN-UMF";
    case 32:
      return "LCN-WBH";
  }
  return undefined;
}
