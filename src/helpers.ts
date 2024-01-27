export function isAwsLambda(): boolean {
  if (typeof process === 'object') {
    return !!process.env.LAMBDA_TASK_ROOT;
  }
  return false;
}

export async function getIpAddress(): Promise<string | undefined> {
  if (typeof process === 'object') {
    let ipv6: string | undefined = undefined;
    let ipv4: string | undefined = undefined;
    const {networkInterfaces} = await import('os');
    const ifaces = networkInterfaces();
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
  }
  return undefined;
}

export function getProcessId(): number | undefined {
  if (typeof process === 'object') {
    return process.pid;
  }
  return undefined;
}
