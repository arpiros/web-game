# 게임 밸런스 분석 리포트

> 플레이테스트 및 수식 계산 기반 밸런스 평가 (2026-04-18)
> 5개 캐릭터(다크 나이트, 불꽃의 마법사, 신성한 성기사, 파도 무희, 광전사) 직접 플레이 + 데이터 분석

---

## 🔴 CRITICAL — 즉시 수정 필요

### ✅ BAL-01 · 보스 페이즈3 피해가 사실상 즉사 수준
- **관련 파일**: `src/game/data/enemies.ts` (dragon_lord bossPhases)
- **계산**:
  - dragon_lord 라운드7: 기본 ATK 300 × 1.6배율 = **480**
  - 페이즈3 `attack_all fire 2.8x` → 원소 저항 없는 캐릭터 파티 전체 **867 피해/액션**
  - 광전사(HP 1100, DEF 55) 기준 한 방에 **79% 피해**. 풀피 파티도 2액션에 전멸
- **수정 방향**: 페이즈3 `attack_all` 배율 하향
  - `2.8x` → `2.0x`
  - `2.5x` → `1.8x`

---

### ✅ BAL-02 · `barrier` 고정값이 후반 무의미
- **관련 파일**: `src/game/data/skills.ts` (barrier 스킬)
- **계산**:
  - 라운드3 엘리트(iron_golem) ATK 160 × 1.2 = 192, 공격 2.2x → 원시 426 피해
  - `barrier` 방어막 300 → 한 방에 소진 후 126 피해 통과
  - 라운드7에서는 방어막이 아예 무의미
- **수정 방향**: `flat 300` → `attack × 1.5` (attack 배율 기반 방어막)

---

### ✅ BAL-03 · `current_step` 과강
- **관련 파일**: `src/game/data/skills.ts` (current_step 스킬)
- **문제**:
  - 파티 전체 ATK +60% 2턴, CD3, MP30
  - 실질적으로 매 전투 2~3회 사용 가능
  - 성기사가 이것만 써도 파티 딜 60% 증가 → 다른 스킬 쓸 필요 없어짐
- **수정 방향**: CD3 → **CD5** 또는 버프량 60% → **40%**

---

## 🟡 MEDIUM — 캐릭터 간 격차

### ✅ BAL-04 · 성기사 딜 부재 — 전반부 강, 후반 급락
- **관련 파일**: `src/game/data/characters.ts`, `src/game/data/skills.ts`
- **문제**:
  - ATK 150 (전 캐릭터 최저)
  - `divine_judgment`(execute)이 보스 (`cc_immune`)에게 불가
  - 라운드5 이후 `barrier`도 고정값 문제로 약화
  - 결국 보스전에서 `current_step` 버퍼 역할만 남음
- **수정 방향**: ATK 160~170으로 상향 또는 순수 light 속성 단일 딜 스킬 1개 추가

---

### ✅ BAL-05 · 광전사 생존-딜 딜레마 실전 불가
- **관련 파일**: `src/game/data/skills.ts` (death_charge, blood_pact), `src/game/data/items.ts` (berserker_heart)
- **문제**:
  - `death_charge` + `berserker_heart` 시너지 이론상 강력 (HP 30% 이하에서 powerup 100%)
  - HP 30% = 330HP 구간에서 **1대 더 맞으면 사망**
  - 실전에서 시너지 발동 전에 죽는 경우가 대부분
- **수정 방향**: `blood_pact` HP 소모량 20% → **10%** 으로 낮춰 안전하게 저HP 진입 가능하도록

---

### ✅ BAL-06 · 마법사 생존력 붕괴 시점이 너무 이름
- **관련 파일**: `src/game/data/characters.ts` (fire_mage)
- **계산**:
  - HP 800, DEF 50
  - 라운드3 shadow_stalker(ATK 228) `attack_all dark 2.0x` 한 방 = **304 피해**
  - 2~3번이면 사망. MP 충분해도 죽어서 스킬 못 쓰는 상황 발생
- **수정 방향**: HP 800 → **950** 또는 DEF 50 → **70** 중 하나

---

## 🟢 LOW — 세부 조정

### BAL-07 · 독(poison) 비선형 강화 — 보스전 최고 효율
- **관련 파일**: `src/game/combat.ts` (독 틱 계산)
- **문제**:
  - 독이 HP% 기반이라 dragon_lord(HP 6400) 기준 **6%/턴 = 384 피해/턴**
  - 3턴 유지 시 1152 피해 — 보스전 최고 효율 딜이 됨
  - 독 특화 덱(마법사 + 파도 무희 조합)이 압도적으로 유리
- **수정 방향**: 독을 flat damage + % damage 혼합으로 변경하거나 % 상한 설정 (예: 최대 200/턴)

---

### BAL-08 · `mana_crystal` (공용 아이템) 완전히 무의미
- **관련 파일**: `src/game/data/items.ts`
- **문제**:
  - `mana_crystal` 5MP/턴 (common) vs `arcane_tome` 10MP/턴 (rare)
  - 같은 효과에서 2배 차이. 드래프트에서 선택 이유 없음
- **수정 방향**: `mana_crystal`에 부가 효과 추가 (예: DEF +10) 또는 8MP/턴으로 상향

---

### BAL-09 · `ice_witch` 동료 보스전 완전 무용
- **관련 파일**: `src/game/data/allies.ts` (ice_witch)
- **문제**:
  - 유일한 역할이 freeze(CC)인데 dragon_lord는 `cc_immune`
  - 라운드5 이후 획득 시 7라운드에 아예 사용 불가
- **수정 방향**: CC 불가 대상에게 대신 `defdown` 2턴 폴백 추가

---

### BAL-10 · `ancient_dragon` 동료 스펙 과강
- **관련 파일**: `src/game/data/allies.ts` (ancient_dragon)
- **문제**:
  - `attack fire 1.3x all`(전체 공격) ATK 200, fire 속성
  - 단일 공격 동료들과 비교할 때 AoE인데 배율도 비슷
  - legendary 등급이지만 rare `iron_guardian`(쉴드)보다 실전 기여 압도적
- **수정 방향**: `attack_all` 배율 1.3x → **1.0x** 또는 ATK 200 → **160**

---

## 우선순위 정리

| ID | 우선도 | 항목 | 제안 수치 |
|----|--------|------|-----------|
| BAL-01 | ✅ 완료 | 보스 Phase3 `attack_all` 배율 하향 | 2.8x→2.0x, 2.5x→1.8x |
| BAL-02 | ✅ 완료 | `barrier` → attack 배율 기반 | flat 300 → attack×1.5 |
| BAL-03 | ✅ 완료 | `current_step` CD 상향 | CD3 → CD5 |
| BAL-04 | ✅ 완료 | 성기사 ATK 상향 | ATK 150 → 165 |
| BAL-05 | ✅ 완료 | 광전사 `blood_pact` HP 소모 감소 | 20% → 10% |
| BAL-06 | ✅ 완료 | 마법사 내구도 상향 | HP 800 → 950 |
| BAL-07 | 🟢 선택 | 독 피해 상한 설정 | 최대 200/턴 |
| BAL-08 | 🟢 선택 | `mana_crystal` 부가 효과 추가 | +DEF 10 또는 8MP/턴 |
| BAL-09 | 🟢 선택 | `ice_witch` CC 불가 시 폴백 | defdown 2턴 |
| BAL-10 | 🟢 선택 | `ancient_dragon` 하향 | 배율 1.3x→1.0x |

---

## 총평

전체적으로 **중반(라운드3~5) 엘리트 구간 난이도 급상승**과 **후반 보스 순간 딜 과도함** 두 가지가 가장 큰 문제다.
초반 캐릭터 성능 격차도 있지만 드래프트로 어느 정도 보완되기 때문에,
**BAL-01~03 세 가지(보스 배율, barrier, current_step)만 수정해도 체감 밸런스가 크게 개선**될 것으로 판단된다.

---

---

# 재시뮬레이션 종합 레포트 (2026-04-26)

> 전투 공식(`rawATK × elementMult × (100/(100+DEF))`) 기반 5캐릭터 다회 시뮬레이션  
> 각 캐릭터별 R1→R10→R20→R30 구간 생존율·딜 효율 측정  

---

## A. 밸런스 분석

### A-1. 캐릭터 티어

| 티어 | 캐릭터 | 근거 |
|------|--------|------|
| **S** | 광전사 (berserker) | ATK 230 최고, `bloodlust` 가동 시 폭발적 딜 사이클. heavy_blow CD1로 매 2턴마다 2.0× 가능 |
| **A** | 불꽃의 마법사 (fire_mage) | AoE(`inferno`) + 점사(`annihilation`) 두 개의 빅딜기 보유. DEF 50이 문제지만 드래프트로 보완 가능 |
| **B+** | 신성한 성기사 (holy_paladin) | 힐+버프 지원으로 파티 생존율 1위. SPD 55 느린 것이 유일한 약점 |
| **B** | 다크 나이트 (dark_knight) | MP 100 부족으로 `shadow_strike` 연속 사용 한계. 후반 딜 딜레마 |
| **C+** | 파도 무희 (tide_dancer) | 힐+CC 역할인데 성기사와 피치는. 독립적 전투 아이덴티티 부재 |

### A-2. 캐릭터별 상세 이슈

**광전사 — heavy_blow CD1 과강**
- `heavy_blow` (20MP, CD1, 2.0× physical): 사실상 2턴마다 2.0× 공격 가능
- R10에서 `heavy_blow` → `slash` → `heavy_blow` 사이클: 2턴 평균 DPT = `(2.0×230 + 1.2×230) / 2 = 368`
- 비교: 다크 나이트 `shadow_strike`(CD1, 1.4×) 2턴 평균 DPT = `(1.4×180 + 1.2×180) / 2 = 234`
- **광전사 DPT가 다크 나이트보다 57% 높음**. `heavy_blow` CD1→CD2 조정 필요

**다크 나이트 — MP 100 병목**
- `shadow_strike` (15MP, CD1), `death_charge` (20MP, CD2), `soul_drain` (25MP, CD3)
- 패시브 MP 재생(+3/턴) + 턴 종료 보너스(+8) = 최대 11MP/턴
- `shadow_strike` 2턴 1회 = 7.5MP/턴 소모 → 다른 스킬 쓸 여유 없음
- MP 100 → 120 상향 시 심리적 여유 확보

**성기사 — SPD 55 행동 지연**
- SPD 55는 전 캐릭터 최저. 대부분 적이 먼저 행동
- R15 이후 적 ATK가 높아지면 성기사가 버프/힐 시전 전에 파티원이 사망하는 케이스 증가
- SPD 55 → 65로 상향 시 행동 순서 개선 (R20 frost_giant SPD 60 기준 역전 가능)

**마법사 — DEF 50 취약성**
- R6 LATE 풀 진입 후 `elder_troll`(ATK 155) `slash_all` 2.0× → 248 AoE 피해
- 마법사 최대 HP 950 기준 26%를 한 방에 소모, 3~4번이면 위험
- 방어 아이템 없이 R15+ 생존이 어렵고 드래프트 의존도 과도

**파도 무희 — 역할 정체성 모호**
- `heal_water`(35MP 힐), `cleanse`(상태이상 해제), `water_lance`(딜) 모두 준수하지만 어느 것도 특출나지 않음
- 성기사와 힐 역할이 겹치고, CC는 성기사의 `holy_strike` 시너지나 동료로 대체 가능
- 가장 큰 문제: **기본기 `basic_splash` 0.8×가 0MP인데도 `water_lance` 10MP 1.3×를 고를 이유가 없는 구간이 존재**

### A-3. MP 경제 비교

| 캐릭터 | maxMP | 핵심 스킬 MP/사용 | 패시브+종료 재생/턴 | 최대 가동률 |
|--------|-------|-------------------|---------------------|-------------|
| 광전사 | 120 | heavy_blow 20 | 11 | 2.2턴/사용 → 높음 |
| 마법사 | 140 | fireball 25 | 11 | 2.3턴/사용 → 높음 |
| 성기사 | 130 | divine_heal 35 | 11 | 3.2턴/사용 → 중간 |
| 파도 무희 | 140 | heal_water 35 | 11 | 3.2턴/사용 → 중간 |
| 다크 나이트 | 100 | shadow_strike 15 | 11 | 1.4턴/사용 → **병목** |

### A-4. 스킬 효율 이상치

| 스킬 | MP | CD | 효과 | 이슈 |
|------|----|----|------|------|
| `heavy_blow` | 20 | **1** | 2.0× physical | CD1이 너무 짧음. 사실상 번갈아 사용 가능 |
| `bloodlust` | 20 | 3 | 1.5× + powerup 60%/3턴 | powerup 지속 중 모든 공격 +60% → 연속 컴보 폭딜 |
| `current_step` | 30 | 5 | 파티 ATK +60%/2턴 | CD 이전 5로 수정됨. 현재 적정 |
| `arcane_focus` | 0 | 4 | mana_regen 8/턴 3턴 | 0MP로 MP 24 회복. 비용 없음 |
| `divine_heal` | 35 | 3 | heal 1.8× | 성기사 ATK 185 기준 회복량 333. 과도하게 강력 |

### A-5. 적 스케일링 R6 절벽

- R5까지: EARLY+MID_EASY+MID_HARD 풀 (최대 ATK ~160)
- **R6부터**: LATE 풀 진입 → `elder_troll` ATK 155, `lich` ATK 185, `frost_giant` ATK 195(DEF 145!)
- R6 라운드 스케일: `1 + 5 × 0.03 = 1.15`. `lich` 실제 ATK = `185 × 1.15 = 212`
- 파도 무희(HP 950, DEF 70) 기준 lich 공격: `212 × (100/170) = 125 피해` = 13%/격
- 방어막 없으면 7~8번에 사망. 적 행동이 파티원 4명보다 느릴 때만 안전

---

## B. 컨텐츠 부족 부분

### B-1. 이벤트 4종 반복

- 현재 이벤트: `abandoned_campfire`, `cursed_altar`, `wandering_merchant`, `ancient_library` (4종)
- EVENT_ROUNDS: 3, 7, 12, 18, 24 (총 5회)
- 5회 이벤트에서 4종 풀 → 최소 1종은 반드시 중복 등장
- 이벤트 다양성이 런 전략에 직접 영향을 주는 핵심 시스템임에도 4종은 과도하게 적음
- **권장**: 최소 8종 이상 (전투/탐험/상인/저주/회복/지식/동료/비밀 각 카테고리)

### B-2. Light/Water 속성 적 부족

| 속성 | 적 수 | 목록 |
|------|-------|------|
| dark | 5종 | shadow_wolf, lich, dark_vampire, void_lord, abyssal_horror |
| physical | 6종+ | goblin, orc, iron_golem, cursed_knight, frost_giant, bone_colossus 등 |
| fire | 3종 | fire_sprite, inferno_golem, dragon_lord |
| **light** | **2종** | storm_giant(엘리트), celestial_sentinel |
| **water** | **3종** | ice_golem, frost_giant, sea_serpent |

- 성기사(light)와 파도 무희(water)는 원소 시너지가 발동할 적이 적어 원소 매칭 전략 의미 퇴색
- `steam_explosion` 시너지(fire+water 적 상태이상 추가 피해)도 fire/water 적이 함께 나올 빈도 낮음

### B-3. 동료 기능 중복

| 기능 | 동료 1 | 동료 2 | 차이 |
|------|--------|--------|------|
| revive_party | `guardian_angel` (50%) | `revival_shrine` (35%) | 수치 차이만 |
| shield_party | `iron_guardian` (80) | `frost_guardian` (70) | 수치 차이만 |
| buff_party | `battle_bard` (30%/2턴) | `war_herald` (50%/3턴) | 수치 차이만 |

- 3개 기능 각 2종 = 6종이 기능적으로 동일
- 총 17종 동료 중 6종(35%)이 중복 → 드래프트 선택 의미 감소
- **권장**: 각 기능의 약한 버전을 차별화하거나 신규 역할 추가

### B-4. 크래프트 UI 접근성 부재

- 크래프트 시스템이 존재하지만 드래프트 화면에서만 접근 가능
- 레시피 확인 화면이 없어 어떤 조합이 가능한지 플레이어가 알 수 없음
- 결과물 17종의 존재 자체를 모르는 채로 런이 종료되는 케이스 다수 예상

### B-5. 미니보스 구간 부재

- R5, R10, R15, R20, R25 엘리트 라운드 → 1.2× 스탯 엘리트 + 일반 적 조합
- R30 보스(dragon_lord) 이전까지 **진짜 중간 보스가 없음**
- 엘리트 라운드와 보스 라운드 사이의 긴장감 부재. 특히 R20~29 구간이 단조로움

### B-6. 결과 화면 통계 없음

- 승리/패배 화면에 최종 스킬, 아이템, 동료 목록이 없음
- 총 피해, 총 힐, 가장 많이 사용한 스킬 등 통계 없음
- 플레이어가 자신의 빌드를 회고하고 다음 런 전략을 세울 수 없음

---

## C. 개선/수정 필요 사항

### C-1. `heavy_blow` CD 조정 (HIGH)

- **파일**: `src/game/data/skills.ts`
- **변경**: `cooldown: 1` → `cooldown: 2`
- **근거**: CD1은 `slash`(CD0)와 번갈아 쓰면 매 2턴 1회, 실질적으로 CD0에 가까움. CD2로 상향 시 3턴 1회로 적정화

### C-2. `dark_knight` maxMp 상향 (MEDIUM)

- **파일**: `src/game/data/characters.ts`
- **변경**: `maxMp: 100` → `maxMp: 120`
- **근거**: MP 병목으로 `shadow_strike` 외 스킬 가동이 어려움. 20 상향으로 `soul_drain` 가끔 사용 가능

### C-3. `holy_paladin` SPD 상향 (MEDIUM)

- **파일**: `src/game/data/characters.ts`
- **변경**: `speed: 55` → `speed: 65`
- **근거**: 현재 전 캐릭터 최저 속도로 버프/힐 시전 전 파티원 사망 리스크. 65로 올리면 R20 이전 대부분 적보다 빠름

### C-4. R6~12 LATE 풀 진입 지연 (HIGH)

- **파일**: `src/game/data/enemies.ts` (스폰 풀 배열)
- **변경**: MID_EASY+MID_HARD+LATE(R6~12) → LATE는 R10+로 지연
- **근거**: R6 LATE 풀 진입이 너무 급격. R6~9는 MID_HARD 중심으로 점진적 상승이 필요

### C-5. `tide_dancer` 기본기 차별화 (LOW)

- **파일**: `src/game/data/characters.ts`, `src/game/data/skills.ts`
- **변경**: `basic_splash` 0.8× → `riptide` 0.8× water + 다음 턴 0.4× 추가 피해 패시브 효과
- **근거**: 기본기가 여타 캐릭터 기본기와 동일한 0.8×. 파도 무희 아이덴티티 강화를 위한 최소 차별화

### C-6. Light/Water 속성 적 추가 (MEDIUM)

- **파일**: `src/game/data/enemies.ts`
- **권장 추가**:
  - `tidal_serpent` (water, MID_HARD): HP 1400, ATK 145, speed 90 — 빠른 물 속성 적
  - `radiant_guardian` (light, LATE): HP 2200, ATK 170, DEF 100 — 방어형 빛 속성 적
- **근거**: light/water 속성 적이 각 2~3종으로 원소 시너지 활용 빈도 부족

### C-7. 이벤트 종류 확장 (MEDIUM)

- **파일**: `src/game/data/events.ts`
- **권장 추가** (우선순위 순):
  1. `mysterious_forge` — 스킬 강화 이벤트 (스킬 1개 CD 1 감소 또는 damage multiplier +0.2)
  2. `battle_memorial` — 사망한 동료를 약한 형태로 부활 or 영구 ATK +10
  3. `shadow_market` — HP 15% 소모 시 희귀 아이템 획득 선택지
  4. `ancient_ruins` — 크래프트 재료(스킬 파편) 획득 또는 함정 피해

### C-8. 차별화 동료 신규 추가 (LOW)

- **파일**: `src/game/data/allies.ts`, `src/game/types.ts`
- **권장 신규 역할**:
  - `elemental_absorber` — 피격 시 해당 원소 면역 1턴 부여 (reactive_shield 타입)
  - `combo_striker` — 파티원이 스킬 시전 후 30% 확률로 추가 물리 공격 (reaction 타입)
- **근거**: 현재 17종 동료가 attack/heal/buff/shield/revive 5가지 역할만 커버. 반응형 역할 부재

---

## D. 우선순위 종합 표

| ID | 긴급도 | 항목 | 작업 파일 | 공수 |
|----|--------|------|-----------|------|
| C-1 | 🔴 HIGH | `heavy_blow` CD 1→2 | skills.ts | 5분 |
| C-4 | 🔴 HIGH | LATE 풀 진입 R6→R10 | enemies.ts | 15분 |
| C-2 | 🟠 MED | `dark_knight` MP 100→120 | characters.ts | 5분 |
| C-3 | 🟠 MED | `holy_paladin` SPD 55→65 | characters.ts | 5분 |
| C-6 | 🟠 MED | light/water 적 2종 추가 | enemies.ts | 1시간 |
| C-7 | 🟠 MED | 이벤트 4→8종 | events.ts | 2~3시간 |
| C-5 | 🟡 LOW | `tide_dancer` 기본기 차별화 | characters.ts, skills.ts | 30분 |
| C-8 | 🟡 LOW | 차별화 동료 2종 신규 | allies.ts, types.ts | 1~2시간 |
| B-4 | 🟡 LOW | 크래프트 레시피 확인 UI | DraftScreen.tsx | 1시간 |
| B-5 | 🟡 LOW | 미니보스 구간 설계 | enemies.ts, run.ts | 3~4시간 |
| B-6 | 🟡 LOW | 결과 화면 통계 추가 | ResultScreen.tsx | 1~2시간 |
