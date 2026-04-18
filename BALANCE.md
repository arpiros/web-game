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
