import * as logging from './logging';

test('Test Logging', () => {
  logging.initialize({
    level: 'trace',
    svc: 'logging-js',
  });
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
