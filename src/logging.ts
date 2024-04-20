import {
  default as pino,
  Bindings,
  Logger as PLogger,
  TransportSingleOptions,
  TransportPipelineOptions,
  TransportMultiOptions,
} from 'pino';
import {getIpAddress, getProcessId, isAwsLambda} from './helpers.js';

/**
 * The log levels supported by this library.
 */
export type Level =
  | 'silent'
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'fatal';

/**
 * Returns true if the given string is a valid log level.
 *
 * @param level The log level to check.
 */
export function isLevel(level: string): level is Level {
  return [
    'silent',
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
  ].includes(level);
}

/**
 * Distributed tracing details that can be sent to the log context.
 */
export interface DistributedTraceContext {
  /**
   * The trace-id header.
   */
  id: string;
  /**
   * The parent-id header.
   */
  parent: string;
  /**
   * The version header.
   */
  version: string;
  /**
   * The trace-flags header
   */
  flags: string;
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
 * Represents a log entry.
 */
export interface Entry {
  str: (key: string, value: string) => Entry;
  num: (key: string, value: number) => Entry;
  bool: (key: string, value: boolean) => Entry;
  obj: (key: string, value: Record<string, unknown> | object) => Entry;
  unknown: (key: string, value: unknown) => Entry;
  err: (err: unknown) => Entry;
  thread: (thread: string) => Entry;
  pid: (pid: number) => Entry;
  host: (host: string) => Entry;
  ip: (ip: string) => Entry;
  cip: (ip: string) => Entry;
  trace: (dt: DistributedTraceContext) => Entry;
  msg: (msg: string, ...args: string[]) => void;
  send: () => void;
}

/**
 * The context that can be sent to the log context.
 */
export type Context = Record<string, unknown>;

/**
 * Wrapper around a pino logger that enforces a logging pattern similar to Zerolog and provides
 * an API that better supports the NR1E logging standard. Instances of this class should not be
 * shared between threads/workers. Instead, create a new child logger for each thread. The logger
 * itself is meant to be passed around as parameters to functions to support the contextual
 * structured logging pattern.
 */
export class Logger {
  protected entryCtx: Context;
  protected entry: Entry;
  protected entryLevel:
    | ((ctx: Context, msg?: string, ...args: string[]) => void)
    | undefined;

  protected str(key: string, value: string): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected num(key: string, value: number): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected bool(key: string, value: boolean): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected obj(key: string, value: object | Record<string, unknown>): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected unknown(key: string, value: unknown): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected err(err: unknown): Entry {
    if (err instanceof Error) {
      this.entryCtx['err'] = {
        type: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (isTypedError(err)) {
      this.entryCtx['err'] = {
        type: err.type,
        message: err.message,
        stack: err.stack,
      };
    } else {
      this.entryCtx['err'] = err;
    }
    return this.entry;
  }

  protected thread(thread: string): Entry {
    this.entryCtx['thread'] = thread;
    return this.entry;
  }

  protected pid(pid: number): Entry {
    this.entryCtx['pid'] = pid;
    return this.entry;
  }

  protected host(host: string): Entry {
    this.entryCtx['host'] = host;
    return this.entry;
  }

  protected ip(ip: string): Entry {
    this.entryCtx['ip'] = ip;
    return this.entry;
  }

  protected cip(ip: string): Entry {
    this.entryCtx['cip'] = ip;
    return this.entry;
  }

  protected dtrace(dt: DistributedTraceContext): Entry {
    this.entryCtx['dt'] = dt;
    return this.entry;
  }

  protected msg(msg: string, ...args: string[]): void {
    const level =
      this.entryLevel?.bind(this.log) ?? this.log.trace.bind(this.log);
    level(this.entryCtx, msg, ...args);
    this.entryCtx = {};
    this.entryLevel = undefined;
  }

  protected send(): void {
    const level = this.entryLevel ?? this.log.trace;
    level(this.entryCtx);
    this.entryCtx = {};
    this.entryLevel = undefined;
  }

  constructor(protected log: PLogger) {
    this.entryCtx = {};
    this.entry = {
      msg: this.msg.bind(this),
      send: this.send.bind(this),
      str: this.str.bind(this),
      num: this.num.bind(this),
      bool: this.bool.bind(this),
      obj: this.obj.bind(this),
      unknown: this.unknown.bind(this),
      err: this.err.bind(this),
      thread: this.thread.bind(this),
      pid: this.pid.bind(this),
      host: this.host.bind(this),
      ip: this.ip.bind(this),
      cip: this.cip.bind(this),
      trace: this.dtrace.bind(this),
    };
  }

  isTrace(): boolean {
    return this.log.levelVal <= 10;
  }

  trace(): Entry {
    this.entryLevel = this.log.trace;
    return this.entry;
  }

  isDebug(): boolean {
    return this.log.levelVal <= 20;
  }

  debug(): Entry {
    this.entryLevel = this.log.debug;
    return this.entry;
  }

  isInfo(): boolean {
    return this.log.levelVal <= 30;
  }

  info(): Entry {
    this.entryLevel = this.log.info;
    return this.entry;
  }

  isWarn(): boolean {
    return this.log.levelVal <= 40;
  }

  warn(): Entry {
    this.entryLevel = this.log.warn;
    return this.entry;
  }

  isError(): boolean {
    return this.log.levelVal <= 50;
  }

  error(): Entry {
    this.entryLevel = this.log.error;
    return this.entry;
  }

  isFatal(): boolean {
    return this.log.levelVal <= 60;
  }

  fatal(): Entry {
    this.entryLevel = this.log.fatal;
    return this.entry;
  }

  /**
   * Returns the inner pino logger if you need to do something that is not supported by this class.
   */
  pino(): PLogger {
    return this.log;
  }

  /**
   * Add context to the logger. Anything added here will be added to every log entry.
   * This does not override any context that was previously added to the logger or any parent logger.
   *
   * @param ctx the context to add
   */
  ctx(ctx: Context): Logger {
    this.log.setBindings(ctx);
    return this;
  }

  /**
   * Returns the current logger context.
   */
  getCtx(): Context {
    return this.log.bindings() as Context;
  }

  /**
   * Overrides the log level for the logger.
   *
   * @param level the log level to set
   */
  level(level: Level): Logger {
    this.log.level = level;
    return this;
  }

  /**
   * Returns the current log level.
   */
  getLevel(): Level {
    return this.log.level as Level;
  }
}

/**
 * Returns the default log level. If the LOGGING_LEVEL environment variable is set, it will be used.
 */
function getDefaultLogLevel(): string | undefined {
  if (typeof process === 'object') {
    const level = process.env.LOGGING_LEVEL;
    if (level && isLevel(level)) return level;
  }
  return undefined;
}

/**
 * Options for logging initialization.
 */
export interface LoggingConfig {
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

  /**
   * The context to add to the logger.
   */
  ctx?: Context;

  /**
   * The pino transport options.
   */
  transport?:
    | TransportSingleOptions
    | TransportMultiOptions
    | TransportPipelineOptions
    | undefined;
}

let root: Logger | undefined;

/**
 * Initializes the logger. This function should be called once at the beginning of the application.
 *
 * @param options the logging configuration
 * @param override if true, the logger will be reinitialized even if it has already been initialized
 */
export async function initialize(
  options: LoggingConfig,
  override?: boolean
): Promise<Logger> {
  if (root === undefined || override) {
    const ip = await getIpAddress();
    const pid = getProcessId();
    const plog = pino({
      level: options?.level ?? getDefaultLogLevel() ?? 'info',
      browser: {asObject: true},
      serializers: {},
      mixin: () => {
        return {
          svc: options?.svc,
          name: options?.name ?? 'root',
          ip,
          pid,
        };
      },
      transport: options?.transport,
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
    root = new Logger(plog);
  }
  return root;
}

/**
 * Returns the root logger if it has been initialized. If not, an error is thrown.
 */
export function isInitialized(): boolean {
  return root !== undefined;
}

/**
 * Shuts down the logger and unsets the root logger.
 */
export function shutdown() {
  if (root) {
    root.pino().flush();
    root = undefined;
  }
}

function getProxiedRootLogger(): Logger {
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
            const method = root[prop as keyof typeof root];
            if (typeof method === 'function') {
              // @ts-ignore
              return method.bind(root)(...args);
            }
            throw new Error(`Property ${prop} is not a function`);
          };
        }
        return undefined;
      },
    }
  ) as Logger;
}

function createProxiedLogger(name: string, log?: Logger): Logger {
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
            const realLogger = log
              ? new Logger(log.pino().child({name}))
              : new Logger(root.pino().child({name}));
            const method = realLogger[prop as keyof typeof realLogger];
            if (typeof method === 'function') {
              // @ts-ignore
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
 * Returns the root logger. If the logger has not been initialized, an error is thrown.
 */
export function getRootLogger(): Logger {
  if (root) return root;
  return getProxiedRootLogger();
}

/**
 * Returns a child logger.
 *
 * @param name the name of the child logger
 * @param log the logger to use. If not provided, the root logger is used.
 */
export function getLogger(name: string, log?: Logger): Logger {
  if (root)
    return log === undefined
      ? new Logger(root.pino().child({name}))
      : new Logger(log.pino().child({name}));
  return createProxiedLogger(name, log);
}
