// js/config/skills.js

/**
 * @file Defines all passive skills for the game.
 * SKILLS_DATA will be a global variable.
 */

const SKILLS_DATA = {
    might_aura: {
        id: 'might_aura',
        name: '力量光环',
        description: '提升附近友军（即玩家自身）的攻击力。',
        icon: '💪',
        type: 'passive_stat_boost',
        maxLevel: 5,
        levelStats: [
            { level: 1, effects: [{ stat: 'attackDamage', value: 0.05, type: 'percentage_add' }] },
            { level: 2, effects: [{ stat: 'attackDamage', value: 0.10, type: 'percentage_add' }] },
            { level: 3, effects: [{ stat: 'attackDamage', value: 0.15, type: 'percentage_add' }] },
            { level: 4, effects: [{ stat: 'attackDamage', value: 0.20, type: 'percentage_add' }] },
            { level: 5, effects: [{ stat: 'attackDamage', value: 0.25, type: 'percentage_add' }, { stat: 'area', value: 0.10, type: 'percentage_add' }] }
        ],
        tags: ['buff', 'damage', 'aura']
    },
    swiftness_boots: {
        id: 'swiftness_boots',
        name: '迅捷之靴',
        description: '提升移动速度。',
        icon: '👟',
        type: 'passive_stat_boost',
        maxLevel: 3,
        levelStats: [
            { level: 1, effects: [{ stat: 'moveSpeed', value: 0.08, type: 'percentage_add' }] },
            { level: 2, effects: [{ stat: 'moveSpeed', value: 0.16, type: 'percentage_add' }] },
            { level: 3, effects: [{ stat: 'moveSpeed', value: 0.25, type: 'percentage_add' }] }
        ],
        tags: ['utility', 'movement']
    },
    toughness_rank1: {
        id: 'toughness_rank1',
        name: '坚韧 (等级1)',
        description: '略微增加最大生命值。',
        icon: '🛡️',
        type: 'passive_stat_boost',
        maxLevel: 1,
        levelStats: [
            { level: 1, effects: [{ stat: 'maxHp', value: 0.10, type: 'percentage_base' }] }
        ],
        tags: ['defense', 'survivability', 'starter_skill']
    }
};

console.log('[SkillsConfig] SKILLS_DATA defined.');
// 确保没有 'export' 关键字
