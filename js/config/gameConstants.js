// js/config/gameConstants.js

/**
 * @file Defines global game constants.
 * These constants are available globally after this script is loaded.
 */

// 尝试在定义前打印日志，确认文件开始执行
console.log('[GameConstants.js] Attempting to define global constants...');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 42;

const GAME_STATE = {
    HERO_SELECTION: 'heroSelection',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_UP: 'levelUp',
    GAME_OVER: 'gameOver'
};

// 在文件末尾添加 console.log 来确认脚本已执行且变量已定义
if (typeof GAME_WIDTH !== 'undefined' && typeof GAME_HEIGHT !== 'undefined' && typeof TILE_SIZE !== 'undefined' && typeof GAME_STATE !== 'undefined') {
    console.log('[GameConstants.js] Successfully defined: GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, GAME_STATE. Values:', GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, GAME_STATE);
} else {
    console.error('[GameConstants.js] FAILED to define one or more global constants! Check for syntax errors above this line or if the script was loaded at all.');
}
// 确保没有 'export' 关键字
