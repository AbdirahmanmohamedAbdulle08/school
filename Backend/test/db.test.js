const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMongoConnectionTargets, shouldUseInMemoryFallback } = require('../src/db');

test('keeps the configured Atlas URI as the first connection target', () => {
  const targets = buildMongoConnectionTargets({
    MONGO_URI: 'mongodb+srv://example:test@cluster.example.mongodb.net/machad',
    NODE_ENV: 'development',
  });

  assert.deepStrictEqual(targets[0], 'mongodb+srv://example:test@cluster.example.mongodb.net/machad');
});

test('adds local and in-memory targets for local development when no explicit override is set', () => {
  const targets = buildMongoConnectionTargets({
    NODE_ENV: 'development',
    USE_IN_MEMORY_DB: 'true',
  });

  assert.ok(targets.includes('mongodb://127.0.0.1:27017/machad'));
  assert.ok(targets.includes('__memory__'));
});

test('disables in-memory fallback for production', () => {
  assert.strictEqual(shouldUseInMemoryFallback({ NODE_ENV: 'production' }), false);
});
