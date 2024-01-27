import {default as pino, Bindings, Logger} from 'pino';

/**
 * Distributed tracing details that can be sent to the log context.
 */
export interface Trace {
  id: string;
  parent: string;
  version: string;
  flags: string;
}

/**
 * The log levels supported by this library.
 */
export type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Returns true if the given string is a valid log level.
 *
 * @param level The log level to check.
 */
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

interface TypedError {
  type: string;
  message: string;
  stack: string;
}

function isTypedError(err: unknown): err is TypedError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'message' in err &&
    'stack' in err
  );
}

/**
 * Initializes the root logger.
 *
 * @param options The options for logging initialization.
 */
export function initialize(options?: LoggingOptions): Logger {
  root = pino.pino({
    level: options?.level ?? defaultLevel ?? 'warn',
    browser: {asObject: true},
    serializers: {
      err: (err: unknown) => {
        if (isTypedError(err)) {
          return {type: err.type, msg: err.message, stack: err.stack};
        }
        if (err instanceof Error) {
          return {type: err.name, msg: err.message, stack: err.stack};
        }
        return {type: 'unknown', msg: err, stack: ''};
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
  return root!;
}

/**
 * Returns the root logger.
 */
export function getRootLogger(): Logger {
  if (!root) throw new Error('Logger has not been initialized');
  return root;
}

function createProxiedLogger(name: string, level?: Level): Logger {
  return new Proxy(
    {},
    {
      get: function (target, prop) {
        if (
          typeof prop === 'string' &&
          ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(prop)
        ) {
          return (...args: never[]) => {
            if (!root) throw new Error('Logger has not been initialized');
            const realLogger = root.child({name, level: level ?? root.level});
            const method = realLogger[prop as keyof typeof realLogger];
            if (typeof method === 'function') {
              return method.bind(realLogger)(...args);
            }
            throw new Error(`Property ${prop} is not a function`);
          };
        }
        return undefined;
      },
    }
  ) as Logger;
}

/**
 * Returns a child logger with the given name and level.
 *
 * @param name The name of the child logger
 * @param level The level of the child logger. If not provided, the level of the root logger is used.
 */
export function getLogger(name: string, level?: Level): Logger {
  return !root
    ? createProxiedLogger(name, level)
    : root.child({name, level: level ?? root.level});
}
