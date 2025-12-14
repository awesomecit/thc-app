#!/usr/bin/env node
/**
 * Auto-release Script - Semantic Versioning Automation
 *
 * Features:
 * - Analizza conventional commits per calcolare versione
 * - Genera CHANGELOG.md automaticamente (Keep a Changelog format)
 * - Genera feature.json per client-facing release notes
 * - Gestisce primo release (nessun tag precedente)
 *
 * Usage:
 *   npm run release:suggest  # Preview (dry-run)
 *   npm run release          # Execute release
 */

import { simpleGit } from 'simple-git';
import semver from 'semver';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Analizza commit message conventional
 */
function analyzeCommit(commitMessage, commitHash) {
  const firstLine = commitMessage.split('\n')[0];
  const breakingMatch = firstLine.match(/^(\w+)(\(([^)]+)\))?!:/);
  const normalMatch = firstLine.match(/^(\w+)(\(([^)]+)\))?:\s*(.+)/);

  let type = 'unknown';
  let scope = null;
  let subject = firstLine;
  const hasBreakingInType = Boolean(breakingMatch);

  if (breakingMatch) {
    type = breakingMatch[1];
    scope = breakingMatch[3] || null;
    subject = firstLine.substring(breakingMatch[0].length).trim();
  } else if (normalMatch) {
    type = normalMatch[1];
    scope = normalMatch[3] || null;
    subject = normalMatch[4]?.trim() || firstLine;
  }

  const hasBreakingInFooter =
    commitMessage.includes('BREAKING CHANGE:') || commitMessage.includes('BREAKING-CHANGE:');

  return {
    hash: commitHash.substring(0, 7),
    type,
    scope,
    subject,
    breaking: hasBreakingInType || hasBreakingInFooter,
    raw: commitMessage,
  };
}

/**
 * Calcola bump type
 */
function calculateBump(commits) {
  if (commits.some((c) => c.breaking)) {
    return 'major';
  }
  if (commits.some((c) => c.type === 'feat')) {
    return 'minor';
  }
  if (commits.some((c) => c.type === 'fix' || c.type === 'perf')) {
    return 'patch';
  }
  return 'none';
}

/**
 * Ottiene ultimo tag Git
 */
async function getLastTag(git) {
  try {
    const tags = await git.tags();
    return tags.latest || null;
  } catch {
    return null;
  }
}

/**
 * Ottiene commit dal tag
 */
async function getCommitsSinceTag(git, tag) {
  if (tag) {
    const log = await git.log({ from: tag, to: 'HEAD' });
    return log.all;
  }
  const log = await git.log();
  return log.all;
}

/**
 * Legge versione corrente
 */
async function getCurrentVersion() {
  const packagePath = join(ROOT, 'package.json');
  const content = await readFile(packagePath, 'utf-8');
  const pkg = JSON.parse(content);
  return pkg.version;
}

/**
 * Aggiorna versione package.json
 */
async function updatePackageVersion(newVersion) {
  const packagePath = join(ROOT, 'package.json');
  const content = await readFile(packagePath, 'utf-8');
  const pkg = JSON.parse(content);
  pkg.version = newVersion;
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

/**
 * Crea git tag
 */
async function createTag(git, version, message) {
  await git.addTag(`v${version}`, message);
}

/**
 * Genera CHANGELOG.md
 */
async function generateChangelog(version, commits) {
  const changelogPath = join(ROOT, 'CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];

  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);

  let entry = `## [${version}] - ${date}\n\n`;

  if (breaking.length > 0) {
    entry += '### ⚠️ BREAKING CHANGES\n\n';
    breaking.forEach((c) => {
      const scopePrefix = c.scope ? `**${c.scope}**: ` : '';
      entry += `- ${scopePrefix}${c.subject} ([${c.hash}])\n`;
    });
    entry += '\n';
  }

  if (features.length > 0) {
    entry += '### ✨ Features\n\n';
    features.forEach((c) => {
      const scopePrefix = c.scope ? `**${c.scope}**: ` : '';
      entry += `- ${scopePrefix}${c.subject} ([${c.hash}])\n`;
    });
    entry += '\n';
  }

  if (fixes.length > 0) {
    entry += '### 🐛 Bug Fixes\n\n';
    fixes.forEach((c) => {
      const scopePrefix = c.scope ? `**${c.scope}**: ` : '';
      entry += `- ${scopePrefix}${c.subject} ([${c.hash}])\n`;
    });
    entry += '\n';
  }

  let existingChangelog = '';
  try {
    existingChangelog = await readFile(changelogPath, 'utf-8');
    const headerEnd = existingChangelog.indexOf('\n## [');
    if (headerEnd > 0) {
      existingChangelog = existingChangelog.substring(headerEnd + 1);
    }
  } catch {
    // File non esiste
  }

  const header = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  await writeFile(changelogPath, header + entry + existingChangelog, 'utf-8');
  return changelogPath;
}

/**
 * Genera feature.json
 */
async function generateFeatureJson(version, commits, previousVersion) {
  const featureJsonPath = join(ROOT, 'feature.json');
  const date = new Date().toISOString();

  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);

  const featureData = {
    version,
    releaseDate: date,
    previousVersion: previousVersion || '0.0.0',
    summary: {
      featuresCount: features.length,
      fixesCount: fixes.length,
      breakingChangesCount: breaking.length,
    },
    features: features.map((c) => ({
      id: `${c.scope || 'general'}-${c.hash}`,
      title: c.subject,
      scope: c.scope || 'general',
      commit: c.hash,
      type: 'feature',
    })),
    fixes: fixes.map((c) => ({
      id: `${c.scope || 'general'}-${c.hash}`,
      title: c.subject,
      scope: c.scope || 'general',
      commit: c.hash,
      type: 'fix',
    })),
    breakingChanges: breaking.map((c) => ({
      id: `${c.scope || 'general'}-${c.hash}`,
      title: c.subject,
      scope: c.scope || 'general',
      commit: c.hash,
      description: c.subject,
      migrationGuide: 'See commit message for details',
    })),
  };

  await writeFile(featureJsonPath, JSON.stringify(featureData, null, 2) + '\n', 'utf-8');
  return featureJsonPath;
}

/**
 * Preview release (dry-run)
 */
function previewRelease(newVersion, commits) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);

  console.log('🔍 DRY-RUN MODE - Preview Only');
  console.log('━'.repeat(50));
  console.log(`\nWould release version: v${newVersion}\n`);
  console.log('Changes included:');

  if (breaking.length > 0) {
    console.log('\n💥 BREAKING CHANGES:');
    breaking.forEach((c) => console.log(`   - ${c.hash} ${c.subject}`));
  }

  if (features.length > 0) {
    console.log('\n✨ Features:');
    features.forEach((c) =>
      console.log(`   - ${c.hash} ${c.scope ? `(${c.scope})` : ''} ${c.subject}`)
    );
  }

  if (fixes.length > 0) {
    console.log('\n🐛 Bug Fixes:');
    fixes.forEach((c) =>
      console.log(`   - ${c.hash} ${c.scope ? `(${c.scope})` : ''} ${c.subject}`)
    );
  }

  console.log('\nTo execute this release, run:\n  npm run release');
}

/**
 * Execute release
 */
async function executeRelease(git, newVersion, commits, lastTag) {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);

  console.log('🚀 Step 5/6: Generating release artifacts...');

  console.log('   Generating CHANGELOG.md...');
  await generateChangelog(newVersion, commits);
  console.log('   ✅ CHANGELOG.md updated');

  console.log('   Generating feature.json...');
  await generateFeatureJson(newVersion, commits, lastTag?.replace('v', ''));
  console.log('   ✅ feature.json created');

  console.log('\n📦 Step 6/6: Committing and tagging release...');

  console.log('   Updating package.json...');
  await updatePackageVersion(newVersion);

  const commitMsg = `chore(release): ${newVersion}

- CHANGELOG: ${features.length} features, ${fixes.length} fixes
- feature.json: Client-facing release notes
${breaking.length > 0 ? `- ⚠️  ${breaking.length} BREAKING CHANGE(S)\n` : ''}[skip ci]`;

  console.log('   Creating release commit...');
  await git.add(['package.json', 'package-lock.json', 'CHANGELOG.md', 'feature.json']);
  await git.commit(commitMsg);

  console.log('   Creating git tag...');
  await createTag(git, newVersion, `Release v${newVersion}`);

  console.log('\n✅ Release completed successfully!');
  console.log('━'.repeat(50));
  console.log(`\n   📦 Version: v${newVersion}`);
  console.log(`   📝 CHANGELOG: ${features.length + fixes.length} changes`);
  console.log('   📋 feature.json: Generated');
  console.log(`   🏷️  Tag: v${newVersion}`);
  console.log('\nNext steps:');
  console.log('  1. Review: git show HEAD');
  console.log('  2. Check: cat CHANGELOG.md');
  console.log('  3. Check: cat feature.json');
  console.log('  4. Push: git push && git push --tags');
}

/**
 * Main
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const git = simpleGit(ROOT);

  console.log('🚀 THC-App Auto-Release');
  console.log('━'.repeat(50));
  console.log('');

  // Step 1: Get last tag
  console.log('📌 Step 1/6: Fetching last Git tag...');
  const lastTag = await getLastTag(git);
  const currentVersion = await getCurrentVersion();

  console.log(`   Current version: ${currentVersion}`);
  console.log(`   Last tag: ${lastTag || '(none - first release)'}`);

  if (!lastTag) {
    const allCommits = await git.log();
    if (allCommits.total > 0) {
      console.log(`   ℹ️  No tags found but ${allCommits.total} commits exist`);
      console.log(`   Creating first release from package.json: ${currentVersion}`);
    }
  }
  console.log('');

  // Step 2: Get commits
  console.log('📝 Step 2/6: Analyzing commits since last tag...');
  const rawCommits = await getCommitsSinceTag(git, lastTag);
  console.log(`   Found ${rawCommits.length} commits\n`);

  if (rawCommits.length === 0) {
    console.log('ℹ️  No new commits since last release');
    console.log('   Nothing to release!');
    return;
  }

  // Step 3: Parse commits
  console.log('🔍 Step 3/6: Parsing conventional commits...');
  const commits = rawCommits.map((c) => analyzeCommit(c.message, c.hash));

  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);
  const other = commits.filter((c) => !['feat', 'fix', 'perf'].includes(c.type) && !c.breaking);

  console.log(`   Features: ${features.length}`);
  console.log(`   Fixes: ${fixes.length}`);
  console.log(`   Breaking: ${breaking.length}`);
  console.log(`   Other: ${other.length}\n`);

  // Step 4: Calculate version
  console.log('🎯 Step 4/6: Calculating new version...');
  const bumpType = calculateBump(commits);

  if (bumpType === 'none') {
    console.log('   No version bump required (only docs/chore/style)');
    console.log('   Skipping release');
    return;
  }

  const newVersion = semver.inc(currentVersion, bumpType);
  console.log(`   Bump type: ${bumpType.toUpperCase()}`);
  console.log(`   New version: ${currentVersion} → ${newVersion}\n`);

  // Step 5: Execute or preview
  if (isDryRun) {
    previewRelease(newVersion, commits);
  } else {
    await executeRelease(git, newVersion, commits, lastTag);
  }
}

// Execute
main().catch((error) => {
  console.error('\n❌ Fatal error:');
  console.error(error);
  process.exit(1);
});
