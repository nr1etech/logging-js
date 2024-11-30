import {expect, test} from 'vitest';
import * as logging from './index.mjs';
import {Writable} from 'stream';
import {getIpAddress, newLogger} from './index.mjs';

class TestStream extends Writable {
  last: string | undefined;
  _write(
    /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
    chunk: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    encoding?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback?: (error?: Error | undefined) => void,
  ) {
    this.last = chunk.toString();
  }

  json(): object | undefined {
    if (this.last === undefined) return undefined;
    const obj = JSON.parse(this.last);
    this.last = undefined;
    return obj;
  }

  text(): string | undefined {
    return this.last;
  }
}

// Doing naughty stuff, look the other way
const stream = new TestStream();
const original = process.stdout.write.bind(process.stdout);
process.stdout.write = (
  chunk: string | Uint8Array,
  encodingOrCallback?: BufferEncoding | ((err?: Error | undefined) => void),
  callback?: (err?: Error | undefined) => void,
) => {
  let encoding: BufferEncoding | undefined;
  if (typeof encodingOrCallback === 'string') {
    encoding = encodingOrCallback;
  } else if (typeof encodingOrCallback === 'function') {
    callback = encodingOrCallback;
  }
  stream._write(chunk, encoding, callback);
  return original(chunk, encodingOrCallback as BufferEncoding, callback);
};

class TestClass {
  constructor(
    public foo: string,
    public bar: number,
  ) {}
}

test('Test isInitialized', () => {
  expect(logging.isInitialized()).toBeFalsy();
});

test('Test logging', async () => {
  logging.initialize({
    level: 'trace',
    svc: 'logging-js',
    override: true,
    includePid: true,
    includeHost: true,
    ip: getIpAddress(),
  });
  expect(logging.isInitialized()).toBeTruthy();
  const root = logging.getRootLogger();
  expect(root).toBeDefined();
  const child = logging.newLogger('child');
  child.trace().msg('test trace');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 10,
      time: expect.any(Number),
      name: 'child',
      svc: 'logging-js',
      ip: expect.any(String),
      pid: expect.any(Number),
      msg: 'test trace',
    }),
  );
  child
    .trace()
    .obj('bar', {foo: 'bar', something: 'something'})
    .msg('test trace');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 10,
      time: expect.any(Number),
      name: 'child',
      svc: 'logging-js',
      ip: expect.any(String),
      pid: expect.any(Number),
      host: expect.any(String),
      msg: 'test trace',
      bar: {
        foo: 'bar',
        something: 'something',
      },
    }),
  );
  child.debug().obj('moo', {foo: 'bar'}).msg('test debug');
  child.info().obj('moo', {foo: 'bar'}).msg('test info');
  child.warn().obj('moo', {foo: 'bar'}).msg('test warn');
  child.error().obj('moo', {foo: 'bar'}).msg('test error');
  child.debug().obj('moo', new TestClass('foo', 42)).msg('test object');
  try {
    throw new Error('I am an error');
  } catch (err) {
    child.error().err(err).msg('test error');
  }
  child.info().msg('This completes our %s', 'test');
  child.fatal().obj('moo', {foo: 'bar'}).msg('test fatal');
});

test('Test logging levels', () => {
  logging.initialize({
    level: 'trace',
    svc: 'logging-js',
    override: true,
  });
  expect(logging.isLevel('trace')).toBe(true);
  expect(logging.isLevel('debug')).toBe(true);
  expect(logging.isLevel('info')).toBe(true);
  expect(logging.isLevel('warn')).toBe(true);
  expect(logging.isLevel('error')).toBe(true);
  expect(logging.isLevel('fatal')).toBe(true);
  expect(logging.isLevel('foo')).toBe(false);
  const rootLogger = logging.getRootLogger();
  console.log(rootLogger);
  rootLogger.level('trace');
  expect(rootLogger.isTrace()).toBe(true);
  expect(rootLogger.getLevel()).toBe('trace');
  rootLogger.level('debug');
  expect(rootLogger.isDebug()).toBe(true);
  expect(rootLogger.getLevel()).toBe('debug');
  rootLogger.level('info');
  expect(rootLogger.isInfo()).toBe(true);
  expect(rootLogger.getLevel()).toBe('info');
  rootLogger.level('warn');
  expect(rootLogger.isWarn()).toBe(true);
  expect(rootLogger.getLevel()).toBe('warn');
  rootLogger.level('error');
  expect(rootLogger.isError()).toBe(true);
  expect(rootLogger.getLevel()).toBe('error');
  rootLogger.level('fatal');
  expect(rootLogger.isFatal()).toBe(true);
  expect(rootLogger.getLevel()).toBe('fatal');
  rootLogger.level('silent');
  expect(rootLogger.isSilent()).toBe(true);
  expect(rootLogger.getLevel()).toBe('silent');
});

test('Test lazy initialization', () => {
  logging.shutdown();
  const rootLogger = logging.getRootLogger();
  const childLogger = logging.newLogger('child');
  expect(() => rootLogger.debug().msg('test')).toThrow(
    'Logger has not been initialized',
  );
  expect(() => childLogger.debug().msg('test')).toThrow(
    'Logger has not been initialized',
  );
  logging.initialize({
    level: 'trace',
    svc: 'logging.test',
    override: true,
  });
  rootLogger.trace().msg('test');
  childLogger.trace().msg('test');
});

test('Test ctx methods', () => {
  const rootLogger = logging.initialize({
    level: 'info',
    svc: 'test',
    ctx: {foo: 'bar'},
    override: true,
  });
  rootLogger.ctx({bar: 'baz'});
  expect(rootLogger.getCtx().bar).toEqual('baz');
  const logger = logging.newLogger('child');
  expect(logger.getCtx().bar).toEqual('baz');
});

test('Test local context', () => {
  const log = logging.initialize({
    svc: 'test',
    level: 'info',
    override: true,
  });

  log.thread('test').info().msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 30,
      time: expect.any(Number),
      svc: 'test',
      msg: 'test',
      thread: 'test',
    }),
  );

  log
    .error()
    .err({
      type: 'Error',
      message: 'error occurred',
      stack: 'some stack',
    })
    .msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 50,
      time: expect.any(Number),
      svc: 'test',
      msg: 'test',
      err: {type: 'Object', message: 'error occurred', stack: 'some stack'}, // TODO Object should be "Error"
    }),
  );
});

test("Test null or defined values don't break", () => {
  const log = logging.initialize({
    level: 'info',
    svc: 'test',
    override: true,
  });
  log.info().str('foo', undefined).msg('test');
  expect((stream.json() as {foo?: string}).foo).toBeUndefined();
});

test('Test uppercase level', () => {
  const log = logging.initialize({
    level: 'info',
    svc: 'test',
    override: true,
    logLevelFormat: 'uppercase',
  });
  log.info().str('foo', undefined).msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 'INFO',
      time: expect.any(Number),
      svc: 'test',
      msg: 'test',
    }),
  );
});

test('Test lowercase level', () => {
  const log = logging.initialize({
    level: 'info',
    svc: 'test',
    override: true,
    logLevelFormat: 'lowercase',
  });
  log.info().str('foo', undefined).msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 'info',
      time: expect.any(Number),
      svc: 'test',
      msg: 'test',
    }),
  );
});

test('Test ISO time', () => {
  const log = logging.initialize({
    level: 'info',
    svc: 'test',
    override: true,
    timestampFormat: 'iso',
  });
  log.info().str('foo', undefined).msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 30,
      time: expect.stringContaining('Z'),
      svc: 'test',
      msg: 'test',
    }),
  );
});

test('Test child context', () => {
  const log = logging.initialize({
    level: 'trace',
    svc: 'test',
    override: true,
  });
  log.ctx({foo: 'bar'});
  const child = newLogger('child');
  child.trace().msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({name: 'child', foo: 'bar'}),
  );
  const child2 = child.child('child2').ctx({moo: 'oink'});
  child2.trace().msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({name: 'child2', foo: 'bar', moo: 'oink'}),
  );
  const child3 = child2.child('child3').ctx({meow: 'bark'});
  child3.trace().msg('test');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      name: 'child3',
      foo: 'bar',
      moo: 'oink',
      meow: 'bark',
    }),
  );
});
