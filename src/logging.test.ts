import * as logging from './logging.js';

test('Test Logging', async () => {
  await logging.initialize({
    level: 'trace',
    svc: 'logging-js',
  });
  const root = logging.getRootLogger();
  expect(root).toBeDefined();
  const child = logging.getLogger('child');
  child.trace('test trace');
  child.trace({foo: 'bar', something: 'something'}, 'test trace');
  child.debug({foo: 'bar'}, 'test debug');
  child.info({foo: 'bar'}, 'test info');
  child.warn({foo: 'bar'}, 'test warn');
  child.error({foo: 'bar'}, 'test error');
  try {
    throw new Error('I am an error');
  } catch (err) {
    child.error({err}, 'test error');
    child.error(err, 'test error');
  }
  child.info('This completes our %s', 'test');
  child.fatal({foo: 'bar'}, 'test fatal');
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
