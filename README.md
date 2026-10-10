# ReMind

**게임이 "AI가 만든 티" 안 나게 만드는 에이전트 스킬** — Claude Code · Codex 등에서 사용.

taste-skill이 웹페이지의 AI 티를 없앤다면, ReMind는 **게임**을 다섯 가지 기준으로 판단하고 끌어올립니다. 주말 게임잼부터 수만 줄짜리 대형 프로젝트까지 규모에 맞춰 기준이 달라집니다.

| 기준 | 보는 것 |
|------|---------|
| **물리 (Physics)** | 고정 타임스텝, 프레임레이트 독립, 점프 공식 유도, 코요테 타임·입력 버퍼, CCD, 타격감(히트스톱·화면 흔들림) |
| **에셋 (Assets)** | 아트 바이블, 에셋 통일감, 재활용(팔레트 스왑·모듈 키트), 최적화(아틀라스·압축), 사운드 디자인, 라이선스 |
| **UI** | 게임 세계관에 맞는 테마 UI 키트, 상황별 HUD, 폰트, 컨트롤러·터치 대응, 필수 화면, 접근성 |
| **보안 (Security)** | 게임 성격에 맞는 위협 모델, 클라이언트 불신(서버가 결과 판정), 비밀키 노출, 메시지 검증, XSS/eval |
| **완성도 (Quality)** | 프레임 예산, 핫루프 무할당·오브젝트 풀, 시드 RNG, 예외 상황 대응, 테스트, 폴리싱 |

작업이 끝나면 에이전트가 **점수표(0–5점 × 5개 기준)** 를 보고하고, 최소 기준(floor)에 못 미치면 "완료"로 처리하지 않습니다.

## 설치

### Claude Code (모든 프로젝트)
```bash
npx github:growing7696-cmyk/ReMind
```

### 현재 프로젝트에만
```bash
npx github:growing7696-cmyk/ReMind --project
```

### Codex / 기타 에이전트
```bash
npx github:growing7696-cmyk/ReMind --codex
```
```bash
npx github:growing7696-cmyk/ReMind --all
```

### skills CLI 사용 시
```bash
npx skills add growing7696-cmyk/ReMind
```

### Claude Code 플러그인 마켓플레이스
```
/plugin marketplace add growing7696-cmyk/ReMind
/plugin install remind@remind
```

설치 후 에이전트 세션을 다시 시작하세요. 삭제:
```bash
npx github:growing7696-cmyk/ReMind uninstall
```

## 사용법

에이전트에게 그냥 말하면 됩니다:

- "ReMind로 이 게임 리뷰하고 점수표 줘"
- "Godot으로 2D 플랫포머 만들어줘" (게임 작업이면 자동으로 스킬이 적용됨)
- "물리랑 타격감 개선해줘", "UI 고급스럽게 바꿔줘", "멀티플레이 보안 점검해줘"

## 점검 스크립트 (audit)

의존성 없는 스캐너가 함께 들어 있습니다. 엔진을 자동 감지하고(Unity, Godot, Unreal, Three.js, Phaser, PixiJS, Babylon, Bevy, 웹 커스텀, C++) 기준별로 의심 지점을 표시합니다.

```bash
npx github:growing7696-cmyk/ReMind audit ./my-game
```

잡아내는 예시:
- 프레임 의존 이동, `setInterval` 게임 루프, Update/`_process` 안의 물리 호출, 고정 스텝 없음
- 클라이언트 번들 속 API 키, `innerHTML`/`eval`, 클라이언트가 보내는 점수, BinaryFormatter, 열린 Firebase 규칙
- 쓰이지 않는 에셋, 용량 큰 이미지·WAV, 크레딧/라이선스 파일 없음, 사운드 부족
- 이모지 아이콘, 기본 폰트, SaaS풍 그라데이션·글래스모피즘, `alert()`
- 거대 파일(god file), 시드 없는 랜덤, 일시정지·설정·볼륨·키 변경 없음, 테스트 없음

`--json`으로 기계가 읽을 수 있는 출력, 커밋된 비밀키 등 `error`가 있으면 종료 코드 1 (CI에 넣기 좋음). 휴리스틱이므로 결과는 "단서"이고, 에이전트가 코드를 읽어 확인합니다.

## 구조

```
skills/remind/
  SKILL.md                    핵심 규칙: 게임 읽기 → 규모 판단 → 5대 기준 → 워크플로 → 점수표
  reference/
    physics.md                고정 스텝 루프, 점프 공식, 충돌, 타격감, 결정론
    assets.md                 아트 바이블, 통일감, 재활용, 파이프라인, 오디오, 라이선스
    ui.md                     UI 모드, HUD, 타이포, 테마 키트, 모션, 입력, 접근성
    security.md               위협 등급(S0–S4), 서버 권한, 비밀키, 검증, 정보 누출
    quality.md                성능 예산, 메모리, 견고성, 테스트, 폴리싱
    large-projects.md         대형 프로젝트 구조, 문서 지도, AI 작업 규칙
    engines.md                엔진별 관용구
    ai-tells.md               AI 티 목록과 해결책
  audit/scorecard.md          점수 기준표
  scripts/audit.mjs           점검 스크립트
bin/cli.mjs                   npx 설치 CLI
test/run.mjs                  스캐너 자체 테스트 (npm test)
```

## English

**ReMind** is an anti-slop agent skill for games. It judges and raises five pillars — physics feel, asset utilization, premium UI, security, and production quality — and scales from jam games to large productions. Install with `npx github:growing7696-cmyk/ReMind` (Claude Code), `--project`, `--codex`, or `--all`, and audit any project with `npx github:growing7696-cmyk/ReMind audit <dir>`. Requires Node 18+.

## License

MIT
