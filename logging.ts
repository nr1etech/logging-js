import {default as pino, Bindings, Logger} from 'pino';

let getIpAddress: () => string | undefined;
if (typeof require === 'function') {
  const {networkInterfaces} = require('os');
  getIpAddress = (): string | undefined => {
    const ifaces = networkInterfaces();
    let ipv6: string | undefined = undefined;
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          if (iface.family === 'IPv4') {
            return iface.address;
          } else {
            ipv6 = iface.address;
          }
        }
      }
    }
    return ipv6;
  };
} else {
  getIpAddress = () => undefined; // Fallback function for browser
}

let getProcessId: () => number | undefined;
if (typeof require === 'function') {
  getProcessId = (): number | undefined => {
    return process.pid;
  };
} else {
  getProcessId = () => undefined; // Fallback function for browser
}

const ip = getIpAddress();
const pid = getProcessId();
let root: Logger | undefined = undefined;

export type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export function initialize(svc: string, name?: string): Logger {
  root = pino({
    level: 'trace',
    mixin: () => {
      return {svc, name: name ?? 'root', ip, pid};
    },
    formatters: {
      bindings: (bindings: Bindings) => {
        return {host: bindings.hostname};
      },
    },
  });
  return root;
}

export function getRootLogger(): Logger {
  if (!root) throw new Error('Logger has not been initialized');
  return root;
}

export function getLogger(name: string, level?: Level): Logger {
  if (!root) throw new Error('Logger has not been initialized');
  return root.child({name, level: level ?? root.level});
}
