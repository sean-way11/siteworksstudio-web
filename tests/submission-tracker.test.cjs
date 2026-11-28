const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'brief.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'config.js'), 'utf8'), sandbox);
vm.runInNewContext(source, sandbox);

let next = 0;
const tracker = sandbox.createSubmissionTracker(() => `id-${++next}`);

assert.equal(tracker.idFor('brief A'), 'id-1');
assert.equal(tracker.idFor('brief A'), 'id-1', 'retry must reuse the same request ID');
assert.equal(tracker.idFor('brief B'), 'id-2', 'edited brief must get a new request ID');
tracker.reset();
assert.equal(tracker.idFor('brief B'), 'id-3', 'new brief after success must get a new request ID');

console.log('Submission tracker: retry, edit, and new brief passed');

const brief = { name: 'T', service: 'custom', business: 'Hh', goal: 'Продавать товары', contact: '@test_user' };
assert.match(sandbox.validateBrief(brief).name, /минимум 2/);
brief.name = 'Тим';
assert.equal(Object.keys(sandbox.validateBrief(brief)).length, 0);
brief.contact = '@t';
assert.ok(sandbox.validateBrief(brief).contact);
assert.match(sandbox.submissionErrorMessage(400), /Проверьте данные/);
assert.match(sandbox.submissionErrorMessage(429), /Слишком много/);
assert.match(sandbox.submissionErrorMessage(503), /Попробуйте ещё раз/);
console.log('Brief validation: screenshot regression and error messages passed');
