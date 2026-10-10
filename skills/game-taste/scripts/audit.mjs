#!/usr/bin/env node
// game-taste audit: heuristic scanner for game projects.
// Flags tells across five pillars (physics, assets, ui, security, quality).
// Zero dependencies. Findings are leads, not verdicts - confirm by reading the code.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'Library', 'Temp', 'Obj', 'obj', 'Logs', 'UserSettings',
  'Build', 'Builds', 'build', 'dist', 'out', '.godot', '.import', 'Binaries', 'Intermediate',
  'DerivedDataCache', 'Saved', 'target', '.next', '.nuxt', 'coverage', 'vendor', '.vite',
  '.cache', '__pycache__', '.venv', 'venv', '.idea', '.vscode',
  'third_party', 'third-party', 'thirdparty', 'ThirdParty', 'external', 'extern', 'addons', 'Plugins',
]);

const CODE_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.cs', '.gd', '.cpp', '.cc',
  '.h', '.hpp', '.c', '.py', '.lua', '.rs', '.java', '.kt', '.swift', '.go', '.html', '.css', '.scss',
]);
const DATA_EXT = new Set([
  '.json', '.tscn', '.tres', '.godot', '.unity', '.prefab', '.asset', '.mat', '.xml', '.yaml',
  '.yml', '.tmx', '.tsj', '.tmj', '.ldtk', '.atlas', '.plist', '.ini', '.cfg', '.toml', '.env',
]);
const ASSET_EXT = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tga', '.psd', '.ktx2', '.basis', '.dds', '.exr', '.hdr', '.aseprite', '.ase'],
  audio: ['.wav', '.ogg', '.mp3', '.m4a', '.aac', '.flac', '.opus'],
  model: ['.glb', '.gltf', '.fbx', '.obj', '.blend', '.dae'],
  font: ['.ttf', '.otf', '.woff', '.woff2'],
  video: ['.mp4', '.webm', '.ogv'],
};
const ASSET_KIND = new Map(Object.entries(ASSET_EXT).flatMap(([k, exts]) => exts.map((e) => [e, k])));
const SOURCE_ART_EXT = new Set(['.psd', '.blend', '.aseprite', '.ase']);

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const PER_RULE_LIMIT = 8;

// ---------- args ----------

export async function runAudit(argv = process.argv.slice(2)) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  if (flags.has('--help') || flags.has('-h')) {
    console.log('Usage: audit.mjs [project-dir] [--json] [--all]\n  --json  machine-readable output\n  --all   do not collapse repeated findings');
    return 0;
  }
  const root = path.resolve(args[0] || '.');
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`game-taste audit: not a directory: ${root}`);
    return 2;
  }

  const files = walk(root);
  const ctx = buildContext(root, files);
  const findings = [];
  const add = (pillar, severity, rule, message, file, line) =>
    findings.push({ pillar, severity, rule, message, file: file ? path.relative(root, file) : undefined, line });

  for (const f of ctx.textFiles) scanTextFile(f, ctx, add);
  projectChecks(ctx, add);

  const errors = findings.filter((f) => f.severity === 'error').length;
  if (flags.has('--json')) {
    console.log(JSON.stringify({ root, engine: ctx.engine, stats: ctx.stats, findings }, null, 2));
  } else {
    printReport(root, ctx, findings, flags.has('--all'));
  }
  return errors > 0 ? 1 : 0;
}

// ---------- file walking ----------

function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isSymbolicLink()) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) stack.push(p);
      } else if (e.isFile()) {
        out.push(p);
      }
    }
  }
  return out;
}

function readText(file) {
  try {
    const st = fs.statSync(file);
    if (st.size > MAX_TEXT_BYTES) return null;
    if (/\.min\.(js|css)$/.test(file)) return null;
    return fs.readFileSync(file, 'utf8');
  } catch { return null; }
}

function buildContext(root, files) {
  const textFiles = [];
  const codeFiles = [];
  const assets = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f);
    if (CODE_EXT.has(ext)) { textFiles.push(f); codeFiles.push(f); }
    else if (DATA_EXT.has(ext) || base.startsWith('.env')) textFiles.push(f);
    else if (ASSET_KIND.has(ext)) assets.push(f);
  }

  const texts = new Map();
  for (const f of textFiles) {
    const t = readText(f);
    if (t === null) continue;
    // Qt Linguist .ts files are XML, not TypeScript
    if (f.endsWith('.ts') && /^\s*(<\?xml|<!DOCTYPE TS)/.test(t)) continue;
    texts.set(f, t);
  }

  const has = (rel) => fs.existsSync(path.join(root, rel));
  let pkg = null;
  try { pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); } catch {}
  const deps = pkg ? { ...pkg.dependencies, ...pkg.devDependencies } : {};
  const depNames = Object.keys(deps);
  const hasDep = (re) => depNames.some((d) => re.test(d));

  let engine = 'unknown';
  if (has('ProjectSettings/ProjectVersion.txt') || has('Assets') && files.some((f) => f.endsWith('.unity'))) engine = 'unity';
  else if (has('project.godot')) engine = 'godot';
  else if (files.some((f) => f.endsWith('.uproject'))) engine = 'unreal';
  else if (has('Cargo.toml') && /bevy/.test(safeRead(path.join(root, 'Cargo.toml')))) engine = 'bevy';
  else if (hasDep(/^phaser$/)) engine = 'web:phaser';
  else if (hasDep(/^three$/)) engine = 'web:three';
  else if (hasDep(/^@babylonjs\//)) engine = 'web:babylon';
  else if (hasDep(/^pixi\.js$|^@pixi\//)) engine = 'web:pixi';
  else {
    const count = (re) => codeFiles.filter((f) => re.test(f)).length;
    const web = count(/\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte|html)$/);
    const native = count(/\.(cpp|cc|c|h|hpp)$/);
    const rust = count(/\.rs$/);
    if (native > web && native >= rust) engine = has('CMakeLists.txt') ? 'native:cmake' : 'native:cpp';
    else if (rust > web) engine = 'native:rust';
    else if (web > 0) engine = 'web:custom';
  }

  const physicsLib =
    hasDep(/rapier/) ? 'rapier' : hasDep(/^matter-js$/) ? 'matter' : hasDep(/^cannon(-es)?$/) ? 'cannon' :
    hasDep(/^planck/) ? 'planck' : hasDep(/ammo/) ? 'ammo' : null;

  const allCode = [...texts.entries()].filter(([f]) => CODE_EXT.has(path.extname(f).toLowerCase()));
  const corpus = [...texts.values()].join('\n');

  const stats = {
    codeFiles: codeFiles.length,
    codeLines: allCode.reduce((n, [, t]) => n + t.split('\n').length, 0),
    assets: Object.fromEntries(Object.keys(ASSET_EXT).map((k) => [k, assets.filter((a) => ASSET_KIND.get(path.extname(a).toLowerCase()) === k).length])),
    physicsLib,
  };

  return { root, files, textFiles: [...texts.keys()], texts, codeFiles, assets, engine, deps, corpus, stats };
}

function safeRead(f) { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }

// ---------- per-file rules ----------

const SECRET_PATTERNS = [
  { re: /AKIA[0-9A-Z]{16}/, name: 'AWS access key', sev: 'error' },
  { re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, name: 'private key', sev: 'error' },
  { re: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/, name: 'LLM API secret key', sev: 'error' },
  { re: /\bsk_live_[0-9a-zA-Z]{16,}/, name: 'Stripe live secret key', sev: 'error' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}/, name: 'GitHub token', sev: 'error' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/, name: 'Slack token', sev: 'error' },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/, name: 'Google API key (fine for Firebase web config only with strict rules)', sev: 'warn' },
  { re: /(?:password|passwd|secret|api[_-]?key|access[_-]?token|private[_-]?key)["']?\s*[:=]\s*["'][A-Za-z0-9_\-+/=.:@!#$%^&*]{8,}["']/i, name: 'hard-coded credential', sev: 'warn', codeOnly: true },
];
const EMOJI_IN_STRING = /["'`][^"'`\n]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}][^"'`\n]*["'`]/u;
const DEFAULT_FONT_CSS = /font-family\s*:\s*["']?(arial|helvetica|sans-serif|serif|monospace|verdana|tahoma|times new roman|system-ui|-apple-system)\b/i;
const DEFAULT_FONT_CANVAS = /\.font\s*=\s*['"`][^'"`]*\b(Arial|Helvetica|sans-serif|serif|monospace|Verdana|Tahoma)\b/;
const SAAS_GRADIENT = /linear-gradient\([^)]*(#6366f1|#8b5cf6|#a855f7|#7c3aed|#3b82f6|#667eea|#764ba2|#4f46e5|#ec4899)/i;

function scanTextFile(file, ctx, add) {
  const text = ctx.texts.get(file);
  if (text == null) return;
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  const lines = text.split('\n');
  const isCode = CODE_EXT.has(ext);
  const isJs = /\.(js|mjs|cjs|ts|tsx|jsx|vue|svelte|html)$/.test(ext);
  const isExample = /example|sample|template|\.dist$/i.test(base);

  // Secrets: any text file
  if (!isExample) {
    lines.forEach((ln, i) => {
      if (ln.length > 4000) return;
      for (const p of SECRET_PATTERNS) {
        if (p.codeOnly && LOCALE_DIR.test(file)) continue;
        const m = ln.match(p.re);
        if (m) {
          if (p.name === 'hard-coded credential' && /process\.env|import\.meta\.env|getenv|placeholder|your[_-]|xxx|<.*>|\*\*\*/i.test(ln)) continue;
          add('security', p.sev, 'secret', `${p.name} in source: ${mask(m[0])}`, file, i + 1);
          break;
        }
      }
    });
  }

  if (!isCode) {
    // Godot scene text may still contain UI strings
    if (ext === '.tscn') checkEmoji(lines, file, add);
    return;
  }

  if (isJs) scanJs(file, text, lines, ctx, add);
  if (ext === '.cs') scanCSharp(file, lines, add);
  if (ext === '.gd') scanGd(file, lines, add);
  if (ext === '.lua') lines.forEach((ln, i) => { if (/\bloadstring\s*\(|\bload\s*\(\s*[a-zA-Z_]/.test(ln)) add('security', 'warn', 'exec-untrusted', 'loadstring/load executes code - never on mod, save, or network data', file, i + 1); });
  if (ext === '.py') lines.forEach((ln, i) => { if (/pickle\.loads?\(/.test(ln)) add('security', 'warn', 'unsafe-deserialize', 'pickle on untrusted data allows code execution', file, i + 1); });

  if (/\.(css|scss|html|vue|svelte|jsx|tsx|js|ts)$/.test(ext)) {
    lines.forEach((ln, i) => {
      if (DEFAULT_FONT_CSS.test(ln)) add('ui', 'warn', 'default-font', 'default/system font as primary face - use a display face + a legible UI face', file, i + 1);
      if (DEFAULT_FONT_CANVAS.test(ln)) add('ui', 'warn', 'default-font', 'canvas text in a default font', file, i + 1);
      if (SAAS_GRADIENT.test(ln)) add('ui', 'info', 'saas-style', 'web-SaaS gradient palette - does it belong to this game\'s world?', file, i + 1);
      if (/backdrop-filter\s*:\s*blur/i.test(ln)) add('ui', 'info', 'saas-style', 'glassmorphism blur - a common AI tell unless the fiction is a sleek OS', file, i + 1);
    });
  }

  checkEmoji(lines, file, add);

  if (lines.length > 800 && !isGenerated(file, text)) {
    add('quality', 'warn', 'god-file', `${lines.length} lines - split by feature (sim/view/ui) unless generated`, file);
  }
}

const LOCALE_DIR = /(^|[\\/])(translations?|locales?|i18n|l10n|lang|localization|strings)([\\/])/i;

function isGenerated(file, text) {
  return LOCALE_DIR.test(file) || /\.(generated|g|designer)\.\w+$/i.test(file) ||
    /auto-?generated|generated by|do not edit/i.test(text.slice(0, 600));
}

function checkEmoji(lines, file, add) {
  lines.forEach((ln, i) => {
    if (/^\s*(\/\/|#|\*|<!--)/.test(ln)) return;
    if (/console\.|print\(|Debug\.Log|log\(/.test(ln)) return;
    if (EMOJI_IN_STRING.test(ln)) add('ui', 'warn', 'emoji-icon', 'emoji in a UI string - use a drawn icon family', file, i + 1);
  });
}

function scanJs(file, text, lines, ctx, add) {
  const usesRaf = /requestAnimationFrame/.test(text);
  const hasDelta = /\b(dt|delta|deltaTime|deltaMS|elapsed|timestep|timeStep|STEP|fixedStep)\b/.test(text);
  if (usesRaf && !hasDelta && !/phaser/.test(ctx.engine)) {
    const i = lines.findIndex((l) => /requestAnimationFrame/.test(l));
    add('physics', 'warn', 'frame-dependent', 'requestAnimationFrame loop with no delta/timestep in this file - movement likely tied to frame rate', file, i + 1);
  }
  lines.forEach((ln, i) => {
    const si = ln.match(/setInterval\s*\(.*,\s*(\d+)\s*\)/);
    if (si && Number(si[1]) <= 50) add('physics', 'warn', 'setinterval-loop', `setInterval(${si[1]}ms) used like a game loop - use rAF + fixed-step accumulator`, file, i + 1);
    if (/\.innerHTML\s*\+?=/.test(ln) && !/\.innerHTML\s*\+?=\s*(['"])[^'"]*\1\s*;?\s*$/.test(ln) && !/\.innerHTML\s*\+?=\s*`[^`$]*`\s*;?\s*$/.test(ln)) {
      add('security', 'warn', 'innerhtml', 'innerHTML with dynamic content - XSS if any part is player-provided; use textContent', file, i + 1);
    }
    if (/\beval\s*\(|new\s+Function\s*\(/.test(ln)) add('security', 'warn', 'exec-untrusted', 'eval/new Function - never on level, mod, save, or network data', file, i + 1);
    if (/\b(window\.)?(alert|confirm)\s*\(/.test(ln) && !/^\s*\/\//.test(ln)) add('ui', 'warn', 'native-dialog', 'browser alert/confirm in a game - use an in-game modal', file, i + 1);
    if (/localStorage\.setItem\s*\([^)]*(score|gold|coin|money|gem|currency|inventory|credits)/i.test(ln)) add('security', 'info', 'local-economy', 'progress/currency in localStorage - fine offline, never trust it for leaderboards or economies', file, i + 1);
    if (/(fetch|axios|\.post|send)\s*\(/.test(ln) && /score|highscore|leaderboard/i.test(ln)) add('security', 'warn', 'client-score', 'client submits score - the server must re-simulate or plausibility-check it', file, i + 1);
    if (/\bnew\s+(THREE\.)?Vector[234]\s*\(/.test(ln) && /(update|tick|animate|render|loop)\s*\(/i.test(enclosingFnName(lines, i))) {
      add('quality', 'info', 'hot-alloc', 'allocation inside a per-frame function - reuse temporaries or pool', file, i + 1);
    }
  });
}

function enclosingFnName(lines, idx) {
  for (let j = idx; j >= Math.max(0, idx - 60); j--) {
    const m = lines[j].match(/(?:function\s+(\w+)|(\w+)\s*\([^)]*\)\s*\{|(\w+)\s*=\s*\([^)]*\)\s*=>)/);
    if (m) return (m[1] || m[2] || m[3] || '') + '(';
  }
  return '';
}

// Extract [start, end) line ranges of blocks whose header matches `header`, ending at the next `next` header.
function blocks(lines, header, next) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!header.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !next.test(lines[j])) j++;
    out.push([i, j]);
  }
  return out;
}

function scanCSharp(file, lines, add) {
  const methodHeader = /^\s*(?:(?:public|private|protected|internal|static|override|virtual|async|sealed|new)\s+)*(?:void|IEnumerator|bool|int|float|string|Task|[A-Z]\w*(?:<[^>]+>)?)\s+\w+\s*\([^)]*\)\s*(?:\{|$)/;
  for (const [s, e] of blocks(lines, /\bvoid\s+(Update|LateUpdate)\s*\(\s*\)/, methodHeader)) {
    for (let i = s + 1; i < e; i++) {
      const ln = lines[i];
      if (/\.(AddForce|AddTorque|AddRelativeForce|MovePosition|MoveRotation)\s*\(|\.(velocity|linearVelocity|angularVelocity)\s*=/.test(ln)) {
        add('physics', 'warn', 'physics-in-update', 'Rigidbody changed in Update/LateUpdate - move to FixedUpdate (read input in Update)', file, i + 1);
      }
      if (/(transform\.position\s*\+=|\.Translate\s*\()/.test(ln) && !/deltaTime/.test(ln)) {
        add('physics', 'warn', 'frame-dependent', 'transform moved without Time.deltaTime - frame-rate dependent', file, i + 1);
      }
      if (/GameObject\.Find|FindObjectOfType|FindFirstObjectByType|FindObjectsOfType|GetComponent\s*</.test(ln)) {
        add('quality', 'warn', 'hot-lookup', 'Find/GetComponent every frame - cache the reference', file, i + 1);
      }
    }
  }
  lines.forEach((ln, i) => {
    if (/\bBinaryFormatter\b/.test(ln)) add('security', 'error', 'unsafe-deserialize', 'BinaryFormatter is unsafe on any untrusted data (saves, network) - use JSON + validation', file, i + 1);
  });
}

function scanGd(file, lines, add) {
  for (const [s, e] of blocks(lines, /^func\s+_process\s*\(/, /^(func|static func|class|signal|var|const|@)\b/)) {
    for (let i = s + 1; i < e; i++) {
      const ln = lines[i];
      if (/move_and_slide|move_and_collide|apply_(central_)?(force|impulse)|apply_torque|linear_velocity\s*=/.test(ln)) {
        add('physics', 'warn', 'physics-in-process', 'physics call in _process - move to _physics_process', file, i + 1);
      }
      if (/\bposition\s*\+=/.test(ln) && !/delta/.test(ln)) {
        add('physics', 'warn', 'frame-dependent', 'position changed without delta - frame-rate dependent', file, i + 1);
      }
    }
  }
  lines.forEach((ln, i) => {
    if (/bytes_to_var_with_objects|str_to_var|str2var/.test(ln)) add('security', 'warn', 'unsafe-deserialize', 'variant deserialisation can instantiate objects - never on untrusted data', file, i + 1);
  });
}

// ---------- project-level rules ----------

function projectChecks(ctx, add) {
  const { root, corpus, engine, assets, texts } = ctx;
  const code = [...texts.entries()].filter(([f]) => CODE_EXT.has(path.extname(f).toLowerCase())).map(([, t]) => t).join('\n');

  // Physics: fixed step in custom web loops
  if (/^web:(custom|three|pixi|babylon)/.test(engine) && /requestAnimationFrame/.test(code)) {
    if (!/accumulator|\bacc\s*[+-]=|fixed_?step|fixedTimeStep|FIXED_DT|timestep|world\.step\s*\(/i.test(code)) {
      add('physics', 'warn', 'no-fixed-step', 'no fixed-step accumulator found - simulation likely runs on variable frame delta');
    }
  }
  if (/^web:/.test(engine) && /(bullet|projectile|arrow|laser)/i.test(code) && !/ccd|continuous|raycast|sweep|castRay|shapeCast|ray\s*\(/i.test(code)) {
    add('physics', 'info', 'tunnelling', 'projectiles found but no CCD/raycast sweep - fast objects may pass through walls');
  }

  // Quality: RNG
  const randomCount = (code.match(/Math\.random\s*\(|Random\.Range\s*\(|\brandf?\s*\(\)|randi\s*\(\)/g) || []).length;
  if (randomCount >= 10 && !/seed|mulberry|xorshift|seedrandom|alea|pcg|splitmix|RandomNumberGenerator|new\s+System\.Random\s*\(\s*\w/i.test(code)) {
    add('quality', 'info', 'unseeded-rng', `${randomCount} unseeded random calls - use seeded RNG per system for reproducible runs and bugs`);
  }
  const logCount = (code.match(/console\.log\s*\(|Debug\.Log\s*\(|\bprint\s*\(/g) || []).length;
  if (logCount > 60) add('quality', 'info', 'log-spam', `${logCount} log calls - strip or level-gate them in release`);

  // Quality / UI: expected features
  const hay = corpus;
  if (ctx.stats.codeLines > 800) {
    if (!/\bpause/i.test(hay)) add('quality', 'warn', 'no-pause', 'no pause handling found - pause on menu and on focus loss');
    if (!/settings|options|preferences/i.test(hay)) add('ui', 'warn', 'no-settings', 'no settings/options screen found');
    if (!/volume|AudioMixer|audio_?bus|AudioServer|gainNode|createGain|Howler\.volume|master_?volume/i.test(hay)) add('assets', 'warn', 'no-audio-mix', 'no volume control or audio buses found');
    if (!/rebind|InputMap|remap|keybind|key_?binding|InputActionRebinding/i.test(hay)) add('ui', 'info', 'no-rebinding', 'no control rebinding found (expected at T2+)');
    if (!/visibilitychange|blur|focus|OnApplicationPause|OnApplicationFocus|NOTIFICATION_APPLICATION_FOCUS_OUT|NOTIFICATION_WM_WINDOW_FOCUS_OUT/i.test(hay)) add('quality', 'info', 'no-focus-handling', 'no focus-loss handling found - game should pause when backgrounded');
    if (!/(^|[\\/])(tests?|spec|__tests__)([\\/]|$)|\.(test|spec)\.[jt]sx?$|Tests\.cs$|test_.*\.(gd|py)$/.test(ctx.files.map((f) => path.relative(root, f)).join('\n'))) {
      add('quality', 'info', 'no-tests', 'no tests found - unit-test pure logic (damage, inventory, saves)');
    }
  }

  // Assets
  if (assets.length) {
    const isWeb = engine.startsWith('web:');
    let wavBytes = 0;
    for (const a of assets) {
      const ext = path.extname(a).toLowerCase();
      const kind = ASSET_KIND.get(ext);
      let size = 0;
      try { size = fs.statSync(a).size; } catch {}
      if (kind === 'image' && size > 4 * 1024 * 1024 && !SOURCE_ART_EXT.has(ext)) add('assets', 'warn', 'oversized', `${fmtBytes(size)} image - compress, atlas, or downscale`, a);
      if (kind === 'audio' && size > 10 * 1024 * 1024) add('assets', 'warn', 'oversized', `${fmtBytes(size)} audio file - stream music, compress to Ogg/AAC`, a);
      if (kind === 'model' && size > 30 * 1024 * 1024) add('assets', 'warn', 'oversized', `${fmtBytes(size)} model - LODs, Draco/Meshopt, texture compression`, a);
      if (ext === '.wav') wavBytes += size;
      if (SOURCE_ART_EXT.has(ext) && isWeb) add('assets', 'info', 'source-art', 'source art file inside a web project - keep it out of the shipped bundle', a);
    }
    if (isWeb && wavBytes > 5 * 1024 * 1024) add('assets', 'warn', 'wav-in-web', `${fmtBytes(wavBytes)} of WAV in a web project - ship Ogg/Opus with an AAC fallback`);

    const audioCount = ctx.stats.assets.audio;
    if (audioCount > 0 && audioCount < 4 && ctx.stats.codeLines > 800) add('assets', 'info', 'thin-audio', `only ${audioCount} audio file(s) - frequent sounds want 3-5 variations each`);
    if (audioCount === 0 && ctx.stats.codeLines > 800) add('assets', 'warn', 'no-audio', 'no audio assets - sound is half of game feel');

    // Unused assets: only where references are by path/name (not Unity GUIDs or Unreal binaries)
    if (!['unity', 'unreal'].includes(engine)) {
      const lowerCorpus = corpus.toLowerCase();
      const unused = [];
      for (const a of assets) {
        const ext = path.extname(a).toLowerCase();
        if (SOURCE_ART_EXT.has(ext) || ASSET_KIND.get(ext) === 'font' && /\.css$/.test(a)) continue;
        if (/(^|[\\/])(icons?|favicon|apple-touch|public[\\/]favicon)/i.test(path.relative(root, a)) && /favicon|apple-touch|icon-\d+/i.test(path.basename(a))) continue;
        const name = path.basename(a).toLowerCase();
        const stem = name.slice(0, -ext.length);
        const stemNoFrame = stem.replace(/[_-]?\d+$/, '');
        if (lowerCorpus.includes(name)) continue;
        if (stem.length >= 3 && new RegExp(`["'\`/\\\\]${escapeRe(stem)}["'\`]`).test(lowerCorpus)) continue;
        if (stemNoFrame.length >= 3 && stemNoFrame !== stem && lowerCorpus.includes(stemNoFrame)) continue;
        unused.push(a);
      }
      if (unused.length) {
        const shown = unused.slice(0, 15).map((u) => path.relative(root, u)).join(', ');
        add('assets', 'warn', 'unused-assets', `${unused.length} asset(s) never referenced by name (check dynamic paths before deleting): ${shown}${unused.length > 15 ? ', ...' : ''}`);
      }
    }

    // Credits / licences
    if (assets.length >= 5) {
      const top = listShallow(root, 2).map((f) => path.basename(f));
      if (!top.some((n) => /^(credits|third[_-]?party|licen[cs]es?|attribution|notices?|assets?[_-]?licen)/i.test(n))) {
        add('assets', 'warn', 'no-credits', 'no CREDITS / THIRD_PARTY_NOTICES file - record source, author, and licence for every external asset');
      }
    }
  }

  // Security: committed env files
  for (const f of ctx.files) {
    const b = path.basename(f);
    if (/^\.env(\..+)?$/.test(b) && !/example|sample|template/i.test(b)) {
      const gi = safeRead(path.join(root, '.gitignore'));
      const sev = /^\.env/m.test(gi) ? 'info' : 'error';
      add('security', sev, 'env-file', sev === 'error' ? '.env file present and not in .gitignore - secrets will be committed' : '.env file present (ignored by git) - never bundle it into the client build', f);
    }
  }
  const serverish = /express|fastify|socket\.io|\bws\b|colyseus|geckos|nakama|firebase|supabase|Netcode|Mirror|FishNet|Photon|MultiplayerAPI|ENetMultiplayerPeer|WebSocketMultiplayerPeer|Replicated|bevy_replicon|lightyear/i.test(code + JSON.stringify(ctx.deps));
  if (serverish) {
    if (!/zod|joi|yup|ajv|valibot|superstruct|typebox|schema|validate|Validate|sanitize|sanitise/i.test(code)) add('security', 'warn', 'no-validation', 'networking/backend detected but no schema validation found - validate every message');
    if (!/rate.?limit|throttle|cooldown|token.?bucket/i.test(code)) add('security', 'info', 'no-rate-limit', 'networking/backend detected but no rate limiting found');
    if (/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(corpus)) add('security', 'error', 'open-rules', 'Firebase rules allow public read/write');
  }
}

function listShallow(root, depth) {
  const out = [];
  const go = (dir, d) => {
    let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(dir, e.name);
      out.push(p);
      if (e.isDirectory() && d > 1 && !IGNORE_DIRS.has(e.name)) go(p, d - 1);
    }
  };
  go(root, depth);
  return out;
}

// ---------- output ----------

const PILLARS = ['physics', 'assets', 'ui', 'security', 'quality'];
const LABEL = { physics: 'Physics', assets: 'Assets', ui: 'UI', security: 'Security', quality: 'Quality' };
const TAG = { error: 'ERR ', warn: 'WARN', info: 'info' };

function printReport(root, ctx, findings, showAll) {
  const s = ctx.stats;
  console.log(`\ngame-taste audit  ${root}`);
  console.log(`engine: ${ctx.engine}${s.physicsLib ? ` (+${s.physicsLib})` : ''}   code: ${s.codeFiles} files / ${s.codeLines} lines   assets: ${Object.entries(s.assets).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}`);
  if (ctx.engine === 'unity' || ctx.engine === 'unreal') console.log('note: unused-asset detection skipped (references are GUID/binary based in this engine)');

  for (const p of PILLARS) {
    const list = findings.filter((f) => f.pillar === p);
    const counts = { error: 0, warn: 0, info: 0 };
    list.forEach((f) => counts[f.severity]++);
    console.log(`\n${LABEL[p].padEnd(9)} ${counts.error} error, ${counts.warn} warn, ${counts.info} info`);
    if (!list.length) { console.log('  (no findings - still review manually against the reference)'); continue; }
    const byRule = new Map();
    for (const f of list.sort((a, b) => sevRank(a.severity) - sevRank(b.severity))) {
      if (!byRule.has(f.rule)) byRule.set(f.rule, []);
      byRule.get(f.rule).push(f);
    }
    for (const [, group] of byRule) {
      const shown = showAll ? group : group.slice(0, PER_RULE_LIMIT);
      for (const f of shown) {
        const loc = f.file ? `  ${f.file}${f.line ? `:${f.line}` : ''}` : '';
        console.log(`  [${TAG[f.severity]}] ${f.message}${loc}`);
      }
      if (group.length > shown.length) console.log(`         ... +${group.length - shown.length} more ${group[0].rule} (use --all)`);
    }
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  console.log(`\n${findings.length} finding(s), ${errors} error(s). Heuristic scan: confirm each lead in code, then score with audit/scorecard.md.\n`);
}

function sevRank(s) { return s === 'error' ? 0 : s === 'warn' ? 1 : 2; }
function mask(s) { return s.length <= 10 ? s.slice(0, 3) + '***' : s.slice(0, 6) + '***' + s.slice(-3); }
function fmtBytes(n) { return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`; }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Run directly
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit().then((code) => process.exit(code));
}
