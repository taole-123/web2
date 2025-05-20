// js/config/weapons.js

/**
 * @file Defines all weapon data for the game.
 * WEAPONS_DATA will be a global variable.
 */

const WEAPONS_DATA = {
    short_bow: {
        id: 'short_bow',
        name: '短弓',
        type: 'ranged',
        description: '一把轻巧的短弓，射速较快。',
        icon: '🏹',
        levelStats: [
            { level: 1, damage: 8, cooldown: 800, projectiles: 1, projectileSpeed: 7, duration: 1000, area: 1, pierce: 0, effects: [] },
            { level: 2, damage: 10, cooldown: 750, projectiles: 1, projectileSpeed: 7.5, duration: 1100, area: 1, pierce: 0, effects: [] },
            { level: 3, damage: 12, cooldown: 700, projectiles: 2, projectileSpeed: 8, duration: 1200, area: 1.1, pierce: 0, effects: ['spread_shot_small'] },
            { level: 4, damage: 15, cooldown: 650, projectiles: 2, projectileSpeed: 8.5, duration: 1300, area: 1.1, pierce: 1, effects: ['spread_shot_small'] },
            { level: 5, damage: 18, cooldown: 600, projectiles: 3, projectileSpeed: 9, duration: 1500, area: 1.2, pierce: 1, effects: ['spread_shot_medium'] }
        ],
        projectileAsset: 'arrow_basic',
        maxLevel: 5,
        tags: ['bow', 'ranged', 'starter'],
        evolution: null
    },
    broadsword: {
        id: 'broadsword',
        name: '阔剑',
        type: 'melee_swing',
        description: '一把坚固的阔剑，能够挥砍前方的敌人。',
        icon: '⚔️',
        levelStats: [
            { level: 1, damage: 15, cooldown: 1200, area: 1.5, duration: 300, knockback: 0.5, effects: [] },
            { level: 2, damage: 18, cooldown: 1100, area: 1.6, duration: 300, knockback: 0.6, effects: [] },
            { level: 3, damage: 22, cooldown: 1000, area: 1.7, duration: 350, knockback: 0.7, effects: ['cleave'] },
            { level: 4, damage: 27, cooldown: 900,  area: 1.8, duration: 350, knockback: 0.8, effects: ['cleave', 'stun_chance_low'] },
            { level: 5, damage: 35, cooldown: 800,  area: 2.0, duration: 400, knockback: 1.0, effects: ['cleave_wider', 'stun_chance_medium'] }
        ],
        hitboxAsset: 'sword_swing_arc',
        maxLevel: 5,
        tags: ['sword', 'melee', 'starter'],
        evolution: null
    },
    fireball_staff: {
        id: 'fireball_staff',
        name: '火焰法杖',
        type: 'ranged',
        description: '发射爆裂火球的法杖。',
        icon: '🔥',
        levelStats: [
            { level: 1, damage: 20, cooldown: 1500, projectiles: 1, projectileSpeed: 5, duration: 1200, area: 1.5, effects: ['explosion_on_impact_small'] },
            { level: 2, damage: 25, cooldown: 1400, projectiles: 1, projectileSpeed: 5, duration: 1300, area: 1.6, effects: ['explosion_on_impact_small', 'burn_dot_low'] },
        ],
        projectileAsset: 'fireball_basic',
        maxLevel: 8,
        tags: ['staff', 'magic', 'fire', 'aoe'],
        evolution: null
    }
};

console.log('[WeaponsConfig] WEAPONS_DATA defined.');
// 确保没有 'export' 关键字
