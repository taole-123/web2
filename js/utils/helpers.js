// js/utils/helpers.js

/**
 * @file Contains utility functions for the game.
 * These functions will be globally available.
 * GAME_WIDTH and GAME_HEIGHT are assumed to be globally defined by gameConstants.js.
 */

// 移除重复的 GAME_WIDTH, GAME_HEIGHT 声明
// const GAME_WIDTH = 800; // 这行是错误的，已在 gameConstants.js 中定义
// const GAME_HEIGHT = 600; // 这行是错误的

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer.
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min (inclusive) and max (exclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random float.
 */
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

/**
 * Calculates the distance between two points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} The distance.
 */
function distanceBetweenPoints(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes a vector.
 * @param {number} x
 * @param {number} y
 * @returns {{x: number, y: number}} The normalized vector, or {x:0, y:0} if magnitude is 0.
 */
function normalizeVector(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude === 0) {
        return { x: 0, y: 0 };
    }
    return { x: x / magnitude, y: y / magnitude };
}


console.log('[Helpers] Utility functions (getRandomInt, getRandomFloat, etc.) defined.');
// 没有 'export' 关键字
