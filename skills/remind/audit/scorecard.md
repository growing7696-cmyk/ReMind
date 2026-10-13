# Scorecard Rubric

Score each pillar from 0 to 5. Use the evidence (code read, audit script output, measured numbers), not impressions. Half points are allowed. Adjust expectations to the tier (T1 jam games are not penalised for missing settings menus; T3 games are).

## Physics
| Score | Evidence |
|-------|----------|
| 5 | Fixed step + interpolation; values derived and recorded in data; forgiveness mechanics fit the genre; CCD/sweeps on fast objects; layered juice; camera on interpolated positions with genre framing; debug overlay |
| 4 | Fixed step; data-driven tuning; good feel; one or two gaps (e.g. no interpolation or missing debug draw) |
| 3 | Frame-independent and stable; feel acceptable; magic numbers or missing CCD |
| 2 | Mostly works but jitter, inconsistent speeds, camera stutter, or physics in render callbacks somewhere |
| 1 | Frame-dependent movement, tunnelling, or unstable stacks |
| 0 | Physics broken or absent where the game needs it |
| n/a | Game has no physics or movement (e.g. pure card or text game) |

## Assets
| Score | Evidence |
|-------|----------|
| 5 | Art bible followed; cohesive; heavy reuse (swaps, kits, layering); optimized pipeline; full audio design; complete credits |
| 4 | Cohesive and optimized; good audio; minor unused files or missing variations |
| 3 | Mostly cohesive; some unused/unoptimized assets; basic audio; partial credits |
| 2 | Visible style clashes or large unoptimized files; thin audio |
| 1 | Mixed packs and densities, no audio design, unknown licences |
| 0 | Assets with licences that forbid this use |

## UI
| Score | Evidence |
|-------|----------|
| 5 | Themed kit; mixed UI modes; contextual HUD; full input parity; required screens; accessibility floor; motion and sound on every interaction |
| 4 | Themed and consistent; most screens and states; controller support; minor accessibility gaps |
| 3 | Readable and consistent; custom fonts; some states, screens, or input methods missing |
| 2 | Partly styled; default fonts in places; mouse-only |
| 1 | Default fonts, emoji icons, raw text overlays, web-dashboard styling |
| 0 | Unreadable or unusable |

## Security
| Score | Evidence |
|-------|----------|
| 5 | Correct class; server-authoritative where needed; schema validation, rate limits, auth everywhere; interest management; safe deserialisation; release builds stripped |
| 4 | No client trust for shared outcomes; validation and limits on main paths |
| 3 | No secrets in client; key outcomes validated; some limits or sanitising missing |
| 2 | Partial validation; client still trusted for some shared outcome |
| 1 | Client-trusted scores or currency in a shared game |
| 0 | Committed secret, open database rules, or unsanitised player HTML |
| n/a-ish | S0 offline games: score 4-5 when saves are validated and dependencies are sane; do not demand anti-cheat |

## Quality
| Score | Evidence |
|-------|----------|
| 5 | Measured budgets (p95/p99) met on target; pooled hot paths; robustness checklist passed; tests + CI; complete polish pass; architecture fits the tier |
| 4 | Smooth on target; most edge cases handled; tests for core logic; polish mostly done |
| 3 | Smooth on dev hardware; a few edge cases untested; little automated testing |
| 2 | Hitches, god files, or several missing basics (pause, settings, resize) |
| 1 | Frequent stutter or crashes on common actions |
| 0 | Does not run |

Floors, report template, and evidence tags are in `SKILL.md` §6.
