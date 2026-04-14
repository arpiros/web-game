# 게임 개선 계획 (Game Improvement Plan)

> 작성일: 2026-04-12 / 최종 정리: 2026-04-13  
> 기준 버전: Dark Fantasy Roguelike v0.x  
> 이 문서는 게임의 재미 요소와 완성도를 높이기 위한 추가 개발 항목을 체계적으로 정리한다.

---

## 현재 구현 상태 요약

| 영역 | 구현 완료 |
|------|-----------|
| 캐릭터 | 5종 (칠흑의 기사, 불꽃의 마법사, 빛의 성기사, 조류 무희, 광전사) |
| 스킬 | 42종 (물리/화염/수/어둠/빛/유틸 + 캐릭터 전용 10종 추가) |
| 적 | 16종 (early 3+1 / mid 4+2 / late 3+2 / 보스 2) |
| 동료 | 12종 (기본 8 + 신규 4) |
| 아이템 | 27종 (기본 15 + 신규 12) |
| 상태이상 | 12종 (poison, burn, freeze, stun, shield, regen, powerup, defdown, mana_regen, cc_immune, undying, miss_immune) |
| 라운드 | 7라운드 (라운드 7 = 보스 dragon_lord) |
| 드래프트 | 전투 후 3장 선택 (스킬/동료/아이템) |
| MP 시스템 | 자동재생(+3/턴) + 턴 종료보너스(+8) + 킬보너스(+5) + mana_regen + mp_regen 아이템 |
| 전투 피드백 | 크리티컬/미스 시스템 + 데미지 팝업 애니메이션 |

---

## ✅ 완료된 Phase

### Phase 1-1. 자동 MP 재생 + 턴 종료 MP 보너스 _(커밋: c59f55a)_

- 패시브 MP 재생: 매 플레이어 턴 시작 시 +3 (`PASSIVE_MP_REGEN_PER_TURN`)
- 턴 종료 보너스: "턴 종료" 클릭 시 +8 (`END_TURN_MP_BONUS`)
- `regenPartyMp(state, amount, logMessage)` 헬퍼 함수 (생존 캐릭터 전체, maxMp 상한)

### Phase 1-2. 크리티컬 / 미스 시스템 _(커밋: a218e75)_

- 크리티컬 확률 = 10% + (speed / 500) * 15% (최대 25%), 배율 1.5x
- 미스 확률 = 5% + (defense / 1000) * 10% (최대 15%), 피해 0
- `rollCombat`, `DamageResult { damage, isCrit, isMiss }` 구현
- 배틀 로그에 crit(금색) / miss(회색) 표시

### Phase 1-3. 데미지 팝업 (Floating Numbers) _(BattleScreen.tsx)_

- `DamagePopup` 컴포넌트: 데미지(빨강), 크리티컬(주황+크게), 미스(회색), 회복(초록)
- 1초 위로 이동 + 페이드아웃 애니메이션

### Phase 2-1. 신규 스킬 추가 (+10종)

`void_blade`, `blood_pact`, `mana_burst`, `phoenix_rebirth`, `holy_aura`, `divine_judgment`, `tsunami_dance`, `current_step`, `bloodlust`, `death_charge` 모두 구현 완료

### Phase 2-2. 신규 아이템 추가 (+12종)

`vampire_ring`, `ancient_scroll`, `elemental_core`, `storm_cloak`, `cursed_necklace`, `revival_potion`, `magic_antidote`, `time_sand`, `heroes_crest`, `twin_wings` + 기존 강화 아이템 포함 총 27종

### Phase 2-3. 신규 적 추가 (+6종)

`skeleton_archer`, `flame_phoenix`, `dark_vampire`, `frost_giant`, `poison_hydra`, `void_lord` 모두 구현 완료 (총 16종)

### Phase 2-4. 신규 동료 추가 (+4종)

`storm_mage`, `guardian_angel`, `poison_witch`, `battle_bard` 모두 구현 완료 (총 12종)

---

## Phase 1 — 전투 피드백 & 조작감 개선 (미완료 항목)

> 우선순위: **높음**

### 1-4. 원소 시너지 시스템 (Elemental Synergy)

**현재**: 원소 상성이 단순 배율(fire > physical 등)만 존재  
**개선**: 특정 원소 조합으로 보너스 시너지 발동

```
시너지 조건 (파티 원소 조합 기준):
  fire + water  → "증기 폭발": 동결 상태 적에게 화염 데미지 150%
  dark + light  → "카오스": 매 턴 시작 시 랜덤 적에게 15% HP 피해
  physical + dark → "파멸의 일격": 크리티컬 발생 시 독(3턴) 자동 부여
  water + light → "성수": 회복 스킬 효과 +30%
```

**신규 파일**: `src/game/synergy.ts`  
**변경 파일**: `src/game/combat.ts`, `src/screens/BattleScreen.tsx`

---

### 1-5. 캐릭터별 가중치 드래프트

**현재**: 모든 스킬/아이템이 균등 확률로 제시  
**개선**: 플레이어 캐릭터 원소/클래스에 맞는 카드가 더 자주 등장

```
캐릭터 원소 = 화염이면:
  화염 계열 스킬 가중치 2x
  화염 강화 아이템 가중치 2x
  다른 원소 스킬 가중치 0.5x
```

**변경 파일**: `src/game/run.ts`, `src/game/rng.ts`

---

### 1-6. 전투 속도 조절

**현재**: 애니메이션 딜레이 고정  
**개선**: UI에서 1x / 1.5x / 2x 속도 선택 가능

**변경 파일**: `src/state/runStore.ts`, `src/screens/BattleScreen.tsx`

---

## Phase 3 — 게임플레이 구조 확장 (Gameplay Structure)

> 우선순위: **중간**

### 3-1. 이벤트 시스템 (Random Events)

전투와 드래프트 사이에 10~20% 확률로 랜덤 이벤트 등장.

```
이벤트 예시:
  [신비한 상인] HP를 200 소비해 희귀 아이템 1개 획득
  [저주의 제단]  현재 스킬 1개를 희생해 레전더리 스킬 획득
  [회복의 샘]   전투 전 HP/MP 완전 회복
  [어둠의 계약]  이번 전투 적 공격력 +50%, 클리어 시 추가 드래프트 1회
  [버려진 장비]  무작위 아이템 2개 중 1개 선택
```

**신규 파일**: `src/game/events.ts`, `src/screens/EventScreen.tsx`  
**변경 파일**: `src/game/types.ts` (`RunPhase`에 `'event'` 추가), `src/game/run.ts`, `src/App.tsx`

---

### 3-2. 엘리트 전투 시스템 (Elite Encounters)

```
엘리트 조건:
  - 일반 적 1마리 + HP/공격력 1.5x 강화
  - 엘리트 전용 패턴 추가 (분노: HP 50%이하 시 공격력 2x)
  - 클리어 시 드래프트 카드 4장 (기본 3장 대신)
```

**변경 파일**: `src/game/run.ts`, `src/game/data/enemies.ts`

---

### 3-3. 보스 다단계 패턴 (Boss Phases)

```
dragon_lord 페이즈:
  [페이즈 1] HP 100%~60%: 일반 패턴 (현재와 동일)
  [페이즈 2] HP 60%~30%: 전체 화염 공격 추가, 공격력 버프 빈도 증가
  [페이즈 3] HP 30%~0%:  매 턴 파티 전체 화상 + 단독 강타, 분노(cc_immune 발동)
```

**변경 파일**: `src/game/data/enemies.ts`, `src/game/combat.ts`

---

### 3-4. HP 회복 선택지 추가

```
옵션 A: [드래프트 대신 회복]  드래프트를 포기하고 HP 최대치의 30% 회복 선택 가능
옵션 B: [안식의 불꽃]         이벤트 중 하나로 회복 샘 추가 (Phase 3-1과 연계)
옵션 C: [아이템 효과]         아이템 중 "전투 후 HP 소량 회복" 추가
```

---

## Phase 4 — 메타 진행 시스템 (Meta Progression)

> 우선순위: **중간**

### 4-1. 런 스코어 & 통계

```
통계 항목:
  - 총 입힌 피해 (이미 구현: totalDamage)
  - 최고 단타 데미지
  - 크리티컬 횟수 / 미스 횟수
  - 총 회복량
  - 클리어 턴 수 합산
  - 사용한 스킬 TOP 3
  - 획득한 아이템 목록
```

**변경 파일**: `src/game/types.ts`, `src/screens/ResultScreen.tsx`

---

### 4-2. 업적 시스템 (Achievements)

```
업적 예시:
  [불사신]       HP 100 이하로 생존하며 전투 클리어
  [완벽한 일격]  크리티컬로 보스에게 1000 이상 피해
  [영웅의 귀환]  5번의 런 완주
  [마나 마스터]  MP를 고갈시키지 않고 클리어
  [원소 지배자]  모든 원소 속성 스킬 사용
  [무결점]       미스 없이 클리어
```

**신규 파일**: `src/state/achievementStore.ts`, `src/screens/AchievementScreen.tsx`

---

### 4-3. 도전 모드 (Challenge Mode)

```
도전 조건 예시:
  [이단자 모드]   아이템 드래프트 없음
  [광기 모드]     적 HP 2x, 적 공격력 1.5x
  [제한 모드]     스킬 슬롯 최대 3개
  [순수 모드]     동료 없이 단독 클리어
```

---

### 4-4. 캐릭터 잠금 해제

```
해금 조건 예시:
  빛의 성기사: 첫 번째 클리어
  조류 무희:   물 원소 적을 50마리 처치
  광전사:      HP 200 이하로 보스 처치
```

**변경 파일**: `src/state/runStore.ts`, `src/screens/CharacterSelectScreen.tsx`

---

## Phase 5 — UI/UX 완성도 (Polish)

> 우선순위: **중간~낮음**

### 5-1. 설정 메뉴

```
설정 항목:
  - 전투 속도 (1x / 1.5x / 2x)  ← Phase 1-6 연계
  - 배틀 로그 크기 (10줄 / 20줄 / 30줄)
  - 애니메이션 ON/OFF
  - 데미지 팝업 ON/OFF
```

**신규 파일**: `src/screens/SettingsScreen.tsx`  
**변경 파일**: `src/state/runStore.ts`

---

### 5-2. 인벤토리 / 파티 정보 패널

```
추가할 정보:
  - 보유 아이템 전체 목록 (드래프트 화면 내)
  - 현재 파티 스탯 합산 보기
  - 동료별 상세 능력치
  - 현재 적용 중인 아이템 효과 목록
```

---

### 5-3. 튜토리얼 / 첫 플레이 가이드

```
구성:
  - 캐릭터 선택 화면: 각 캐릭터 플레이스타일 설명
  - 첫 번째 전투: 단계별 힌트 오버레이 (스킬 선택 → 타겟 선택 → 실행)
  - 드래프트 화면: 카드 유형(스킬/동료/아이템) 설명
  - 원소 상성 간략 안내 차트
```

---

### 5-4. 사운드 효과 (Sound Effects)

```
효과음 대상:
  - 스킬 사용 (원소별 다른 효과음)
  - 크리티컬 히트
  - 미스
  - 적 처치
  - 드래프트 카드 선택
  - 보스 등장
  - 승리 / 패배
```

Web Audio API 또는 Howler.js 사용.

---

### 5-5. 키보드 단축키

```
전투 화면:
  1~6:    해당 슬롯 스킬 선택
  Enter:  선택한 스킬로 첫 번째 적 공격
  Tab:    다음 타겟 선택
  Space:  턴 종료

드래프트 화면:
  1~3:    해당 카드 선택
```

---

## Phase 6 — 고급 시스템 (Advanced Systems)

> 우선순위: **낮음** (아이디어 차원의 미래 기능)

### 6-1. 번개(Lightning) 원소 추가

현재 5원소(physical, fire, water, dark, light)에 번개 추가.

```
번개 상성:
  강함: water (전도), physical
  약함: dark, earth(추가 시)

번개 고유 효과: 연쇄 공격 (적중 시 30% 확률로 인접 적에게 50% 피해)
```

---

### 6-2. 스킬 강화 시스템 (Skill Upgrade)

드래프트에서 이미 보유한 스킬을 다시 선택하면 강화.

```
강화 레벨 1 → 2:
  damage 스킬: 배율 +0.3
  heal 스킬: 배율 +0.5
  apply_status: 지속 +1턴
```

---

### 6-3. 동료 관계 시스템 (Ally Synergy)

특정 동료 조합 시 보너스 효과.

```
조합 예시:
  [성직자 + 성기사]  치유량 +20%
  [암살자 + 궁수]   크리티컬 확률 공유 (+5%)
  [화염 정령 + 고대 용]  화염 피해 +15%
```

---

### 6-4. 무한 모드 / 엔드리스 런

7라운드 클리어 후 계속 진행할 수 있는 모드.

```
- 라운드 8 이상: 적 스탯 추가 강화 (매 라운드 +15%)
- 특수 보스 사이클 (dragon_lord → lich → dragon_lord+2마리 → ...)
- 런 종료 없이 높은 점수 도전
```

---

## 개발 우선순위 요약 (미완료 항목)

| 우선순위 | Phase | 예상 난이도 | 효과 |
|----------|-------|------------|------|
| ⭐⭐ 높음 | 1-4: 원소 시너지 | 중간 | 전략성 ↑↑ |
| ⭐⭐ 높음 | 1-6: 전투 속도 | 낮음 | QoL ↑↑ |
| ⭐⭐ 높음 | 3-1: 이벤트 시스템 | 높음 | 런 다양성 ↑↑ |
| ⭐⭐ 높음 | 3-3: 보스 다단계 | 중간 | 보스전 긴장감 ↑ |
| ⭐ 중간 | 4-1: 런 통계 | 낮음 | 만족감 ↑ |
| ⭐ 중간 | 4-2: 업적 | 중간 | 장기 목표 ↑ |
| ⭐ 중간 | 3-2: 엘리트 전투 | 중간 | 긴장감 ↑ |
| ⭐ 중간 | 5-3: 튜토리얼 | 중간 | 접근성 ↑ |
| ⭐ 중간 | 5-4: 사운드 | 높음 | 몰입감 ↑↑ |
| △ 낮음 | Phase 6-x: 고급 시스템 | 매우 높음 | 장기 목표 |

---

## 수정 대상 파일 (미완료 Phase)

| 파일 | 관련 Phase |
|------|-----------|
| `src/game/types.ts` | 3-1, 4-1 |
| `src/game/combat.ts` | 1-4, 3-3 |
| `src/game/run.ts` | 1-5, 3-1, 3-2 |
| `src/game/rng.ts` | 1-5 |
| `src/game/data/enemies.ts` | 3-3 |
| `src/state/runStore.ts` | 1-6, 4-4 |
| `src/screens/BattleScreen.tsx` | 1-6 |
| `src/screens/ResultScreen.tsx` | 4-1 |
| `src/screens/CharacterSelectScreen.tsx` | 4-4 |
| `src/App.tsx` | 3-1 |
| `src/game/synergy.ts` | 1-4 (신규) |
| `src/game/events.ts` | 3-1 (신규) |
| `src/screens/EventScreen.tsx` | 3-1 (신규) |
| `src/state/achievementStore.ts` | 4-2 (신규) |
| `src/screens/AchievementScreen.tsx` | 4-2 (신규) |
| `src/screens/SettingsScreen.tsx` | 5-1 (신규) |
