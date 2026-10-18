const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

// Load the actual controller with an in-memory User model, without a database.
async function findMatches(favorites, others, threshold) {
  const context = {
    exports: {},
    console: { log() {} },
    require(name) {
      assert.equal(name, '../models/User');
      return { find: async () => others.map((list, index) => ({
        _id: String(index), favorites: list, firstName: 'Test', lastName: 'User', age: 25
      })) };
    }
  };
  runInNewContext(readFileSync(join(__dirname, 'match.controller.js'), 'utf8'), context);
  let result;
  await context.exports.findMatches(
    { query: threshold === undefined ? {} : { threshold }, user: { _id: 'me', favorites } },
    { json(value) { result = JSON.parse(JSON.stringify(value)); } }
  );
  return result;
}

const range = count => Array.from({ length: count }, (_, index) => index + 1);

test('excludes an exact 75% match', async () => {
  assert.deepEqual(await findMatches([1, 2, 3, 4], [[1, 2, 3]]), []);
});

test('excludes a score below 75% even when it rounds to 75', async () => {
  assert.deepEqual(await findMatches(range(99), [range(74)]), []);
});

test('includes a score just above 75% and preserves its precision', async () => {
  const result = await findMatches(range(101), [range(76)]);
  assert.equal(result.length, 1);
  assert.equal(result[0].score, 76 / 101 * 100);
});

test('does not let a query parameter lower the required threshold', async () => {
  assert.deepEqual(await findMatches([1, 2, 3, 4], [[1, 2, 3]], '50'), []);
});

test('applies higher thresholds strictly on the exact score', async () => {
  const result = await findMatches(range(101), [range(76), range(101)], '75.2');
  assert.deepEqual(result.map(match => match.user.id), ['1', '0']);
  assert.deepEqual(await findMatches(range(5), [range(4)], '80'), []);
});

test('returns no matches for empty favorites and includes a perfect match', async () => {
  assert.deepEqual(await findMatches([], [[1]]), []);
  assert.deepEqual(await findMatches([1], [[]]), []);
  const result = await findMatches([1, 2], [[1, 2]]);
  assert.equal(result[0].score, 100);
});
