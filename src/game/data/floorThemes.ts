export interface FloorTheme {
  readonly id: string
  readonly name: string
  readonly subtitle: string
  readonly rounds: readonly [number, number]
  readonly accent: string
  readonly background: string
  readonly summary: string
}

export const FLOOR_THEMES: readonly FloorTheme[] = [
  {
    id: 'lower_labyrinth',
    name: '버려진 하층 미궁',
    subtitle: '길드가 포기한 입구 구역',
    rounds: [1, 5],
    accent: 'oklch(66% 0.12 85)',
    background: 'linear-gradient(180deg, oklch(92% 0.035 86 / 0.86), oklch(83% 0.045 236 / 0.62) 72%, transparent)',
    summary: '낡은 야영지, 무너진 석문, 초보 모험자의 흔적이 남은 회색 첨탑의 하층.',
  },
  {
    id: 'academy_ruins',
    name: '금서 학원 폐허',
    subtitle: '마법 학원의 기억이 남은 층',
    rounds: [6, 10],
    accent: 'oklch(62% 0.17 305)',
    background: 'linear-gradient(180deg, oklch(91% 0.045 300 / 0.82), oklch(84% 0.04 238 / 0.58) 72%, transparent)',
    summary: '부서진 강의실, 떠다니는 마도 회로, 금서의 잔향이 적을 불러내는 구역.',
  },
  {
    id: 'frozen_cathedral',
    name: '얼어붙은 성당 회랑',
    subtitle: '기도와 냉기가 멈춘 성역',
    rounds: [11, 15],
    accent: 'oklch(64% 0.14 220)',
    background: 'linear-gradient(180deg, oklch(91% 0.048 220 / 0.86), oklch(96% 0.018 250 / 0.62) 72%, transparent)',
    summary: '스테인드글라스 아래로 서리가 자라며, 오래된 신탁이 얼음 속에서 반복되는 층.',
  },
  {
    id: 'abyssal_aqueduct',
    name: '심해 수로',
    subtitle: '바다가 탑 안으로 스며든 곳',
    rounds: [16, 20],
    accent: 'oklch(62% 0.14 185)',
    background: 'linear-gradient(180deg, oklch(89% 0.05 190 / 0.86), oklch(81% 0.055 220 / 0.58) 72%, transparent)',
    summary: '바닷물 냄새와 심해의 노래가 뒤섞인 수로. 물속의 그림자가 파티를 따라온다.',
  },
  {
    id: 'scarlet_battlefield',
    name: '붉은 전장 회랑',
    subtitle: '끝나지 않은 전쟁의 기억',
    rounds: [21, 25],
    accent: 'oklch(62% 0.2 25)',
    background: 'linear-gradient(180deg, oklch(90% 0.052 32 / 0.84), oklch(84% 0.036 245 / 0.6) 72%, transparent)',
    summary: '무너진 깃발, 검은 재, 반복되는 함성이 남은 층. 탑이 전쟁의 순간을 되감는다.',
  },
  {
    id: 'void_heart',
    name: '공허 심장부',
    subtitle: '용군주의 숨결이 닿는 최상층',
    rounds: [26, 30],
    accent: 'oklch(64% 0.2 45)',
    background: 'linear-gradient(180deg, oklch(88% 0.055 40 / 0.8), oklch(78% 0.05 278 / 0.62) 72%, transparent)',
    summary: '공허와 용혈이 뒤섞인 최종 구역. 탑의 진짜 목적이 드러나기 시작한다.',
  },
]

export function getFloorThemeByRound(round: number): FloorTheme {
  return FLOOR_THEMES.find(theme => (
    round >= theme.rounds[0] && round <= theme.rounds[1]
  )) ?? FLOOR_THEMES[FLOOR_THEMES.length - 1]
}
