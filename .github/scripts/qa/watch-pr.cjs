'use strict';
const { spawnSync } = require('node:child_process');

// https://cli.github.com/manual/gh_event_listen
// Preview is opt-in: do not pretend a polling fallback is Event Streams.
const url = process.argv[2];
if (!url || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(url)) {
  console.error('Usage: npm run watch:pr -- https://github.com/OWNER/REPO/pull/123');
  process.exit(2);
}
const support = spawnSync('gh', ['event', 'listen', '--help'], { encoding: 'utf8' });
if (support.status !== 0) {
  console.error('GitHub Event Streams requires gh >= 2.105.0 and approval at https://gh.io/event-streams');
  process.exit(2);
}
if (spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' }).status !== 0) {
  console.error('GitHub CLI is not authenticated. Use gh auth login; never paste tokens into code.');
  process.exit(2);
}
const result = spawnSync('gh', ['event', 'listen', '--resource', url,
  '--event', 'com.github.pull_request.review.submitted.v1,com.github.pull_request.check_suite.status.changed.v1,com.github.pull_request.head.changed.v1',
  '--count', '1', '--timeout', '5m'], { stdio: 'inherit' });
if (result.status === 8) console.error('No new PR event within five minutes. Existing check status must be read separately.');
process.exit(result.status ?? 1);
