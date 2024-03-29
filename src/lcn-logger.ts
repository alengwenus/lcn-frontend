export class LCNLogger {
  prefix: string;

  constructor(name?: string) {
    if (name) {
      this.prefix = `[lcn.${name}]`;
    } else {
      this.prefix = `[lcn]`;
    }
  }

  public info(...content: any[]): void {
    // eslint-disable-next-line no-console
    console.info(this.prefix, ...content);
  }

  public log(...content: any[]): void {
    // eslint-disable-next-line no-console
    console.log(this.prefix, ...content);
  }

  public debug(...content: any[]): void {
    // eslint-disable-next-line no-console
    console.debug(this.prefix, ...content);
  }

  public warn(...content: any[]): void {
    // eslint-disable-next-line no-console
    console.warn(this.prefix, ...content);
  }

  public error(...content: any[]): void {
    // eslint-disable-next-line no-console
    console.error(this.prefix, ...content);
  }
}
