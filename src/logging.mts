import {
  default as pino,
  Bindings,
  Logger as PLogger,
  TransportSingleOptions,
  TransportPipelineOptions,
  TransportMultiOptions,
} from 'pino';

/**
 * The log levels supported by this library.
 */
export type LogLevel =
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
export function isLevel(level: string): level is LogLevel {
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

/**
 * Represents a log entry.
 */
export interface Entry {
  str: (key: string, value: string | undefined | null) => Entry;
  num: (key: string, value: number | undefined | null) => Entry;
  bool: (key: string, value: boolean | undefined | null) => Entry;
  obj: (
    key: string,
    value: Record<string, unknown> | object | undefined | null,
  ) => Entry;
  unknown: (key: string, value: unknown) => Entry;
  err: (err: unknown) => Entry;
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
  public readonly svc: string;
  public readonly name: string | undefined;
  protected log: PLogger;
  protected entryCtx: Context;
  protected entry: Entry;
  protected entryLevel:
    | ((ctx: Context, msg?: string, ...args: string[]) => void)
    | undefined;

  constructor(log: PLogger, svc: string, name?: string) {
    this.svc = svc;
    this.name = name;
    this.log = log;
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
    };
  }

  protected str(key: string, value: string | undefined | null): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected num(key: string, value: number | undefined | null): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected bool(key: string, value: boolean | undefined | null): Entry {
    this.entryCtx[key] = value;
    return this.entry;
  }

  protected obj(
    key: string,
    value: object | Record<string, unknown> | undefined | null,
  ): Entry {
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
    } else {
      this.entryCtx['err'] = err;
    }
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

  thread(thread: string | null | undefined): Logger {
    if (thread) {
      this.log.setBindings({thread});
    }
    return this;
  }

  pid(pid: number | null | undefined): Logger {
    if (pid) {
      this.log.setBindings({pid});
    }
    return this;
  }

  host(host: string | null | undefined): Logger {
    if (host) {
      this.log.setBindings({host});
    }
    return this;
  }

  ip(ip: string | null | undefined): Logger {
    if (ip) {
      this.log.setBindings({ip});
    }
    return this;
  }

  cip(cip: string | null | undefined): Logger {
    if (cip) {
      this.log.setBindings({cip});
    }
    return this;
  }

  dtrace(dt: DistributedTraceContext | null | undefined): Logger {
    if (dt) {
      this.log.setBindings({dt});
    }
    return this;
  }

  rid(rid: string | null | undefined): Logger {
    if (rid) {
      this.log.setBindings({rid});
    }
    return this;
  }

  child(name: string): Logger {
    return new Logger(this.log.child({}), this.svc, name);
  }

  isTrace(): boolean {
    return this.log.levelVal <= 10;
  }

  trace(): Entry {
    this.entryLevel = this.log.trace;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isDebug(): boolean {
    return this.log.levelVal <= 20;
  }

  debug(): Entry {
    this.entryLevel = this.log.debug;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isInfo(): boolean {
    return this.log.levelVal <= 30;
  }

  info(): Entry {
    this.entryLevel = this.log.info;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isWarn(): boolean {
    return this.log.levelVal <= 40;
  }

  warn(): Entry {
    this.entryLevel = this.log.warn;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isError(): boolean {
    return this.log.levelVal <= 50;
  }

  error(): Entry {
    this.entryLevel = this.log.error;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isFatal(): boolean {
    return this.log.levelVal <= 60;
  }

  fatal(): Entry {
    this.entryLevel = this.log.fatal;
    this.entry.str('name', this.name);
    return this.entry;
  }

  isSilent(): boolean {
    return this.log.levelVal === Infinity;
  }

  silent(): Entry {
    this.entryLevel = this.log.silent;
    this.entry.str('name', this.name);
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
  level(level: LogLevel): Logger {
    this.log.level = level;
    return this;
  }

  /**
   * Returns the current log level.
   */
  getLevel(): LogLevel {
    return this.log.level as LogLevel;
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

export type LogLevelFormat = 'numeric' | 'lowercase' | 'uppercase';

export type TimestampFormat = 'epoch' | 'iso' | 'unix';

/**
 * Options for logging initialization.
 */
export interface LoggingConfig {
  /**
   * The name of the service.
   */
  svc: string;

  /**
   * The name of the logger. If not provided 'root' is used.
   */
  name?: string;

  /**
   * The default log level. If not provided, the environment variable LOGGING_LEVEL is used and if not found 'warn' is used.
   */
  level?: LogLevel;

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

  /**
   * If true, the logger will be reinitialized even if it has already been initialized.
   */
  override?: boolean;

  /**
   * If true, the logger will include the process id in the log context. Default is false.
   */
  includePid?: boolean;

  /**
   * The ip address to include in the log context. Use the getIpAddress function to get the ip address.
   */
  ip?: string;

  /**
   * If true, the logger will include the name of the host in the log context. Default is false.
   */
  includeHost?: boolean;

  /**
   * The format to output the log level with. Default is "numeric" following the standard.
   */
  logLevelFormat?: LogLevelFormat;

  /**
   * The format to output the timestamp with. Default is "epoch" following the standard.
   */
  timestampFormat?: TimestampFormat;

  /**
   * The timestamp label to use. Default is "time" following the standard.
   */
  timestampLabel?: string;
}

let root: Logger | undefined = undefined;

/**
 * Initializes the logger. This function should be called once at the beginning of the application.
 *
 * @param options the logging configuration
 */
export function initialize(options: LoggingConfig): Logger {
  if (root === undefined || options.override) {
    const mixins: Record<string, string | number> = {};
    if (options.ip) {
      mixins.ip = options.ip;
    }
    const svc = options.svc;
    const plog = pino.pino({
      level: options?.level ?? getDefaultLogLevel() ?? 'info',
      browser: {asObject: true},
      serializers: {},
      mixin: () => {
        return {
          svc,
          ...mixins,
        };
      },
      transport: options?.transport,
      timestamp() {
        if (options.timestampFormat === 'unix') {
          return `,"${options.timestampLabel ?? 'time'}":${Math.round(Date.now() / 1000.0)}`;
        } else if (options.timestampFormat === 'iso') {
          return `,"${options.timestampLabel ?? 'time'}":"${new Date(Date.now()).toISOString()}"`;
        } else {
          return `,"${options.timestampLabel ?? 'time'}":${Date.now()}`;
        }
      },
      formatters: {
        ...(options.logLevelFormat === 'uppercase'
          ? {
              level(label) {
                return {level: label.toUpperCase()};
              },
            }
          : {}),
        ...(options.logLevelFormat === 'lowercase'
          ? {
              level(label) {
                return {level: label};
              },
            }
          : {}),
        bindings: (bindings: Bindings) => {
          if (!options.includeHost) {
            delete bindings.hostname;
          } else {
            bindings = {
              ...bindings,
              host: bindings.hostname,
            };
            delete bindings.hostname;
          }
          if (!options.includePid) {
            delete bindings.pid;
          }
          return bindings;
        },
      },
    });
    if (options.ctx) {
      plog.setBindings(options.ctx);
    }
    root = new Logger(plog, svc, options.name ?? 'root');
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
          [
            'trace',
            'debug',
            'info',
            'warn',
            'error',
            'fatal',
            'level',
            'thread',
            'pid',
            'host',
            'ip',
            'cip',
            'dtrace',
            'rid',
            'child',
          ].includes(prop)
        ) {
          return (...args: never[]) => {
            if (!root) throw new Error('Logger has not been initialized');
            const method = root[prop as keyof typeof root];
            if (typeof method === 'function') {
              // @ts-expect-error - TS doesn't like the bind call
              return method.bind(root)(...args);
            }
            throw new Error(`Property ${prop} is not a function`);
          };
        }
        return undefined;
      },
    },
  ) as Logger;
}

function createProxiedLogger(name?: string, log?: Logger): Logger {
  return new Proxy(
    {},
    {
      get: function (target, prop) {
        if (
          typeof prop === 'string' &&
          [
            'trace',
            'debug',
            'info',
            'warn',
            'error',
            'fatal',
            'level',
            'thread',
            'pid',
            'host',
            'ip',
            'cip',
            'dtrace',
            'rid',
            'child',
          ].includes(prop)
        ) {
          return (...args: never[]) => {
            if (!root) throw new Error('Logger has not been initialized');
            const realLogger = log
              ? new Logger(log.pino().child({name}), log.svc, name)
              : new Logger(root.pino().child({name}), root.svc, name);
            const method = realLogger[prop as keyof typeof realLogger];
            if (typeof method === 'function') {
              // @ts-expect-error - TS doesn't like the bind call
              return method.bind(realLogger)(...args);
            }
            throw new Error(`Property ${prop} is not a function`);
          };
        }
        return undefined;
      },
    },
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
 * Returns a child logger from the root logger.
 *
 * @param name the name of the child logger
 */
export function newLogger(name: string): Logger {
  if (root) {
    return new Logger(root.pino().child({}), root.svc, name);
  }
  return createProxiedLogger(name);
}
