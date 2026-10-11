// Self-test: builds sloppy game fixtures in a temp dir and checks the audit catches the tells.
// Fake secrets are assembled at runtime so no secret-shaped string is committed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditScript = path.join(repo, 'skills', 'remind', 'scripts', 'audit.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'remind-test-'));

function write(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function audit(dir) {
  try {
    return { code: 0, out: JSON.parse(execFileSync('node', [auditScript, dir, '--json'], { encoding: 'utf8' })) };
  } catch (e) {
    return { code: e.status, out: JSON.parse(e.stdout) };
  }
}

let failed = 0;
function expect(cond, msg) {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failed++;
}

// --- web fixture ---
const web = path.join(tmp, 'web');
const fakeKey = ['sk', 'proj', 'A'.repeat(12) + 'b'.repeat(12)].join('-');
write(web, 'package.json', JSON.stringify({ name: 'bad', dependencies: { express: '4' } }));
write(web, 'index.html', '<canvas id=c></canvas><script src="main.js"></script>');
write(web, 'style.css', 'body { font-family: Arial, sans-serif; }\n.btn { background: linear-gradient(90deg, #6366f1, #8b5cf6); backdrop-filter: blur(8px); }\n');
const filler = Array.from({ length: 900 }, (_, i) => `const filler${i} = ${i};`).join('\n');
write(web, 'main.js', `
const OPENAI_KEY = "${fakeKey}";
let x = 0;
function update() {
  x += 5;
  const v = new THREE.Vector3();
  if (Math.random() > 0.5) x++;
  requestAnimationFrame(update);
}
requestAnimationFrame(update);
setInterval(spawnBullet, 16);
function showName(n) { hud.innerHTML = "<b>" + n + "</b>"; }
function gameOver() { alert("GAME OVER"); fetch("/api/score", { method: "POST", body: JSON.stringify({ score: x }) }); }
localStorage.setItem("gold", 999);
const icon = "❤️ Lives";
eval(levelData);
ctx.font = "20px Arial";
${'Math.random();\n'.repeat(12)}
${filler}
`);
write(web, 'assets/hero.png', 'png');
write(web, 'assets/unused_tree.png', 'png');
write(web, 'assets/a.png', 'png');
write(web, 'assets/b.png', 'png');
write(web, 'assets/c.png', 'png');
write(web, 'main-ref.js', 'load("hero.png"); load("a.png"); load("b.png"); load("c.png");');

const w = audit(web);
const rules = new Set(w.out.findings.map((f) => f.rule));
expect(w.out.engine === 'web:custom', `engine detected as web:custom (got ${w.out.engine})`);
expect(w.code === 1, 'exit code 1 when a secret is present');
for (const r of ['secret', 'frame-dependent', 'setinterval-loop', 'no-fixed-step', 'innerhtml', 'exec-untrusted',
  'native-dialog', 'client-score', 'local-economy', 'emoji-icon', 'default-font', 'saas-style', 'unseeded-rng',
  'god-file', 'no-pause', 'no-settings', 'no-audio', 'unused-assets', 'no-credits', 'no-validation', 'hot-alloc']) {
  expect(rules.has(r), `web: flags ${r}`);
}
const unused = w.out.findings.find((f) => f.rule === 'unused-assets');
expect(unused && /unused_tree/.test(unused.message) && !/hero\.png/.test(unused.message), 'web: unused list has unused_tree, not hero');
const secret = w.out.findings.find((f) => f.rule === 'secret');
expect(secret && !secret.message.includes(fakeKey), 'web: secret is masked in output');

// --- unity fixture ---
const unity = path.join(tmp, 'unity');
write(unity, 'ProjectSettings/ProjectVersion.txt', 'm_EditorVersion: 6000.0.0f1');
write(unity, 'Assets/Scripts/Player.cs', `
using UnityEngine;
public class Player : MonoBehaviour {
    Rigidbody rb;
    void Update() {
        rb.AddForce(Vector3.up);
        transform.position += Vector3.forward;
        var gm = GameObject.Find("GM");
    }
    void FixedUpdate() {
        rb.AddForce(Vector3.up);
    }
    void Save() { var f = new System.Runtime.Serialization.Formatters.Binary.BinaryFormatter(); }
}
`);
const u = audit(unity);
const ur = u.out.findings;
expect(u.out.engine === 'unity', `engine detected as unity (got ${u.out.engine})`);
expect(ur.filter((f) => f.rule === 'physics-in-update').length === 1, 'unity: AddForce in Update flagged once (FixedUpdate not flagged)');
expect(ur.some((f) => f.rule === 'frame-dependent'), 'unity: transform move without deltaTime flagged');
expect(ur.some((f) => f.rule === 'hot-lookup'), 'unity: GameObject.Find in Update flagged');
expect(ur.some((f) => f.rule === 'unsafe-deserialize' && f.severity === 'error'), 'unity: BinaryFormatter flagged as error');

// --- godot fixture ---
const godot = path.join(tmp, 'godot');
write(godot, 'project.godot', '[application]\nconfig/name="g"\n');
write(godot, 'player.gd', `extends CharacterBody2D

func _process(delta):
\tmove_and_slide()
\tposition += Vector2(1, 0)

func _physics_process(delta):
\tmove_and_slide()
`);
const g = audit(godot);
const gr = g.out.findings;
expect(g.out.engine === 'godot', `engine detected as godot (got ${g.out.engine})`);
expect(gr.filter((f) => f.rule === 'physics-in-process').length === 1, 'godot: move_and_slide in _process flagged once');
expect(gr.some((f) => f.rule === 'frame-dependent'), 'godot: position += without delta flagged');

// --- clean-ish fixture: no false errors ---
const clean = path.join(tmp, 'clean');
write(clean, 'main.js', `
const STEP = 1 / 60; let acc = 0, last = 0;
function frame(now) { const dt = Math.min((now - last) / 1000, 0.25); last = now; acc += dt;
  while (acc >= STEP) { simulate(STEP); acc -= STEP; } render(acc / STEP); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
el.textContent = playerName;
`);
const c = audit(clean);
expect(c.code === 0, 'clean: exit code 0');
expect(!c.out.findings.some((f) => ['frame-dependent', 'no-fixed-step', 'innerhtml', 'secret'].includes(f.rule)), 'clean: no physics/security false positives');

expect(c.out.tier === 'T1', `clean: tier guess T1 (got ${c.out.tier})`);

// --- lerp + suppression fixture ---
const misc = path.join(tmp, 'misc');
write(misc, 'cam.js', `
function update() { cam.x = lerp(cam.x, player.x, 0.1); }
function update2(dt) { cam.x = lerp(cam.x, player.x, 1 - Math.exp(-10 * dt)); }
// remind-ignore: innerhtml
el.innerHTML = trustedTemplate(x);
el.innerHTML = other(y); // remind-ignore: frame-lerp
`);
write(misc, 'Cam.cs', 'class C { void LateUpdate() { transform.position = Vector3.Lerp(transform.position, target.position, 0.1f); } }\n');
write(misc, 'vendor-lib/big.js', 'eval(x);\n');
write(misc, 'gen/out/x.js', 'eval(y);\n');
write(misc, '.remindignore', '# third-party\nvendor-lib/\ngen/**/*.js\n');
const m = audit(misc);
const mr = m.out.findings;
expect(mr.filter((f) => f.rule === 'frame-lerp').length === 2, 'misc: constant lerp flagged in JS and C#, dt-based lerp not flagged');
expect(mr.filter((f) => f.rule === 'innerhtml').length === 1, 'misc: remind-ignore suppresses only the named rule');
expect(m.out.stats.suppressed === 1, 'misc: suppressed count reported');
expect(!mr.some((f) => f.file && /vendor-lib|gen\//.test(f.file)), 'misc: .remindignore excludes paths and globs');

// --- roblox fixture ---
const rbx = path.join(tmp, 'roblox');
write(rbx, 'default.project.json', '{"name":"r","tree":{"$className":"DataModel"}}');
write(rbx, 'src/server/Shop.server.luau', `
local Remotes = game.ReplicatedStorage.Remotes
Remotes.AddCoins.OnServerEvent:Connect(function(player, amount)
\tplayer.leaderstats.Coins.Value += amount
end)
Remotes.Buy.OnServerEvent:Connect(function(player, itemId)
\tlocal price = Prices[itemId]
\tif typeof(price) ~= "number" then return end
\tplayer.leaderstats.Coins.Value -= price
end)
wait(1)
task.wait(1)
local answer = Remotes.Ask:InvokeClient(player)
`);
const r = audit(rbx);
const rr = r.out.findings;
expect(r.out.engine === 'roblox', `engine detected as roblox (got ${r.out.engine})`);
expect(rr.filter((f) => f.rule === 'remote-trust').length === 1, 'roblox: client amount written to leaderstats flagged once (server-priced buy not flagged)');
expect(rr.filter((f) => f.rule === 'deprecated-api').length === 1, 'roblox: wait() flagged, task.wait() not');
expect(rr.some((f) => f.rule === 'invoke-client'), 'roblox: InvokeClient flagged');

// --- engine detection ---
const det = (name, files) => { const d = path.join(tmp, 'det-' + name); for (const [k, v] of Object.entries(files)) write(d, k, v); return audit(d).out.engine; };
expect(det('love', { 'main.lua': 'function love.update(dt) end' }) === 'love2d', 'detects LÖVE');
expect(det('defold', { 'game.project': '[project]\ntitle = g' }) === 'defold', 'detects Defold');
expect(det('gm', { 'g.yyp': '{}' }) === 'gamemaker', 'detects GameMaker');
expect(det('kaplay', { 'package.json': JSON.stringify({ dependencies: { kaplay: '3' } }) }) === 'web:kaplay', 'detects Kaplay');

// --- CLI flag parsing ---
const help = execFileSync('node', [auditScript, '-h'], { encoding: 'utf8' });
expect(/Usage/.test(help), '-h prints usage instead of treating it as a directory');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
