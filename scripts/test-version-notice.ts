import assert from 'node:assert/strict';
import { acknowledgeVersion, shouldShowVersionNotice, VERSION_NOTICE_KEY } from '../src/services/versionNotice';

const data = new Map<string, string>();
const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
assert.equal(shouldShowVersionNotice('1.0.0', storage), true);
acknowledgeVersion('1.0.0', storage);
assert.equal(data.get(VERSION_NOTICE_KEY), '1.0.0');
assert.equal(shouldShowVersionNotice('1.0.0', storage), false);
assert.equal(shouldShowVersionNotice('1.0.1', storage), true);
assert.equal(shouldShowVersionNotice('2.0.0', storage), true);
const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
assert.equal(shouldShowVersionNotice('1.0.0', blocked), true);
assert.doesNotThrow(() => acknowledgeVersion('1.0.0', blocked));
console.log('Version notice tests passed: first visit, acknowledgement, new releases and unavailable storage.');
