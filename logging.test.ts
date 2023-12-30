import * as logging from './logging';

test('Test Logging', () => {
  logging.initialize('logging-js');
  const child = logging.getLogger('child');
  child.trace({foo: 'bar', something: 'something'}, 'test trace');
  child.debug({foo: 'bar'}, 'test debug');
  child.info({foo: 'bar'}, 'test info');
  child.warn({foo: 'bar'}, 'test warn');
  child.error({foo: 'bar'}, 'test error');
  child.fatal({foo: 'bar'}, 'test fatal');
});
