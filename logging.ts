import {default as pino, Bindings, Logger} from 'pino';

export type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export function isLevel(level: string): level is Level {
  return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(level);
}

let getIpAddress: () => string | undefined;
if (typeof process === 'object') {
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
if (typeof process === 'object') {
  getProcessId = (): number | undefined => {
    return process.pid;
  };
} else {
  getProcessId = () => undefined; // Fallback function for browser
}

let getDefaultLogLevel: () => string | undefined;
if (typeof process === 'object') {
  getDefaultLogLevel = (): string | undefined => {
    const level = process.env.LOGGING_LEVEL;
    if (level && isLevel(level)) return level;
    return undefined;
  };
} else {
  getDefaultLogLevel = () => undefined; // Fallback function for browser
}

let isAwsLambda = false;
if (typeof process === 'object') {
  isAwsLambda = !!process.env.LAMBDA_TASK_ROOT;
}

const ip = isAwsLambda ? undefined : getIpAddress();
const pid = getProcessId();
const defaultLevel = getDefaultLogLevel();
let root: Logger | undefined = undefined;

/**
 * Options for logging initialization.
 */
export interface LoggingOptions {
  /**
   * The name of the service.
   */
  svc: string;

  /**
   * The name of the root logger. Default is 'root' if not specified.
   */
  name?: string;

  /**
   * The default log level. If not provided, the environment variable LOGGING_LEVEL is used and if not found 'warn' is used.
   */
  level?: Level;
}

export function initialize(options?: LoggingOptions): Logger {
  root = pino({
    level: options?.level ?? defaultLevel ?? 'warn',
    browser: {asObject: true},
    serializers: {
      err: err => {
        return {type: err.type, msg: err.message, stack: err.stack};
      },
    },
    mixin: () => {
      return {
        svc: options?.svc,
        name: options?.name ?? 'root',
        ip,
        pid,
      };
    },
    formatters: {
      bindings: (bindings: Bindings) => {
        if (!isAwsLambda) {
          return {
            host: bindings['hostname'],
          };
        } else {
          return {};
        }
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
