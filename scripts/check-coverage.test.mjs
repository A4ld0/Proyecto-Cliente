import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const guard = fileURLToPath(new URL('./check-coverage.mjs', import.meta.url));
const metrics = ['lines', 'statements', 'functions', 'branches'];

function summary(covered = 95, total = 100) {
  return { total: Object.fromEntries(metrics.map((metric) => [metric, { covered, total }])) };
}

function check(context, base, head) {
  const tempRoot = resolve(tmpdir());
  const directory = mkdtempSync(join(tempRoot, 'printlab-coverage-'));
  context.after(() => {
    assert.equal(dirname(directory), tempRoot);
    assert.ok(basename(directory).startsWith('printlab-coverage-'));
    rmSync(directory, { recursive: true });
  });
  const paths = [join(directory, 'base.json'), join(directory, 'head.json')];
  writeFileSync(paths[0], JSON.stringify(base));
  writeFileSync(paths[1], JSON.stringify(head));
  const result = spawnSync(process.execPath, [guard, ...paths], { encoding: 'utf8' });
  assert.ifError(result.error);
  return result;
}

test('accepts unchanged coverage at exactly the 90% minimum', (context) => {
  assert.equal(check(context, summary(90), summary(90)).status, 0);
});

test('accepts a real improvement when the number of measured lines changes', (context) => {
  assert.equal(check(context, summary(90), summary(190, 200)).status, 0);
});

for (const metric of metrics) {
  test(`rejects a regression in ${metric} even above the minimum`, (context) => {
    const head = summary();
    head.total[metric].covered = 94;
    const result = check(context, summary(), head);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`Coverage decreased for ${metric}`));
  });
}

test('rejects a drop hidden by the displayed percentage rounding', (context) => {
  const result = check(context, summary(950001, 1000000), summary(950000, 1000000));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Coverage decreased/);
});

test('rejects coverage below 90% even when it improves on the base', (context) => {
  const result = check(context, summary(70), summary(89));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /below 90%/);
});

test('allows metrics with no applicable branches or functions', (context) => {
  const coverage = summary();
  coverage.total.functions = { covered: 0, total: 0 };
  coverage.total.branches = { covered: 0, total: 0 };
  assert.equal(check(context, coverage, coverage).status, 0);
});

test('rejects a report that measured no application lines', (context) => {
  const result = check(context, summary(), summary(0, 0));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No application lines were measured/);
});

test('rejects impossible coverage counts', (context) => {
  const result = check(context, summary(), summary(101));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid lines coverage/);
});

test('requires both input reports', () => {
  const result = spawnSync(process.execPath, [guard], { encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
});
