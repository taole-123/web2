// js/config/enemies.js

/**
 * @file Defines all enemy data for the game.
 * ENEMIES_DATA will be a global variable.
 */

const ENEMIES_DATA = {
    ghoul_weak: {
        id: 'ghoul_weak',
        name: '饥饿食尸鬼',
        icon: '🧟',
        modelPath: 'assets/models/enemies/ghoul_weak.png',
        stats: { maxHp: 30, moveSpeed: 1.5, attackDamage: 8, defense: 0, xpValue: 10, collisionDamage: 8 },
        behavior: 'chase_player',
        lootTable: { health_potion_small: 0.05 },
        width: 38, height: 38, color: 'darkseagreen'
    },
    ghoul_strong: {
        id: 'ghoul_strong',
        name: '强壮食尸鬼',
        icon: '🧟‍♂️',
        modelPath: 'assets/models/enemies/ghoul_strong.png',
        stats: { maxHp: 70, moveSpeed: 1.2, attackDamage: 15, defense: 2, xpValue: 25, collisionDamage: 15 },
        behavior: 'chase_player',
        lootTable: { health_potion_small: 0.1 },
        width: 42, height: 42, color: 'darkgreen'
    },
    skeleton_archer: {
        id: 'skeleton_archer',
        name: '骷髅弓箭手',
        icon: '💀🏹',
        modelPath: 'assets/models/enemies/skeleton_archer.png',
        stats: { maxHp: 40, moveSpeed: 1.0, attackDamage: 12, defense: 1, xpValue: 20, attackRange: 300, attackCooldown: 2500, projectileId: 'enemy_arrow', collisionDamage: 5 },
        behavior: 'ranged_attack_and_kite',
        lootTable: { xp_orb_medium: 0.1 },
        width: 40, height: 40, color: 'lightgrey'
    },
    skeleton_mage: {
        id: 'skeleton_mage',
        name: '骷髅法师',
        icon: '💀🔮',
        modelPath: 'assets/models/enemies/skeleton_mage.png',
        stats: { maxHp: 60, moveSpeed: 0.8, attackDamage: 18, defense: 0, xpValue: 35, attackRange: 350, attackCooldown: 3000, projectileId: 'enemy_fireball', collisionDamage: 5 },
        behavior: 'ranged_attack_stationary',
        lootTable: { mana_potion_small: 0.08 },
        width: 42, height: 42, color: 'lightblue'
    },
    lich_king: {
        id: 'lich_king',
        name: '巫妖王',
        isBoss: true,
        icon: '👑💀',
        modelPath: 'assets/models/bosses/lich_king.png',
        stats: { maxHp: 1000, moveSpeed: 1.0, attackDamage: 30, defense: 10, xpValue: 200, collisionDamage: 25 },
        behavior: 'boss_lich_king_pattern',
        lootTable: { relic_fragment_random: 0.5, gold_large_pile: 1.0 },
        width: 80, height: 80, color: 'purple'
    }
};

console.log('[EnemiesConfig] ENEMIES_DATA defined.');
// 确保没有 'export' 关键字
