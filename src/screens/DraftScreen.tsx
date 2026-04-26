import React, { useState } from 'react'
import type { DraftOption, SkillDef, AllyDef, ItemDef, CraftRecipe, Rarity, Element, AllyAction, SkillEffect, ItemEffect } from '../game/types'
import { getSkillById, SKILLS } from '../game/data/skills'
import { getAllyById } from '../game/data/allies'
import { getItemById } from '../game/data/items'
import { getAvailableRecipes } from '../game/craft'
import { RECIPES } from '../game/data/recipes'
import { SYNERGIES, type Synergy } from '../game/synergy'
import { ELITE_ROUNDS, MINI_BOSS_ROUNDS, MAX_ROUNDS } from '../game/run'
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
  const rerollDraft        = useRunStore(s => s.rerollDraft)

  const skipDraftForHeal  = useRunStore(s => s.skipDraftForHeal)

  const [tab, setTab] = useState<DraftTab>('reward')
  const [confirmRecipeId, setConfirmRecipeId] = useState<string | null>(null)

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

  function requestCraft(recipeId: string) {
    setConfirmRecipeId(recipeId)
  }

  function handleCraftConfirm() {
    if (!confirmRecipeId) return
    craftAndAdvance(confirmRecipeId)
    advanceToNextBattle()
    setConfirmRecipeId(null)
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
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
        }}>
          라운드 {run.round - 1} 클리어
          {run.round === MAX_ROUNDS && (
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
              color: 'var(--color-blood)', background: 'color-mix(in oklch, var(--color-blood) 15%, var(--color-bg-elevated))',
              border: '1px solid var(--color-blood)', borderRadius: 'var(--radius-sm)',
              padding: '2px 8px', letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              ⚔ 보스전
            </span>
          )}
          {ELITE_ROUNDS.has(run.round) && (
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
              color: 'var(--color-gold)', background: 'color-mix(in oklch, var(--color-gold) 12%, var(--color-bg-elevated))',
              border: '1px solid var(--color-gold)', borderRadius: 'var(--radius-sm)',
              padding: '2px 8px', letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              ⚠ 엘리트
            </span>
          )}
          {MINI_BOSS_ROUNDS.has(run.round) && (
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
              color: 'var(--color-element-dark)', background: 'color-mix(in oklch, var(--color-element-dark) 12%, var(--color-bg-elevated))',
              border: '1px solid var(--color-element-dark)', borderRadius: 'var(--radius-sm)',
              padding: '2px 8px', letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              💀 미니보스
            </span>
          )}
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
          {tab === 'reward' && (
            <span style={{
              marginLeft: 'var(--space-3)',
              color: run.rerollsRemaining > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontWeight: 'var(--weight-semibold)',
            }}>
              · 리롤 {run.rerollsRemaining}회 남음
            </span>
          )}
        </p>
      </div>

      {/* 탭 */}
      <div className="ui-tabs" role="tablist" aria-label="보상과 조합">
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
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
        }}>
          <div className="draft-reward-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'var(--space-6)',
            alignItems: 'stretch',
            width: 'min(100%, 820px)',
          }}>
            {run.draftOptions.map((opt, i) => (
              <DraftCard
                key={i}
                option={opt}
                index={i}
                onSelect={handleSelect}
                onReroll={rerollDraft}
                rerollsRemaining={run.rerollsRemaining}
                ownedSkillIds={run.character.skillIds}
                ownedItemIds={run.acquiredItemIds}
                getNewSynergies={getNewSynergies}
                playerAtk={run.character.stats.attack}
              />
            ))}
          </div>
          <HealSkipCard
            character={run.character}
            onSkip={skipDraftForHeal}
          />
        </div>
      ) : (
        <CraftTab
          allRecipes={RECIPES}
          availableRecipes={recipes}
          ownedSkillIds={run.character.skillIds}
          ownedItemIds={run.acquiredItemIds}
          onCraft={requestCraft}
        />
      )}

      {/* 크래프트 확인 모달 */}
      {confirmRecipeId && (
        <CraftConfirmModal
          recipeId={confirmRecipeId}
          ownedSkillIds={run.character.skillIds}
          ownedItemIds={run.acquiredItemIds}
          onConfirm={handleCraftConfirm}
          onCancel={() => setConfirmRecipeId(null)}
        />
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
      className="ui-tab"
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CraftTab
// ---------------------------------------------------------------------------

interface CraftTabProps {
  allRecipes: readonly CraftRecipe[]
  availableRecipes: readonly CraftRecipe[]
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  onCraft: (recipeId: string) => void
}

function CraftTab({ allRecipes, availableRecipes, ownedSkillIds, ownedItemIds, onCraft }: CraftTabProps) {
  const availableIds = new Set(availableRecipes.map(r => r.id))
  const lockedRecipes = allRecipes.filter(r => !availableIds.has(r.id))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)',
      width: '100%',
      maxWidth: '800px',
    }}>
      {availableRecipes.length > 0 && (
        <>
          <SectionHeader label={`조합 가능 (${availableRecipes.length})`} />
          {availableRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              ownedSkillIds={ownedSkillIds}
              ownedItemIds={ownedItemIds}
              isLocked={false}
              onCraft={() => onCraft(recipe.id)}
            />
          ))}
        </>
      )}

      {lockedRecipes.length > 0 && (
        <>
          <SectionHeader label={`재료 부족 (${lockedRecipes.length})`} dimmed />
          {lockedRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              ownedSkillIds={ownedSkillIds}
              ownedItemIds={ownedItemIds}
              isLocked={true}
              onCraft={() => {}}
            />
          ))}
        </>
      )}

      {availableRecipes.length === 0 && lockedRecipes.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-8)',
        }}>
          <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>⚗️</div>
          <div>레시피가 없습니다.</div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label, dimmed }: { label: string; dimmed?: boolean }) {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
    }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle)' }} />
      <span className="section-header" style={{
        color: dimmed ? 'var(--color-text-muted)' : undefined,
        whiteSpace: 'nowrap',
        opacity: dimmed ? 0.6 : 1,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle)' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// RecipeCard
// ---------------------------------------------------------------------------

interface RecipeCardProps {
  recipe: CraftRecipe
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  isLocked: boolean
  onCraft: () => void
}

function getEntityInfo(id: string): { name: string; type: 'skill' | 'item' } {
  const skill = SKILLS.find(s => s.id === id)
  if (skill) return { name: skill.name, type: 'skill' }
  const item = getItemById(id)
  if (item) return { name: item.name, type: 'item' }
  return { name: id, type: 'item' }
}

function isOwned(id: string, ownedSkillIds: readonly string[], ownedItemIds: readonly string[]): boolean {
  return ownedSkillIds.includes(id) || ownedItemIds.includes(id)
}

function RecipeCard({ recipe, ownedSkillIds, ownedItemIds, isLocked, onCraft }: RecipeCardProps) {
  const [a, b] = recipe.ingredients
  const entityA = getEntityInfo(a)
  const entityB = getEntityInfo(b)
  const ownedA = isOwned(a, ownedSkillIds, ownedItemIds)
  const ownedB = isOwned(b, ownedSkillIds, ownedItemIds)

  const resultSkill = recipe.category === 'skill' ? SKILLS.find(s => s.id === recipe.resultId) : null
  const resultItem  = recipe.category === 'item'  ? getItemById(recipe.resultId) : null
  const resultRarity: Rarity = (resultSkill?.rarity ?? resultItem?.rarity ?? 'legendary')
  const resultName   = resultSkill?.name ?? resultItem?.name ?? recipe.resultId
  const resultDesc   = resultSkill?.description ?? resultItem?.description ?? ''
  const rarityColor  = isLocked ? 'var(--color-text-muted)' : RARITY_COLORS[resultRarity]
  const actualRarityColor = RARITY_COLORS[resultRarity]

  return (
    <div style={{
      width: '100%',
      background: 'var(--color-bg-surface)',
      border: `1px solid var(--color-border-subtle)`,
      borderLeft: `3px solid ${isLocked ? 'var(--color-border-subtle)' : actualRarityColor}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      opacity: isLocked ? 0.6 : 1,
    }}>
      {/* 재료 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flex: 1,
        minWidth: 0,
      }}>
        <IngredientChip label={entityA.name} type={entityA.type} owned={ownedA} locked={isLocked} />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>+</span>
        <IngredientChip label={entityB.name} type={entityB.type} owned={ownedB} locked={isLocked} />
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
            color: isLocked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
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

      {/* 조합 버튼 or 잠금 표시 */}
      {isLocked ? (
        <div style={{
          flexShrink: 0,
          padding: 'var(--space-2) var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          whiteSpace: 'nowrap',
        }}>
          재료 부족
        </div>
      ) : (
        <button
          onClick={onCraft}
          style={{
            flexShrink: 0,
            padding: 'var(--space-2) var(--space-5)',
            background: `color-mix(in oklch, ${actualRarityColor} 18%, transparent)`,
            border: `1px solid color-mix(in oklch, ${actualRarityColor} 50%, transparent)`,
            borderRadius: 'var(--radius-md)',
            color: actualRarityColor,
            fontWeight: 'var(--weight-semibold)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background var(--duration-fast)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background =
              `color-mix(in oklch, ${actualRarityColor} 30%, transparent)`
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background =
              `color-mix(in oklch, ${actualRarityColor} 18%, transparent)`
          }}
        >
          조합하기
        </button>
      )}
    </div>
  )
}

function IngredientChip({ label, type, owned, locked }: { label: string; type: 'skill' | 'item'; owned: boolean; locked: boolean }) {
  const baseColor = type === 'skill' ? 'var(--color-element-dark)' : 'var(--color-rarity-rare)'
  const missingColor = 'var(--color-text-muted)'

  if (locked && !owned) {
    return (
      <div style={{
        padding: '3px var(--space-3)',
        border: `1px dashed color-mix(in oklch, ${missingColor} 40%, transparent)`,
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        fontSize: 'var(--text-xs)',
        color: missingColor,
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

  return (
    <div style={{
      padding: '3px var(--space-3)',
      border: `1px solid color-mix(in oklch, ${baseColor} 40%, transparent)`,
      borderRadius: 'var(--radius-sm)',
      background: `color-mix(in oklch, ${baseColor} 12%, transparent)`,
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
  onReroll: (index: number) => void
  rerollsRemaining: number
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  getNewSynergies: (element: Element) => readonly Synergy[]
  playerAtk: number
}

function DraftCard({ option, index, onSelect, onReroll, rerollsRemaining, ownedSkillIds, ownedItemIds, getNewSynergies, playerAtk }: DraftCardProps) {
  const canReroll = rerollsRemaining > 0

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  }

  if (option.type === 'skill') {
    const skill = getSkillById(option.skillId)
    if (!skill) return null
    const isOwned = ownedSkillIds.includes(option.skillId)
    const newSynergies = getNewSynergies(skill.element)
    return (
      <div style={wrapperStyle}>
        <SkillCard skill={skill} onSelect={() => onSelect(index)} isOwned={isOwned} newSynergies={newSynergies} />
        <RerollButton index={index} canReroll={canReroll} onReroll={onReroll} />
      </div>
    )
  }
  if (option.type === 'ally') {
    const ally = getAllyById(option.allyId)
    if (!ally) return null
    const newSynergies = getNewSynergies(ally.element)
    return (
      <div style={wrapperStyle}>
        <AllyCard ally={ally} onSelect={() => onSelect(index)} newSynergies={newSynergies} playerAtk={playerAtk} />
        <RerollButton index={index} canReroll={canReroll} onReroll={onReroll} />
      </div>
    )
  }
  const item = getItemById(option.itemId)
  if (!item) return null
  const isOwned = ownedItemIds.includes(option.itemId)
  return (
    <div style={wrapperStyle}>
      <ItemCard item={item} onSelect={() => onSelect(index)} isOwned={isOwned} />
      <RerollButton index={index} canReroll={canReroll} onReroll={onReroll} />
    </div>
  )
}

function RerollButton({
  index,
  canReroll,
  onReroll,
}: {
  index: number
  canReroll: boolean
  onReroll: (index: number) => void
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onReroll(index) }}
      disabled={!canReroll}
      title={canReroll ? '이 카드를 리롤' : '리롤 횟수 없음'}
      className="ui-button"
      style={{
        alignSelf: 'flex-end',
        minHeight: '1.8rem',
        padding: '3px 8px',
        fontSize: '10px',
        '--button-accent': canReroll ? 'var(--color-accent)' : 'var(--color-text-muted)',
        opacity: canReroll ? 1 : 0.45,
        letterSpacing: '0.04em',
      } as React.CSSProperties}
    >
      🔄 리롤
    </button>
  )
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
      className={`tarot-card${rarity !== 'common' ? ` tarot-card--${rarity}` : ''}`}
      style={{
        width: '100%',
        minHeight: '260px',
        '--card-accent': accentColor,
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
      } as React.CSSProperties}
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
  const reason = newSynergies.length > 0 ? '시너지 활성' : skillReason(skill.effects)
  const target = skillTargetLabel(skill.effects)

  return (
    <CardWrapper rarity={skill.rarity} element={skill.element} typeLabel="스킬" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      {newSynergies.length > 0 && (
        <SynergyBadge synergies={newSynergies} />
      )}
      <DraftInsightChip label={reason} color={newSynergies.length > 0 ? 'var(--color-accent)' : elColor} />
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
        wordBreak: 'keep-all',
      }}>
        {skill.description}
      </p>

      {/* MP / 쿨다운 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
      }}>
        <span>MP <strong style={{ color: 'var(--color-mp)' }}>{skill.mpCost}</strong></span>
        <span>{target}</span>
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
    case 'mp_restore_party': return `파티 MP +${action.amount}`
  }
}

function AllyCard({ ally, onSelect, newSynergies = [], playerAtk = 0 }: { ally: AllyDef; onSelect: () => void; newSynergies?: readonly Synergy[]; playerAtk?: number }) {
  const elColor = ELEMENT_COLORS[ally.element]
  const elLabel = ELEMENT_LABELS[ally.element]
  const reason = newSynergies.length > 0 ? '시너지 활성' : allyReason(ally.action)

  return (
    <CardWrapper rarity={ally.rarity} element={ally.element} typeLabel="동료" onSelect={onSelect}>
      {newSynergies.length > 0 && (
        <SynergyBadge synergies={newSynergies} />
      )}
      <DraftInsightChip label={reason} color={newSynergies.length > 0 ? 'var(--color-accent)' : elColor} />
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
        wordBreak: 'keep-all',
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
            {ally.action.type === 'attack' && playerAtk > 0 && (
              <span style={{ color: 'var(--color-element-fire)', marginLeft: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                (~{Math.round(ally.action.multiplier * playerAtk)})
              </span>
            )}
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
  const reason = itemReason(item.effects)

  return (
    <CardWrapper rarity={item.rarity} typeLabel="아이템" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      <DraftInsightChip label={reason} color="var(--color-rarity-rare)" />
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
        wordBreak: 'keep-all',
      }}>
        {item.description}
      </p>
    </CardWrapper>
  )
}

function DraftInsightChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="ui-chip draft-insight-chip" style={{ '--chip-accent': color } as React.CSSProperties}>
      {label}
    </span>
  )
}

function skillReason(effects: readonly SkillEffect[]): string {
  if (effects.some(e => e.type === 'damage_all')) return '전체 공격'
  if (effects.some(e => e.type === 'heal' || e.type === 'shield' || e.type === 'remove_status')) return '생존 보강'
  if (effects.some(e => e.type === 'heal_mp' || e.type === 'spend_hp_gain_mp')) return 'MP 순환'
  if (effects.some(e => e.type === 'apply_status' || e.type === 'apply_status_party')) return '상태 전략'
  if (effects.some(e => e.type === 'execute' || e.type === 'damage_hp_scale')) return '결정타'
  if (effects.some(e => e.type === 'charge')) return '한방 준비'
  return '화력 보강'
}

function skillTargetLabel(effects: readonly SkillEffect[]): string {
  if (effects.some(e => e.type === 'damage_all')) return '전체'
  if (effects.some(e => e.type === 'heal' || e.type === 'shield' || e.type === 'remove_status' || e.type === 'apply_status_party')) return '아군'
  if (effects.some(e => e.type === 'apply_status')) return '상태'
  return '단일'
}

function allyReason(action: AllyAction): string {
  switch (action.type) {
    case 'attack': return '자동 화력'
    case 'heal_party':
    case 'shield_party':
    case 'revive_party': return '파티 생존'
    case 'apply_status':
    case 'apply_status_all':
    case 'buff_party': return '상태 지원'
    case 'mp_restore_party': return 'MP 지원'
  }
}

function itemReason(effects: readonly ItemEffect[]): string {
  if (effects.some(e => e.type === 'stat_boost' && e.stat === 'attack')) return '공격 강화'
  if (effects.some(e => e.type === 'stat_boost' && (e.stat === 'maxHp' || e.stat === 'defense'))) return '생존 강화'
  if (effects.some(e => e.type === 'mp_regen' || e.type === 'free_skill_chance' || e.type === 'skill_cooldown_reduce')) return '자원 순환'
  if (effects.some(e => e.type === 'elemental_damage' || e.type === 'elemental_match_damage' || e.type === 'boss_damage_bonus')) return '피해 증폭'
  if (effects.some(e => e.type === 'lifesteal' || e.type === 'heal_on_kill' || e.type === 'death_prevention')) return '위기 대응'
  if (effects.some(e => e.type === 'crit_chance_bonus' || e.type === 'miss_immunity')) return '안정 화력'
  return '특수 효과'
}

// ---------------------------------------------------------------------------
// HealSkipCard — 드래프트 건너뛰고 HP 회복
// ---------------------------------------------------------------------------

const HEAL_RATIO = 0.30

interface HealSkipCardProps {
  character: { stats: { hp: number; maxHp: number } }
  onSkip: () => void
}

function HealSkipCard({ character, onSkip }: HealSkipCardProps) {
  const { hp, maxHp } = character.stats
  const healAmount = Math.floor(maxHp * HEAL_RATIO)
  const afterHp = Math.min(maxHp, hp + healAmount)
  const isFullHp = hp >= maxHp

  return (
    <button
      onClick={onSkip}
      disabled={isFullHp}
      className="ui-card"
      style={{
        '--card-accent': isFullHp ? 'var(--color-text-muted)' : 'var(--color-hp-high)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-6)',
        background: isFullHp
          ? 'color-mix(in oklch, var(--color-bg-surface) 80%, transparent)'
          : 'color-mix(in oklch, var(--color-hp-high) 8%, var(--color-bg-surface))',
        cursor: isFullHp ? 'not-allowed' : 'pointer',
        color: isFullHp ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)',
        opacity: isFullHp ? 0.5 : 1,
        maxWidth: '480px',
        width: '100%',
      } as React.CSSProperties}
    >
      <span style={{ fontSize: 'var(--text-xl)' }}>🩹</span>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{
          fontWeight: 'var(--weight-semibold)',
          color: isFullHp ? 'var(--color-text-muted)' : 'var(--color-hp-high)',
          marginBottom: '2px',
        }}>
          보상 건너뛰고 회복
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {isFullHp
            ? 'HP가 이미 최대입니다'
            : `HP ${hp} → ${afterHp} (+${afterHp - hp}) / 최대 HP의 ${Math.round(HEAL_RATIO * 100)}% 회복`
          }
        </div>
      </div>
      {!isFullHp && (
        <span style={{
          fontSize: 'var(--text-xs)',
          padding: '2px var(--space-3)',
          background: 'color-mix(in oklch, var(--color-hp-high) 18%, transparent)',
          border: '1px solid color-mix(in oklch, var(--color-hp-high) 35%, transparent)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-hp-high)',
          fontWeight: 'var(--weight-semibold)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          선택
        </span>
      )}
    </button>
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

// ---------------------------------------------------------------------------
// CraftConfirmModal
// ---------------------------------------------------------------------------

interface CraftConfirmModalProps {
  recipeId: string
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
  onConfirm: () => void
  onCancel: () => void
}

function CraftConfirmModal({ recipeId, ownedSkillIds, ownedItemIds, onConfirm, onCancel }: CraftConfirmModalProps) {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return null

  const [a, b] = recipe.ingredients
  const entityA = getEntityInfo(a)
  const entityB = getEntityInfo(b)

  const resultSkill = recipe.category === 'skill' ? SKILLS.find(s => s.id === recipe.resultId) : null
  const resultItem  = recipe.category === 'item'  ? getItemById(recipe.resultId) : null
  const resultRarity: Rarity = resultSkill?.rarity ?? resultItem?.rarity ?? 'legendary'
  const resultName  = resultSkill?.name ?? resultItem?.name ?? recipe.resultId
  const resultDesc  = resultSkill?.description ?? resultItem?.description ?? ''
  const rarityColor = RARITY_COLORS[resultRarity]

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-4)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-surface)',
          border: `2px solid ${rarityColor}`,
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* 제목 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
          }}>
            조합 확인
          </div>
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-1)',
          }}>
            조합 후 즉시 다음 전투로 진행됩니다
          </div>
        </div>

        {/* 재료 → 결과 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <IngredientChip label={entityA.name} type={entityA.type} owned={isOwned(a, ownedSkillIds, ownedItemIds)} locked={false} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)' }}>+</span>
          <IngredientChip label={entityB.name} type={entityB.type} owned={isOwned(b, ownedSkillIds, ownedItemIds)} locked={false} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-2xl)' }}>→</span>
          {/* 결과물 */}
          <div style={{
            background: `color-mix(in oklch, ${rarityColor} 10%, transparent)`,
            border: `1px solid color-mix(in oklch, ${rarityColor} 40%, transparent)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: rarityColor,
              fontWeight: 'var(--weight-semibold)',
              marginBottom: 'var(--space-1)',
            }}>
              {RARITY_LABELS[resultRarity]} {recipe.category === 'skill' ? '스킬' : '아이템'}
            </div>
            <div style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
            }}>
              {resultName}
            </div>
          </div>
        </div>

        {/* 결과물 설명 */}
        {resultDesc && (
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            {resultDesc}
          </div>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-4)',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--weight-medium)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              padding: 'var(--space-3) var(--space-4)',
              background: `color-mix(in oklch, ${rarityColor} 20%, transparent)`,
              border: `1px solid color-mix(in oklch, ${rarityColor} 60%, transparent)`,
              borderRadius: 'var(--radius-md)',
              color: rarityColor,
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            조합하기
          </button>
        </div>
      </div>
    </div>
  )
}
