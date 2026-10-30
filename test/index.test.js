import test from 'node:test';
import assert from 'node:assert/strict';
import { OTTO_ENGINE } from '../src/index.js';

test('engine metadata is initialized', () => {
  assert.equal(OTTO_ENGINE.name.startsWith('otto'), true);
  assert.equal(OTTO_ENGINE.sandboxed, true);
  assert.equal(OTTO_ENGINE.auditable, true);
});
