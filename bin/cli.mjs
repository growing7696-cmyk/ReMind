#!/usr/bin/env node
// ReMind installer CLI.
//   npx github:growing7696-cmyk/ReMind            install for Claude Code (~/.claude/skills)
//   npx github:growing7696-cmyk/ReMind --project  install into ./.claude/skills
//   npx github:growing7696-cmyk/ReMind audit .    run the audit scanner

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SKILL = 'remind';
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillSrc = path.join(pkgRoot, 'skills', SKILL);
const version = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;

const HELP = `ReMind v${version} - anti-slop skill for games

Usage
  npx github:growing7696-cmyk/ReMind [install] [options]
  npx github:growing7696-cmyk/ReMind uninstall [options]
  npx github:growing7696-cmyk/ReMind audit [dir] [--json] [--all]

Install targets (default: --claude)
  --claude     ~/.claude/skills/${SKILL}        (Claude Code, all projects)
  --project    ./.claude/skills/${SKILL}        (Claude Code, this project only)
  --codex      ~/.codex/skills/${SKILL}         (OpenAI Codex CLI)
  --agents     ~/.agents/skills/${SKILL}        (agents using the shared skills dir)
  --dir <path> <path>/${SKILL}                  (any other location)
  --all        every global target above

Options
  -h, --help   show this help
  -v, --version
`;

function targets(args) {
  const home = os.homedir();
  const out = [];
  const pick = (flag) => args.includes(flag);
  if (pick('--all')) {
    out.push(path.join(home, '.claude', 'skills'), path.join(home, '.codex', 'skills'), path.join(home, '.agents', 'skills'));
  } else {
    if (pick('--claude')) out.push(path.join(home, '.claude', 'skills'));
    if (pick('--project')) out.push(path.join(process.cwd(), '.claude', 'skills'));
    if (pick('--codex')) out.push(path.join(home, '.codex', 'skills'));
    if (pick('--agents')) out.push(path.join(home, '.agents', 'skills'));
    const di = args.indexOf('--dir');
    if (di !== -1) {
      if (!args[di + 1]) fail('--dir needs a path');
      out.push(path.resolve(args[di + 1]));
    }
  }
  if (!out.length) out.push(path.join(home, '.claude', 'skills'));
  return [...new Set(out)].map((d) => path.join(d, SKILL));
}

function install(args) {
  if (!fs.existsSync(path.join(skillSrc, 'SKILL.md'))) fail(`skill source missing: ${skillSrc}`);
  for (const dest of targets(args)) {
    const existed = fs.existsSync(dest);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(skillSrc, dest, { recursive: true });
    console.log(`${existed ? 'updated  ' : 'installed'} ${SKILL} v${version} -> ${dest}`);
  }
  console.log(`
Done. Restart your agent session so it picks up the skill.
Try:  "Use ReMind to review this game and give me the scorecard."
Audit any project directly:  npx github:growing7696-cmyk/ReMind audit <dir>`);
}

function uninstall(args) {
  for (const dest of targets(args)) {
    if (fs.existsSync(path.join(dest, 'SKILL.md'))) {
      fs.rmSync(dest, { recursive: true, force: true });
      console.log(`removed ${dest}`);
    } else {
      console.log(`not installed: ${dest}`);
    }
  }
}

async function audit(rest) {
  const mod = await import(pathToFileURL(path.join(skillSrc, 'scripts', 'audit.mjs')).href);
  process.exit(await mod.runAudit(rest));
}

function fail(msg) {
  console.error(`ReMind: ${msg}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const cmd = argv[0] && !argv[0].startsWith('-') ? argv[0] : 'install';
const rest = cmd === argv[0] ? argv.slice(1) : argv;

if (argv.includes('-h') || argv.includes('--help')) console.log(HELP);
else if (argv.includes('-v') || argv.includes('--version')) console.log(version);
else if (cmd === 'install') install(rest);
else if (cmd === 'uninstall' || cmd === 'remove') uninstall(rest);
else if (cmd === 'audit') await audit(rest);
else fail(`unknown command "${cmd}" (try --help)`);
