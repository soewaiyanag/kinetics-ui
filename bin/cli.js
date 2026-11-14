#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_NAME = 'kinetics-ui';
const SOURCE = path.join(__dirname, '..', 'skills', SKILL_NAME);
const pkg = require('../package.json');

const HELP = `
kinetics-ui v${pkg.version}
Installs the "${SKILL_NAME}" animation skill for AI coding agents.

Usage:
  npx kinetics-ui [install] [options]
  npx kinetics-ui uninstall [options]

Options:
  -g, --global        Install to ~/.claude/skills (default)
  -p, --project       Install to ./.claude/skills in the current project
  -d, --dir <path>    Install into a custom skills directory
  -f, --force         Overwrite an existing install
  -h, --help          Show this help
  -v, --version       Show version
`;

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { cmd: 'install', target: 'global', dir: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === 'install' || a === 'uninstall') opts.cmd = a;
    else if (a === '-g' || a === '--global') opts.target = 'global';
    else if (a === '-p' || a === '--project') opts.target = 'project';
    else if (a === '-d' || a === '--dir') {
      opts.dir = argv[++i];
      if (!opts.dir) fail('--dir needs a path');
      opts.target = 'custom';
    } else if (a === '-f' || a === '--force') opts.force = true;
    else if (a === '-h' || a === '--help') opts.cmd = 'help';
    else if (a === '-v' || a === '--version') opts.cmd = 'version';
    else fail(`Unknown argument: ${a}\n${HELP}`);
  }
  return opts;
}

function skillsRoot(opts) {
  if (opts.target === 'custom') return path.resolve(opts.dir);
  if (opts.target === 'project') return path.join(process.cwd(), '.claude', 'skills');
  return path.join(os.homedir(), '.claude', 'skills');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function install(opts) {
  const dest = path.join(skillsRoot(opts), SKILL_NAME);
  if (fs.existsSync(dest) && !opts.force) fail(`${dest} already exists. Re-run with --force to overwrite.`);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  copyDir(SOURCE, dest);
  console.log(`✔ Installed ${SKILL_NAME} to ${dest}`);
  console.log('  Restart your agent session; the skill loads when you work on UI animation.');
}

function uninstall(opts) {
  const dest = path.join(skillsRoot(opts), SKILL_NAME);
  if (!fs.existsSync(dest)) fail(`Nothing to remove at ${dest}`);
  fs.rmSync(dest, { recursive: true, force: true });
  console.log(`✔ Removed ${dest}`);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.cmd === 'help') console.log(HELP);
else if (opts.cmd === 'version') console.log(pkg.version);
else if (opts.cmd === 'uninstall') uninstall(opts);
else install(opts);
