/* ==========================================================================
   Dark Fantasy Roguelike — Core Type Definitions
   Zero React/Zustand dependency. Pure domain types only.
   ========================================================================== */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type EntityId = string

export type Element = 'physical' | 'fire' | 'water' | 'dark' | 'light'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type StatusEffectKind =
  | 'poison'    // 매 턴 최대 HP% 피해
  | 'burn'      // 매 턴 고정 피해
  | 'freeze'    // 행동 불능 (1턴)
  | 'stun'      // 행동 불능 (1턴, freeze와 동일 구현)
  | 'shield'    // 피해 흡수
  | 'regen'     // 매 턴 HP 회복
  | 'powerup'   // 공격력 버프
  | 'defdown'   // 방어력 디버프

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface BaseStats {
  readonly maxHp: number
  readonly attack: number
  readonly defense: number
  readonly speed: number           // 행동 순서 결정 (높을수록 먼저)
}

export interface Stats extends BaseStats {
  readonly hp: number              // 현재 HP
  readonly mp: number              // 현재 MP
  readonly maxMp: number
}

// ---------------------------------------------------------------------------
// Status Effect Instance
// ---------------------------------------------------------------------------

export interface StatusEffect {
  readonly kind: StatusEffectKind
  readonly duration: number        // 남은 턴 수
  readonly value: number           // 효과 수치 (피해량, 흡수량 등)
  readonly sourceId: EntityId      // 발생시킨 캐릭터/스킬 ID
}

// ---------------------------------------------------------------------------
// Skill Effects (discriminated union)
// ---------------------------------------------------------------------------

export type SkillEffect =
  | { readonly type: 'damage';       readonly element: Element; readonly multiplier: number }
  | { readonly type: 'damage_all';   readonly element: Element; readonly multiplier: number }
  | { readonly type: 'heal';         readonly multiplier: number }    // attack 기반 회복
  | { readonly type: 'heal_mp';      readonly amount: number }
  | { readonly type: 'apply_status'; readonly status: StatusEffectKind; readonly duration: number; readonly value: number }
  | { readonly type: 'remove_status';readonly status: StatusEffectKind }
  | { readonly type: 'shield';       readonly amount: number }
  | { readonly type: 'charge';       readonly multiplier: number }    // 다음 공격 강화
  | { readonly type: 'summon_ally';  readonly allyId: EntityId }      // 동료 소환

// ---------------------------------------------------------------------------
// Skill Definition
// ---------------------------------------------------------------------------

export interface SkillDef {
  readonly id: EntityId
  readonly name: string
  readonly description: string
  readonly mpCost: number
  readonly cooldown: number         // 사용 후 쿨다운 턴
  readonly effects: readonly SkillEffect[]
  readonly element: Element
  readonly rarity: Rarity
}

// ---------------------------------------------------------------------------
// Character (플레이어 캐릭터)
// ---------------------------------------------------------------------------

export interface CharacterDef {
  readonly id: EntityId
  readonly name: string
  readonly title: string            // 부제목 (예: "어둠의 기사")
  readonly baseStats: BaseStats & { readonly maxMp: number }
  readonly innateSkillId: EntityId  // 고유 스킬 (항상 장착)
  readonly startingSkillIds: readonly EntityId[]
  readonly element: Element
  readonly lore: string
}

// ---------------------------------------------------------------------------
// Ally (동료)
// ---------------------------------------------------------------------------

export type AllyAction =
  | { readonly type: 'attack'; readonly element: Element; readonly multiplier: number }
  | { readonly type: 'heal_party'; readonly multiplier: number }
  | { readonly type: 'apply_status'; readonly status: StatusEffectKind; readonly duration: number; readonly value: number }
  | { readonly type: 'shield_party'; readonly amount: number }

export interface AllyDef {
  readonly id: EntityId
  readonly name: string
  readonly description: string
  readonly baseStats: BaseStats
  readonly action: AllyAction      // 매 턴 자동 행동
  readonly element: Element
  readonly rarity: Rarity
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export type ItemEffect =
  | { readonly type: 'stat_boost'; readonly stat: keyof BaseStats; readonly amount: number }
  | { readonly type: 'heal_on_kill'; readonly amount: number }
  | { readonly type: 'mp_regen'; readonly amount: number }            // 매 턴 MP 회복
  | { readonly type: 'skill_cooldown_reduce'; readonly amount: number }
  | { readonly type: 'elemental_damage'; readonly element: Element; readonly multiplier: number }
  | { readonly type: 'on_low_hp'; readonly threshold: number; readonly effect: SkillEffect }

export interface ItemDef {
  readonly id: EntityId
  readonly name: string
  readonly description: string
  readonly effect: ItemEffect
  readonly rarity: Rarity
}

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------

export type EnemyActionPattern =
  | { readonly type: 'attack'; readonly element: Element; readonly multiplier: number; readonly targetMode: 'random' | 'lowest_hp' | 'highest_attack' }
  | { readonly type: 'attack_all'; readonly element: Element; readonly multiplier: number }
  | { readonly type: 'apply_status'; readonly status: StatusEffectKind; readonly duration: number; readonly value: number; readonly targetMode: 'random' | 'all' }
  | { readonly type: 'heal_self'; readonly multiplier: number }
  | { readonly type: 'buff_self'; readonly status: StatusEffectKind; readonly duration: number; readonly value: number }

export interface EnemyDef {
  readonly id: EntityId
  readonly name: string
  readonly description: string
  readonly baseStats: BaseStats
  readonly actions: readonly EnemyActionPattern[]  // 순환하여 사용
  readonly element: Element
  readonly lore: string
}

// ---------------------------------------------------------------------------
// Draft (보상 선택)
// ---------------------------------------------------------------------------

export type DraftOption =
  | { readonly type: 'skill'; readonly skillId: EntityId }
  | { readonly type: 'ally';  readonly allyId: EntityId }
  | { readonly type: 'item';  readonly itemId: EntityId }

// ---------------------------------------------------------------------------
// Battle Entities (런타임 인스턴스)
// ---------------------------------------------------------------------------

export interface BattleCharacter {
  readonly id: EntityId            // 고유 인스턴스 ID
  readonly defId: EntityId         // CharacterDef ID
  readonly name: string
  readonly stats: Stats
  readonly skillIds: readonly EntityId[]
  readonly skillCooldowns: Readonly<Record<EntityId, number>>
  readonly statusEffects: readonly StatusEffect[]
  readonly element: Element
  readonly isAlive: boolean
}

export interface BattleAlly {
  readonly id: EntityId
  readonly defId: EntityId
  readonly name: string
  readonly stats: Stats
  readonly action: AllyAction
  readonly element: Element
  readonly isAlive: boolean
  readonly statusEffects: readonly StatusEffect[]
}

export interface BattleEnemy {
  readonly id: EntityId
  readonly defId: EntityId
  readonly name: string
  readonly stats: Stats
  readonly actions: readonly EnemyActionPattern[]
  readonly actionIndex: number     // 다음 사용할 액션 인덱스
  readonly element: Element
  readonly isAlive: boolean
  readonly statusEffects: readonly StatusEffect[]
}

// ---------------------------------------------------------------------------
// Battle Log
// ---------------------------------------------------------------------------

export type BattleLogEntryKind =
  | 'damage'
  | 'heal'
  | 'crit'
  | 'miss'
  | 'status_apply'
  | 'status_expire'
  | 'death'
  | 'system'

export interface BattleLogEntry {
  readonly id: string
  readonly kind: BattleLogEntryKind
  readonly text: string
  readonly value?: number          // 수치 (피해량, 회복량)
  readonly sourceId?: EntityId
  readonly targetId?: EntityId
}

// ---------------------------------------------------------------------------
// Battle State
// ---------------------------------------------------------------------------

export type BattlePhase =
  | 'player_turn'
  | 'enemy_turn'
  | 'animating'
  | 'victory'
  | 'defeat'

export interface BattleState {
  readonly phase: BattlePhase
  readonly turnCount: number
  readonly party: readonly BattleCharacter[]
  readonly allies: readonly BattleAlly[]
  readonly enemies: readonly BattleEnemy[]
  readonly log: readonly BattleLogEntry[]
  readonly totalDamageDealt: number
  readonly selectedSkillId: EntityId | null
  readonly selectedTargetId: EntityId | null
}

// ---------------------------------------------------------------------------
// Run State (전체 게임 런)
// ---------------------------------------------------------------------------

export type RunPhase = 'battle' | 'draft' | 'result'

export interface RunState {
  readonly phase: RunPhase
  readonly seed: number
  readonly round: number           // 현재 라운드 (적 강도 결정)
  readonly character: BattleCharacter
  readonly allies: readonly BattleAlly[]
  readonly acquiredItemIds: readonly EntityId[]
  readonly battleState: BattleState | null
  readonly totalDamage: number
  readonly draftOptions: readonly DraftOption[]
  readonly isVictory?: boolean     // result phase 전환 시 승리/패배 구분
}

// ---------------------------------------------------------------------------
// Battle Actions (reducer 입력)
// ---------------------------------------------------------------------------

export type BattleAction =
  | { readonly type: 'SELECT_SKILL'; readonly skillId: EntityId }
  | { readonly type: 'SELECT_TARGET'; readonly targetId: EntityId }
  | { readonly type: 'USE_SKILL'; readonly skillId: EntityId; readonly targetId: EntityId }
  | { readonly type: 'END_PLAYER_TURN' }
  | { readonly type: 'PROCESS_ENEMY_TURN' }
  | { readonly type: 'TICK_STATUS_EFFECTS' }
