import {getLogger, getRootLogger} from './logging';

test('Test Logging', () => {
  const root = getRootLogger('logging.test.ts');
  root.trace({foo: 'bar', oink: 'moo'}, 'hello world1');
  root.debug({foo: 'bar'}, 'hello world2');
  root.info({foo: 'bar'}, 'hello world3');
  root.warn({foo: 'bar'}, 'hello world4');
  root.error({foo: 'bar'}, 'hello world5');
  root.fatal({foo: 'bar'}, 'hello world6');
  const child = getLogger('child');
  child.trace({foo: 'bar', oink: 'moo'}, 'hello world7');
  child.debug({foo: 'bar'}, 'hello world8');
  child.info({foo: 'bar'}, 'hello world9');
  child.warn({foo: 'bar'}, 'hello world10');
  child.error({foo: 'bar'}, 'hello world11');
  child.fatal({foo: 'bar'}, 'hello world12');
});
