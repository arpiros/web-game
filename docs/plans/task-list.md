# 작업 리스트 (2026-04-26 기준)

> 교차검증 기준: work-log.md 커밋 기록 + 실제 코드 상태

---

## 🔴 HIGH — 즉시 처리 권장

| ID | 항목 | 파일 | 상태 |
|----|------|------|------|
| HIGH-01 | dragon_lord Phase3 진입 시 배틀 로그 경고 + 화면 플래시 | BattleScreen.tsx, combat.ts | 미완료 |
| HIGH-02 | 0MP 기본 공격 배율 상향 (65% → 80%) | data/skills.ts | ✅ 완료 |
| HIGH-03 | 엘리트 처치 후 HP 10% 회복 추가 | run.ts | ✅ 완료 |

---

## 🟠 MEDIUM — 밸런스 (balance-improvement.md Phase 1~5)

| ID | 항목 | 비고 | 상태 |
|----|------|------|------|
| BL-P1 | cursed_knight 힐 너프 (heal 0.5→0.28, 4턴 주기, HP 850, ATK 160) | | ✅ 완료 |
| BL-P2 | 광전사 시작 스킬에 bloodlust 추가 + cleave MP 25→20 | BAL-05(blood_pact)와 별개 | ✅ 완료 |
| BL-P3 | 성기사 ATK 185 / maxHp 1400 / speed 55 / maxMp 130 | BAL-04(ATK 165) 이후 추가 버프 | ✅ 완료 |
| BL-P4 | MID 풀 R3에서 cursed_knight·dark_vampire 미등장 + R3 적 수 2→1 | VICTORY_HEAL 40%는 이미 달성 | ✅ 완료 |
| BL-P5 | R1~4 생존 아이템 가중치 +2 (run.ts generateDraftOptions) | | ✅ 완료 |
| MED-02 | water/light 속성 적 1~2종 추가 | data/enemies.ts | 미완료 |
| MED-03 | revive_party 대기 상태 배틀 로그 표시 | combat.ts | 미완료 |

---

## 🟡 UX 이슈 (issues.md)

| ID | 우선순위 | 항목 | 상태 |
|----|----------|------|------|
| UX-01 | Medium | 스킬 선택 시 "적을 선택하세요" 안내 텍스트 | 미완료 |
| UX-02 | Low | 파티 패널 DEF 수치 표시 | 미완료 |
| UX-03 | Low | 캐릭터 선택 화면 SPD 스탯 추가 | 미완료 |
| UX-04 | Low | 드래프트 화면 "다음 라운드: 엘리트" 배지 | 미완료 |
| UX-05 | Low | 사망 적 카드 애니메이션 후 DOM 제거 | 미완료 |
| UX-06 | Low | 이벤트 선택지 hover 시 효과 툴팁 | 미완료 |
| UX-07 | Low | 보스 페이즈 전환 로그 강조 + 화면 플래시 | 미완료 |
| LOW-01 | Low | 쿨다운 숫자 오버레이 / MP 부족 빨강 구분 | 미완료 |
| LOW-02 | Low | 드래프트 동료 공격력 수치 표시 | 미완료 |
| LOW-04 | Low | 결과 화면 최종 스킬·아이템·동료 목록 | 미완료 |

---

## 🔵 기능 확장 (improvement-plan.md Phase 3~6)

| ID | 항목 | 비고 | 상태 |
|----|------|------|------|
| 3-4 | 드래프트 대신 HP 30% 회복 UI | 백엔드/store 완료 — DraftScreen UI 노출만 필요 | 미완료 |
| 5-4 ⭐⭐ | 사운드 효과 | | 미완료 |
| 5-1 ⭐ | 설정 메뉴 화면 | | 미완료 |
| 5-2 ⭐ | 인벤토리/파티 정보 패널 | | 미완료 |
| 5-3 ⭐ | 튜토리얼 | | 미완료 |
| 5-5 ⭐ | 키보드 단축키 | | 미완료 |
| 4-2 ⭐ | 업적 시스템 | | 미완료 |
| 4-4 ⭐ | 캐릭터 잠금 해제 | | 미완료 |

---

## 🟢 선택적 밸런스 (balance-analysis.md, optional)

| ID | 항목 | 상태 |
|----|------|------|
| BAL-07 | 독 피해 상한 200/턴 | 미완료 |
| BAL-08 | mana_crystal 부가 효과 | 미완료 |
| BAL-09 | ice_witch CC 불가 시 defdown 폴백 | 미완료 |
| BAL-10 | ancient_dragon 배율 1.3x→1.0x | 미완료 |
