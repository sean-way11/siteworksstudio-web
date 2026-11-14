const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'brief.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox);

let next = 0;
const tracker = sandbox.createSubmissionTracker(() => `id-${++next}`);

assert.equal(tracker.idFor('brief A'), 'id-1');
assert.equal(tracker.idFor('brief A'), 'id-1', 'retry must reuse the same request ID');
assert.equal(tracker.idFor('brief B'), 'id-2', 'edited brief must get a new request ID');
tracker.reset();
assert.equal(tracker.idFor('brief B'), 'id-3', 'new brief after success must get a new request ID');

console.log('Submission tracker: retry, edit, and new brief passed');
