import { readFileSync } from 'node:fs';

const metrics = ['lines', 'statements', 'functions', 'branches'];
const minimumCoverage = 90n;

function readCoverage(path) {
  const { total } = JSON.parse(readFileSync(path, 'utf8'));
  if (!total?.lines?.total) {
    throw new Error(`No application lines were measured in ${path}.`);
  }

  for (const metric of metrics) {
    const counts = total[metric];
    if (
      !counts ||
      !Number.isSafeInteger(counts.total) ||
      !Number.isSafeInteger(counts.covered) ||
      counts.total < 0 ||
      counts.covered < 0 ||
      counts.covered > counts.total
    ) {
      throw new Error(`Invalid ${metric} coverage in ${path}.`);
    }
  }

  return total;
}

function fraction({ covered, total }) {
  // A metric with no applicable code is reported as fully covered by Vitest.
  return total === 0 ? [1n, 1n] : [BigInt(covered), BigInt(total)];
}

function label(counts) {
  const [covered, total] = fraction(counts);
  const percentage = Number((covered * 10_000n) / total) / 100;
  return `${percentage.toFixed(2)}% (${counts.covered}/${counts.total})`;
}

try {
  const paths = process.argv.slice(2);
  if (paths.length !== 2) {
    throw new Error('Usage: node scripts/check-coverage.mjs <base.json> <pull-request.json>');
  }

  const base = readCoverage(paths[0]);
  const pullRequest = readCoverage(paths[1]);
  const results = metrics.map((metric) => {
    const [baseCovered, baseTotal] = fraction(base[metric]);
    const [prCovered, prTotal] = fraction(pullRequest[metric]);

    return {
      metric,
      base: label(base[metric]),
      pullRequest: label(pullRequest[metric]),
      decreased: prCovered * baseTotal < baseCovered * prTotal,
      belowMinimum: prCovered * 100n < minimumCoverage * prTotal
    };
  });

  console.table(results);
  const decreases = results.filter(({ decreased }) => decreased).map(({ metric }) => metric);
  const belowMinimum = results.filter((result) => result.belowMinimum).map(({ metric }) => metric);
  const failures = [];
  if (decreases.length > 0) {
    failures.push(`Coverage decreased for ${decreases.join(', ')}.`);
  }
  if (belowMinimum.length > 0) {
    failures.push(`Coverage is below ${minimumCoverage}% for ${belowMinimum.join(', ')}.`);
  }
  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
