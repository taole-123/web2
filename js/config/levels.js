// js/config/levels.js

/**
 * @file Defines level progression, experience needed, and enemy wave configurations.
 * LEVEL_CONFIG and SPAWN_AREAS will be global variables.
 * Assumes GAME_WIDTH and GAME_HEIGHT are globally available from gameConstants.js.
 */

// 确保 GAME_WIDTH 和 GAME_HEIGHT 在此文件执行时已定义 (通过 gameConstants.js)
// 如果仍然报错 GAME_WIDTH is not defined，说明 gameConstants.js 加载顺序不对或其内部有问题

const LEVEL_CONFIG = {
    1: {
        xpNeeded: 100,
        duration: 60,
        enemyGroups: [
            { enemyId: 'ghoul_weak', count: 5, spawnDelay: 2000, spawnInterval: 5000, maxAlive: 10, spawnAreaKey: 'full_screen_edge' },
        ],
        bossId: null
    },
    2: {
        xpNeeded: 150,
        duration: 90,
        enemyGroups: [
            { enemyId: 'ghoul_weak', count: 8, spawnDelay: 1000, spawnInterval: 4000, maxAlive: 15, spawnAreaKey: 'full_screen_edge' },
            { enemyId: 'skeleton_archer', count: 3, spawnDelay: 10000, spawnInterval: 8000, maxAlive: 5, spawnAreaKey: 'top_half_edge' }
        ],
        bossId: null
    },
    3: {
        xpNeeded: 220,
        duration: 120,
        enemyGroups: [
            { enemyId: 'ghoul_strong', count: 5, spawnDelay: 1000, spawnInterval: 6000, maxAlive: 8, spawnAreaKey: 'full_screen_edge' },
            { enemyId: 'skeleton_archer', count: 5, spawnDelay: 5000, spawnInterval: 7000, maxAlive: 7, spawnAreaKey: 'bottom_half_edge' },
        ],
        bossId: null
    },
    5: { // 示例Boss关卡
        xpNeeded: 500,
        duration: 180,
        enemyGroups: [
            { enemyId: 'ghoul_strong', count: 10, spawnDelay: 1000, spawnInterval: 3000, maxAlive: 15, spawnAreaKey: 'full_screen_edge' },
            { enemyId: 'skeleton_mage', count: 2, spawnDelay: 15000, spawnInterval: 10000, maxAlive: 4, spawnAreaKey: 'full_screen_edge' }
        ],
        bossId: 'lich_king', // 假设有此Boss ID
        bossSpawnTime: 180 // 游戏进行到180秒时生成Boss
    }
};

const SPAWN_AREAS = {
    full_screen_edge: (padding = 50) => {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * GAME_WIDTH; y = -padding; break;
            case 1: x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + padding; break;
            case 2: x = -padding; y = Math.random() * GAME_HEIGHT; break;
            case 3: x = GAME_WIDTH + padding; y = Math.random() * GAME_HEIGHT; break;
            default: x = Math.random() * GAME_WIDTH; y = -padding;
        }
        return { x, y };
    },
    top_half_edge: (padding = 50) => ({ x: Math.random() * GAME_WIDTH, y: -padding }),
    bottom_half_edge: (padding = 50) => ({ x: Math.random() * GAME_WIDTH, y: GAME_HEIGHT + padding })
};

console.log('[LevelsConfig] LEVEL_CONFIG and SPAWN_AREAS defined.');
// 确保没有 'export' 关键字
