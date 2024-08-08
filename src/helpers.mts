import * as os from 'os';
export function getIpAddress(): string | undefined {
  if (typeof process === 'object') {
    try {
      let ipv6: string | undefined = undefined;
      let ipv4: string | undefined = undefined;
      const ifaces = os.networkInterfaces();
      if (ifaces === undefined) return undefined;
      for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]!) {
          if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
            if (iface.family === 'IPv4') {
              ipv4 = iface.address;
            } else {
              ipv6 = iface.address;
            }
          }
        }
      }
      return ipv4 ?? ipv6;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // os module is not available
    }
  }
  return undefined;
}
