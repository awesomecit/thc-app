#!/usr/bin/env node
/**
 * Auto-release Script - Semantic Versioning Automation
 *
 * Basato su Guida 11: Versionamento Automatico IaC-Oriented
 * Usa conventional commits per calcolare automaticamente la prossima versione
 *
 * Usage:
 *   npm run release:suggest  # Preview (dry-run)
 *   npm run release          # Execute release
 *
 * @file Node.js CLI script
 */

import { simpleGit } from 'simple-git';
import semver from 'semver';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Analizza un commit message e estrae informazioni conventional
 */
function analyzeCommit(commitMessage, commitHash) {
  try {
    // Parsing manuale del formato conventional commit
    const firstLine = commitMessage.split('\n')[0];
    const breakingMatch = firstLine.match(/^(\w+)(\(([^)]+)\))?!:/);
    const normalMatch = firstLine.match(/^(\w+)(\(([^)]+)\))?:\s*(.+)/);

    let type = 'unknown';
    let scope = null;
    let subject = firstLine;
    let hasBreakingInType = false;

    if (breakingMatch) {
      // feat(scope)!: subject
      type = breakingMatch[1];
      scope = breakingMatch[3] || null;
      subject = firstLine.substring(breakingMatch[0].length).trim();
      hasBreakingInType = true;
    } else if (normalMatch) {
      // feat(scope): subject
      type = normalMatch[1];
      scope = normalMatch[3] || null;
      subject = normalMatch[4]?.trim() || firstLine;
    }

    // Verifica breaking change nel footer
    const hasBreakingInFooter =
      commitMessage.includes('BREAKING CHANGE:') || commitMessage.includes('BREAKING-CHANGE:');

    const hasBreaking = hasBreakingInType || hasBreakingInFooter;

    return {
      hash: commitHash.substring(0, 7),
      type,
      scope,
      subject,
      breaking: hasBreaking,
      raw: commitMessage,
    };
  } catch (error) {
    console.warn(`⚠️  Could not parse commit ${commitHash.substring(0, 7)}: ${error.message}`);
    return {
      hash: commitHash.substring(0, 7),
      type: 'unknown',
      scope: null,
      subject: commitMessage.split('\n')[0],
      breaking: false,
      raw: commitMessage,
    };
  }
}

/**
 * Calcola il bump type basato sui commit analizzati
 */
function calculateBump(commits) {
  // MAJOR: se c'è almeno un breaking change
  if (commits.some((c) => c.breaking)) {
    return 'major';
  }

  // MINOR: se c'è almeno un feat
  if (commits.some((c) => c.type === 'feat')) {
    return 'minor';
  }

  // PATCH: se c'è almeno un fix o perf
  if (commits.some((c) => c.type === 'fix' || c.type === 'perf')) {
    return 'patch';
  }

  // Nessun bump necessario (solo docs, chore, etc.)
  return 'none';
}

/**
 * Ottiene l'ultimo tag Git
 */
async function getLastTag(git) {
  try {
    const tags = await git.tags();
    if (!tags.latest) {
      return null;
    }
    return tags.latest;
  } catch (error) {
    console.warn('⚠️  Could not fetch tags:', error.message);
    return null;
  }
}

/**
 * Ottiene i commit dal tag specificato (o da inizio se null)
 */
async function getCommitsSinceTag(git, tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const log = await git.log({ from: range });
    return log.all;
  } catch (error) {
    console.error('❌ Error fetching commits:', error.message);
    throw error;
  }
}

/**
 * Legge la versione corrente da package.json
 */
async function getCurrentVersion() {
  try {
    const packagePath = join(ROOT, 'package.json');
    const content = await readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version;
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    throw error;
  }
}

/**
 * Aggiorna la versione in package.json
 */
async function updatePackageVersion(newVersion) {
  try {
    const packagePath = join(ROOT, 'package.json');
    const content = await readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    pkg.version = newVersion;
    await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    return true;
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    throw error;
  }
}

/**
 * Crea git tag
 */
async function createTag(git, version, message) {
  try {
    await git.addTag(`v${version}`, message);
    return true;
  } catch (error) {
    console.error('❌ Error creating tag:', error.message);
    throw error;
  }
}

/**
 * Main function - Analizza e (opzionalmente) esegue il release
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const git = simpleGit(ROOT);

  console.log('🚀 THC-App Auto-Release');
  console.log('━'.repeat(50));
  console.log('');

  // Step 1: Ottieni ultimo tag
  console.log('📌 Step 1/5: Fetching last Git tag...');
  const lastTag = await getLastTag(git);
  const currentVersion = await getCurrentVersion();

  console.log(`   Current version: ${currentVersion}`);
  console.log(`   Last tag: ${lastTag || '(none - first release)'}`);
  console.log('');

  // Step 2: Raccogli commit dal tag
  console.log('📝 Step 2/5: Analyzing commits since last tag...');
  const rawCommits = await getCommitsSinceTag(git, lastTag);
  console.log(`   Found ${rawCommits.length} commits`);
  console.log('');

  if (rawCommits.length === 0) {
    console.log('ℹ️  No new commits since last release');
    console.log('   Nothing to release!');
    return;
  }

  // Step 3: Analizza commit con conventional-commits-parser
  console.log('🔍 Step 3/5: Parsing conventional commits...');
  const commits = rawCommits.map((c) => analyzeCommit(c.message, c.hash));

  // Raggruppa per tipo
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix' || c.type === 'perf');
  const breaking = commits.filter((c) => c.breaking);
  const other = commits.filter((c) => !['feat', 'fix', 'perf'].includes(c.type) && !c.breaking);

  console.log(`   Features: ${features.length}`);
  console.log(`   Fixes: ${fixes.length}`);
  console.log(`   Breaking: ${breaking.length}`);
  console.log(`   Other: ${other.length}`);
  console.log('');

  // Step 4: Calcola nuova versione
  console.log('🎯 Step 4/5: Calculating new version...');
  const bumpType = calculateBump(commits);

  if (bumpType === 'none') {
    console.log('   No version bump required (only docs/chore/style commits)');
    console.log('   Skipping release');
    return;
  }

  const newVersion = semver.inc(currentVersion, bumpType);
  console.log(`   Bump type: ${bumpType.toUpperCase()}`);
  console.log(`   New version: ${currentVersion} → ${newVersion}`);
  console.log('');

  // Step 5: Preview o Esecuzione
  if (isDryRun) {
    console.log('🔍 DRY-RUN MODE - Preview Only');
    console.log('━'.repeat(50));
    console.log('');
    console.log(`Would release version: v${newVersion}`);
    console.log('');
    console.log('Changes included:');
    if (breaking.length > 0) {
      console.log('');
      console.log('💥 BREAKING CHANGES:');
      breaking.forEach((c) => console.log(`   - ${c.hash} ${c.subject}`));
    }
    if (features.length > 0) {
      console.log('');
      console.log('✨ Features:');
      features.forEach((c) =>
        console.log(`   - ${c.hash} ${c.scope ? `(${c.scope})` : ''} ${c.subject}`)
      );
    }
    if (fixes.length > 0) {
      console.log('');
      console.log('🐛 Bug Fixes:');
      fixes.forEach((c) =>
        console.log(`   - ${c.hash} ${c.scope ? `(${c.scope})` : ''} ${c.subject}`)
      );
    }
    console.log('');
    console.log('To execute this release, run:');
    console.log('  npm run release');
  } else {
    console.log('🚀 Step 5/5: Executing release...');

    // Update package.json
    console.log('   Updating package.json...');
    await updatePackageVersion(newVersion);

    // Git commit
    console.log('   Creating release commit...');
    await git.add(['package.json', 'package-lock.json']);
    await git.commit(`chore(release): ${newVersion}\n\n[skip ci]`);

    // Git tag
    console.log('   Creating git tag...');
    await createTag(git, newVersion, `Release v${newVersion}`);

    console.log('');
    console.log('✅ Release completed successfully!');
    console.log('');
    console.log(`   Version: v${newVersion}`);
    console.log(`   Commit: Release commit created`);
    console.log(`   Tag: v${newVersion}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review changes: git show HEAD');
    console.log('  2. Push to remote: git push && git push --tags');
    console.log('  3. (Optional) Generate CHANGELOG: npm run changelog:generate');
  }
}

// Execute
main().catch((error) => {
  console.error('');
  console.error('❌ Fatal error:');
  console.error(error);
  process.exit(1);
});
