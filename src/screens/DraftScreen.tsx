import React, { useState } from 'react'
import type { DraftOption, SkillDef, AllyDef, ItemDef, CraftRecipe, Rarity, Element, AllyAction } from '../game/types'
import { getSkillById, SKILLS } from '../game/data/skills'
import { getAllyById } from '../game/data/allies'
import { getItemById } from '../game/data/items'
import { getAvailableRecipes } from '../game/craft'
import { SYNERGIES, type Synergy } from '../game/synergy'
import { useRunStore } from '../state/runStore'

// ---------------------------------------------------------------------------
// Token maps
// ---------------------------------------------------------------------------

const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'var(--color-element-physical)',
  fire:     'var(--color-element-fire)',
  water:    'var(--color-element-water)',
  dark:     'var(--color-element-dark)',
  light:    'var(--color-element-light)',
}

const ELEMENT_LABELS: Record<Element, string> = {
  physical: '물리',
  fire:     '화염',
  water:    '물',
  dark:     '어둠',
  light:    '빛',
}

const RARITY_COLORS: Record<Rarity, string> = {
  common:    'var(--color-rarity-common)',
  rare:      'var(--color-rarity-rare)',
  epic:      'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
}

const RARITY_LABELS: Record<Rarity, string> = {
  common:    '일반',
  rare:      '희귀',
  epic:      '영웅',
  legendary: '전설',
}

// ---------------------------------------------------------------------------
// DraftScreen
// ---------------------------------------------------------------------------

type DraftTab = 'reward' | 'craft'

export function DraftScreen() {
  const run                = useRunStore(s => s.run)
  const selectDraft        = useRunStore(s => s.selectDraft)
  const advanceToNextBattle = useRunStore(s => s.advanceToNextBattle)
  const craftAndAdvance    = useRunStore(s => s.craftAndAdvance)

  const [tab, setTab] = useState<DraftTab>('reward')

  if (!run || run.phase !== 'draft') return null

  // 현재 파티의 활성 원소 목록 (캐릭터 + 동료)
  const currentElements = new Set<Element>()
  if (run.character.isAlive) currentElements.add(run.character.element)
  for (const ally of run.allies) {
    if (ally.isAlive) currentElements.add(ally.element)
  }

  function getNewSynergies(element: Element): readonly Synergy[] {
    if (currentElements.has(element)) return []
    const extended = new Set(currentElements)
    extended.add(element)
    return SYNERGIES.filter(s => s.elements.every(e => extended.has(e)) && !s.elements.every(e => currentElements.has(e)))
  }

  function handleSelect(index: number) {
    selectDraft(index)
    advanceToNextBattle()
  }

  function handleCraft(recipeId: string) {
    craftAndAdvance(recipeId)
    advanceToNextBattle()
  }

  const recipes = getAvailableRecipes(run.character.skillIds, run.acquiredItemIds)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      gap: 'var(--space-6)',
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}>
          라운드 {run.round - 1} 클리어
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-accent)',
          margin: 0,
        }}>
          {tab === 'reward' ? '보상을 선택하세요' : '아이템 조합'}
        </h2>
        <p style={{
          marginTop: 'var(--space-2)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          marginBottom: 0,
        }}>
          누적 피해: {run.totalDamage.toLocaleString()}
        </p>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex',
        gap: 0,
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <TabButton active={tab === 'reward'} onClick={() => setTab('reward')}>
          보상 선택
        </TabButton>
        <TabButton active={tab === 'craft'} onClick={() => setTab('craft')}>
          아이템 조합
          {recipes.length > 0 && (
            <span style={{
              marginLeft: 'var(--space-2)',
              fontSize: '10px',
              padding: '1px 5px',
              background: 'var(--color-accent)',
              color: 'oklch(15% 0 0)',
              borderRadius: '99px',
              fontWeight: 'var(--weight-bold)',
            }}>
              {recipes.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* 탭 내용 */}
      {tab === 'reward' ? (
        <div style={{
          display: 'flex',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {run.draftOptions.map((opt, i) => (
            <DraftCard
              key={i}
              option={opt}
              index={i}
              onSelect={handleSelect}
              ownedSkillIds={run.character.skillIds}
              ownedItemIds={run.acquiredItemIds}
              getNewSynergies={getNewSynergies}
            />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          width: '100%',
          maxWidth: '760px',
        }}>
          {recipes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              padding: 'var(--space-8)',
            }}>
              <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>⚗️</div>
              <div>조합 가능한 레시피가 없습니다.</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                스킬이나 아이템을 더 모아보세요.
              </div>
            </div>
          ) : (
            recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                ownedSkillIds={run.character.skillIds}
                ownedItemIds={run.acquiredItemIds}
                onCraft={() => handleCraft(recipe.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabButton
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--space-2) var(--space-5)',
        background: active ? 'var(--color-bg-elevated)' : 'transparent',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        border: 'none',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-normal)',
        display: 'flex',
        alignItems: 'center',
        transition: 'background var(--duration-fast), color var(--duration-fast)',
      }}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// RecipeCard
// ---------------------------------------------------------------------------

interface RecipeCardProps {
  recipe: CraftRecipe
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  onCraft: () => void
}

function getEntityName(id: string): { name: string; type: 'skill' | 'item' } {
  const skill = SKILLS.find(s => s.id === id)
  if (skill) return { name: skill.name, type: 'skill' }
  const item = getItemById(id)
  if (item) return { name: item.name, type: 'item' }
  return { name: id, type: 'item' }
}

function RecipeCard({ recipe, onCraft }: RecipeCardProps) {
  const [a, b] = recipe.ingredients
  const entityA = getEntityName(a)
  const entityB = getEntityName(b)

  const resultSkill = recipe.category === 'skill' ? SKILLS.find(s => s.id === recipe.resultId) : null
  const resultItem  = recipe.category === 'item'  ? getItemById(recipe.resultId) : null
  const resultRarity: Rarity = (resultSkill?.rarity ?? resultItem?.rarity ?? 'legendary')
  const resultName   = resultSkill?.name ?? resultItem?.name ?? recipe.resultId
  const resultDesc   = resultSkill?.description ?? resultItem?.description ?? ''
  const rarityColor  = RARITY_COLORS[resultRarity]

  return (
    <div style={{
      width: '100%',
      background: 'var(--color-bg-surface)',
      border: `1px solid var(--color-border-subtle)`,
      borderLeft: `3px solid ${rarityColor}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
    }}>
      {/* 재료 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flex: 1,
        minWidth: 0,
      }}>
        <IngredientChip label={entityA.name} type={entityA.type} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>+</span>
        <IngredientChip label={entityB.name} type={entityB.type} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xl)', flexShrink: 0 }}>→</span>
        {/* 결과물 */}
        <div style={{ minWidth: 0 }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: rarityColor,
            fontWeight: 'var(--weight-semibold)',
            display: 'block',
            marginBottom: '2px',
          }}>
            {RARITY_LABELS[resultRarity]} {recipe.category === 'skill' ? '스킬' : '아이템'}
          </span>
          <div style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {resultName}
          </div>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>
            {resultDesc}
          </div>
        </div>
      </div>

      {/* 조합 버튼 */}
      <button
        onClick={onCraft}
        style={{
          flexShrink: 0,
          padding: 'var(--space-2) var(--space-5)',
          background: `color-mix(in oklch, ${rarityColor} 18%, transparent)`,
          border: `1px solid color-mix(in oklch, ${rarityColor} 50%, transparent)`,
          borderRadius: 'var(--radius-md)',
          color: rarityColor,
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background var(--duration-fast)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background =
            `color-mix(in oklch, ${rarityColor} 30%, transparent)`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background =
            `color-mix(in oklch, ${rarityColor} 18%, transparent)`
        }}
      >
        조합하기
      </button>
    </div>
  )
}

function IngredientChip({ label, type }: { label: string; type: 'skill' | 'item' }) {
  const color = type === 'skill' ? 'var(--color-element-dark)' : 'var(--color-rarity-rare)'
  return (
    <div style={{
      padding: '3px var(--space-3)',
      border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
      borderRadius: 'var(--radius-sm)',
      background: `color-mix(in oklch, ${color} 12%, transparent)`,
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-secondary)',
      fontWeight: 'var(--weight-medium)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '110px',
    }}>
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftCard (dispatcher)
// ---------------------------------------------------------------------------

interface DraftCardProps {
  option: DraftOption
  index: number
  onSelect: (index: number) => void
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  getNewSynergies: (element: Element) => readonly Synergy[]
}

function DraftCard({ option, index, onSelect, ownedSkillIds, ownedItemIds, getNewSynergies }: DraftCardProps) {
  if (option.type === 'skill') {
    const skill = getSkillById(option.skillId)
    if (!skill) return null
    const isOwned = ownedSkillIds.includes(option.skillId)
    const newSynergies = getNewSynergies(skill.element)
    return <SkillCard skill={skill} onSelect={() => onSelect(index)} isOwned={isOwned} newSynergies={newSynergies} />
  }
  if (option.type === 'ally') {
    const ally = getAllyById(option.allyId)
    if (!ally) return null
    const newSynergies = getNewSynergies(ally.element)
    return <AllyCard ally={ally} onSelect={() => onSelect(index)} newSynergies={newSynergies} />
  }
  const item = getItemById(option.itemId)
  if (!item) return null
  const isOwned = ownedItemIds.includes(option.itemId)
  return <ItemCard item={item} onSelect={() => onSelect(index)} isOwned={isOwned} />
}

// ---------------------------------------------------------------------------
// Shared card wrapper
// ---------------------------------------------------------------------------

interface CardWrapperProps {
  rarity: Rarity
  element?: Element
  typeLabel: string
  onSelect: () => void
  children: React.ReactNode
}

function CardWrapper({ rarity, element, typeLabel, onSelect, children }: CardWrapperProps) {
  const rarityColor  = RARITY_COLORS[rarity]
  const accentColor  = element ? ELEMENT_COLORS[element] : rarityColor

  return (
    <button
      onClick={onSelect}
      style={{
        width: '220px',
        minHeight: '260px',
        background: 'var(--color-bg-surface)',
        border: `1px solid var(--color-border-subtle)`,
        borderTop: `3px solid ${rarityColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'border-color var(--duration-fast), transform var(--duration-fast), box-shadow var(--duration-fast)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = rarityColor
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = `0 12px 32px ${accentColor}28`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--color-border-subtle)'
        el.style.transform = 'none'
        el.style.boxShadow = 'none'
      }}
    >
      {/* 타입 레이블 */}
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {typeLabel}
      </div>

      {children}

      {/* 등급 뱃지 */}
      <span style={{
        marginTop: 'auto',
        alignSelf: 'flex-start',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        padding: '2px var(--space-2)',
        borderRadius: 'var(--radius-sm)',
        background: `color-mix(in oklch, ${rarityColor} 18%, transparent)`,
        color: rarityColor,
        border: `1px solid color-mix(in oklch, ${rarityColor} 35%, transparent)`,
        letterSpacing: '0.04em',
      }}>
        {RARITY_LABELS[rarity]}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// SkillCard
// ---------------------------------------------------------------------------

const OWNED_BADGE: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  right: 'var(--space-2)',
  fontSize: 'var(--text-xs)',
  padding: '2px 6px',
  background: 'color-mix(in oklch, var(--color-text-muted) 20%, transparent)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-sm)',
  pointerEvents: 'none',
}

function SynergyBadge({ synergies }: { synergies: readonly Synergy[] }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 'var(--space-2)',
      right: 'var(--space-2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {synergies.map(s => (
        <span
          key={s.id}
          title={s.description}
          style={{
            fontSize: '10px',
            padding: '2px 5px',
            background: 'color-mix(in oklch, var(--color-accent) 20%, transparent)',
            color: 'var(--color-accent)',
            border: '1px solid color-mix(in oklch, var(--color-accent) 40%, transparent)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          ✦ {s.name}
        </span>
      ))}
    </div>
  )
}

function SkillCard({ skill, onSelect, isOwned, newSynergies = [] }: { skill: SkillDef; onSelect: () => void; isOwned?: boolean; newSynergies?: readonly Synergy[] }) {
  const elColor = ELEMENT_COLORS[skill.element]
  const elLabel = ELEMENT_LABELS[skill.element]

  return (
    <CardWrapper rarity={skill.rarity} element={skill.element} typeLabel="스킬" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      {newSynergies.length > 0 && (
        <SynergyBadge synergies={newSynergies} />
      )}
      {/* 속성 + 이름 */}
      <div>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: elColor,
          marginBottom: 'var(--space-1)',
          display: 'block',
        }}>
          {elLabel}
        </span>
        <div style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
        }}>
          {skill.name}
        </div>
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {skill.description}
      </p>

      {/* MP / 쿨다운 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
      }}>
        <span>MP <strong style={{ color: 'var(--color-mp)' }}>{skill.mpCost}</strong></span>
        {skill.cooldown > 0 && (
          <span>쿨다운 <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.cooldown}턴</strong></span>
        )}
      </div>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// AllyCard
// ---------------------------------------------------------------------------

function allyActionLabel(action: AllyAction): string {
  switch (action.type) {
    case 'attack':           return `공격력의 ${Math.round(action.multiplier * 100)}% 피해`
    case 'heal_party':       return `전체 치유 ${Math.round(action.multiplier * 100)}%`
    case 'apply_status':     return `${action.status} 부여 ${action.duration}턴`
    case 'apply_status_all': return `전체 적 ${action.status} 부여 ${action.duration}턴`
    case 'shield_party':     return `방막 ${action.amount}`
    case 'buff_party':       return `아군 전체 ${action.status} ${action.duration}턴`
    case 'revive_party':     return `아군 부활 (${Math.round(action.healPercent * 100)}% HP)`
  }
}

function AllyCard({ ally, onSelect, newSynergies = [] }: { ally: AllyDef; onSelect: () => void; newSynergies?: readonly Synergy[] }) {
  const elColor = ELEMENT_COLORS[ally.element]
  const elLabel = ELEMENT_LABELS[ally.element]

  return (
    <CardWrapper rarity={ally.rarity} element={ally.element} typeLabel="동료" onSelect={onSelect}>
      {newSynergies.length > 0 && (
        <SynergyBadge synergies={newSynergies} />
      )}
      {/* 속성 + 이름 */}
      <div>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: elColor,
          marginBottom: 'var(--space-1)',
          display: 'block',
        }}>
          {elLabel}
        </span>
        <div style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
        }}>
          {ally.name}
        </div>
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {ally.description}
      </p>

      {/* 스탯 미니 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px var(--space-2)',
        fontSize: 'var(--text-xs)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
      }}>
        <MiniStat label="HP"  value={ally.baseStats.maxHp} />
        <MiniStat label="공격" value={ally.baseStats.attack} />
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--space-1)',
          marginTop: '2px',
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>행동</span>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>
            {allyActionLabel(ally.action)}
          </span>
        </div>
      </div>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// ItemCard
// ---------------------------------------------------------------------------

function ItemCard({ item, onSelect, isOwned }: { item: ItemDef; onSelect: () => void; isOwned?: boolean }) {
  return (
    <CardWrapper rarity={item.rarity} typeLabel="아이템" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      {/* 이름 */}
      <div style={{
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.2,
      }}>
        {item.name}
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {item.description}
      </p>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// MiniStat
// ---------------------------------------------------------------------------

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-1)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}
