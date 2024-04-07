import * as logging from './logging.js';

import {Writable} from 'stream';

class TestStream extends Writable {
  last: string | undefined;
  _write(
    chunk: any,
    encoding?: string,
    callback?: (error?: Error | undefined) => void
  ) {
    this.last = chunk.toString();
  }

  json(): object | undefined {
    if (this.last === undefined) return undefined;
    const obj = JSON.parse(this.last);
    this.last = undefined;
    return obj;
  }
}

// Doing naughty stuff, look the other way
const stream = new TestStream();
const original = process.stdout.write.bind(process.stdout);
process.stdout.write = (
  chunk: string | Uint8Array,
  encodingOrCallback?: BufferEncoding | ((err?: Error | undefined) => void),
  callback?: (err?: Error | undefined) => void
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
    public bar: number
  ) {}
}

test('Test Logging', async () => {
  await logging.initialize({
    level: 'trace',
    svc: 'logging-js',
  });
  const root = logging.getRootLogger();
  expect(root).toBeDefined();
  const child = logging.getLogger('child');
  child.trace().msg('test trace');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 10,
      time: expect.any(Number),
      name: 'root',
      svc: 'logging-js',
      ip: expect.any(String),
      pid: expect.any(Number),
      msg: 'test trace',
    })
  );
  child
    .trace()
    .obj('bar', {foo: 'bar', something: 'something'})
    .msg('test trace');
  expect(stream.json()).toEqual(
    expect.objectContaining({
      level: 10,
      time: expect.any(Number),
      name: 'root',
      svc: 'logging-js',
      ip: expect.any(String),
      pid: expect.any(Number),
      msg: 'test trace',
      bar: {
        foo: 'bar',
        something: 'something',
      },
    })
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

test('Test isLevel', () => {
  expect(logging.isLevel('trace')).toBe(true);
  expect(logging.isLevel('debug')).toBe(true);
  expect(logging.isLevel('info')).toBe(true);
  expect(logging.isLevel('warn')).toBe(true);
  expect(logging.isLevel('error')).toBe(true);
  expect(logging.isLevel('fatal')).toBe(true);
  expect(logging.isLevel('foo')).toBe(false);
});

test('Test lazy initialization', async () => {
  logging.shutdown();
  const rootLogger = logging.getRootLogger();
  const childLogger = logging.getLogger('child');
  expect(() => rootLogger.debug().msg('test')).toThrow(
    'Logger has not been initialized'
  );
  expect(() => childLogger.debug().msg('test')).toThrow(
    'Logger has not been initialized'
  );
  await logging.initialize({
    level: 'trace',
    svc: 'logging.test',
  });
  rootLogger.trace().msg('test');
  childLogger.trace().msg('test');
});
