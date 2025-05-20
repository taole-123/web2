// js/main.js

/**
 * @file Main entry point for the game.
 * Initializes the GameController when the window loads.
 */

window.onload = () => {
    console.log("[Main.js] window.onload event fired. Starting checks...");

    let allClear = true;
    const checks = [
        // Config Variables from gameConstants.js
        { name: 'GAME_WIDTH', type: 'number', file: 'js/config/gameConstants.js' },
        { name: 'GAME_HEIGHT', type: 'number', file: 'js/config/gameConstants.js' },
        { name: 'TILE_SIZE', type: 'number', file: 'js/config/gameConstants.js' },
        { name: 'GAME_STATE', type: 'object', file: 'js/config/gameConstants.js' },

        // Config Variables from other config files
        { name: 'HEROES_DATA', type: 'object', file: 'js/config/heroes.js' },
        { name: 'LEVEL_CONFIG', type: 'object', file: 'js/config/levels.js' },
        { name: 'SPAWN_AREAS', type: 'object', file: 'js/config/levels.js' },
        { name: 'ENEMIES_DATA', type: 'object', file: 'js/config/enemies.js' },
        { name: 'WEAPONS_DATA', type: 'object', file: 'js/config/weapons.js' },
        { name: 'SKILLS_DATA', type: 'object', file: 'js/config/skills.js' },
        { name: 'RELICS', type: 'object', file: 'js/config/relics.js' },
        { name: 'getRelicById', type: 'function', file: 'js/config/relics.js' },

        // Utility functions from helpers.js
        { name: 'getRandomInt', type: 'function', file: 'js/utils/helpers.js' },
        { name: 'normalizeVector', type: 'function', file: 'js/utils/helpers.js' },
        { name: 'clamp', type: 'function', file: 'js/utils/helpers.js' },
        { name: 'distanceBetweenPoints', type: 'function', file: 'js/utils/helpers.js' },

        // Core Classes
        { name: 'Weapon', type: 'function', file: 'js/core/weapon.js' },
        { name: 'Projectile', type: 'function', file: 'js/core/weapon.js' },
        { name: 'Player', type: 'function', file: 'js/core/player.js' },
        { name: 'Enemy', type: 'function', file: 'js/core/enemy.js' },
        { name: 'Loot', type: 'function', file: 'js/core/loot.js' },
        { name: 'ExperienceOrb', type: 'function', file: 'js/core/loot.js' },
        { name: 'HealthPotion', type: 'function', file: 'js/core/loot.js' },
        { name: 'LootManager', type: 'function', file: 'js/core/loot.js' },
        { name: 'Spawner', type: 'function', file: 'js/core/spawner.js' },

        // UI Classes
        { name: 'HUD', type: 'function', file: 'js/ui/hud.js' },
        { name: 'UpgradeScreen', type: 'function', file: 'js/ui/upgradeScreen.js' },
        { name: 'UIManager', type: 'function', file: 'js/ui/uiManager.js' },

        // Main Game Controller Class
        { name: 'GameController', type: 'function', file: 'js/core/gameController.js' }
    ];

    console.log("[Main.js] Beginning checks for global variables and classes...");
    for (const check of checks) {
        let item;
        try {
            // 尝试直接在当前作用域（理论上是全局作用域）访问变量/类
            // eval() 不是最佳实践，但在这里用于动态访问变量名以进行检查
            // 更安全的方式是，如果所有这些都挂载到了window上，则继续使用 window[check.name]
            // 但鉴于之前的错误，我们先尝试这种方式
            // 对于函数和类，可以直接 typeof ClassName
            // 对于变量，typeof variableName
            if (check.type === 'function' || check.type === 'object') { // 类也是 'function' 类型
                 // eslint-disable-next-line no-eval
                item = eval(check.name);
            } else {
                 // eslint-disable-next-line no-eval
                item = eval(check.name);
            }
        } catch (e) {
            // 如果 eval 抛出 ReferenceError，说明变量确实未定义
            item = undefined;
        }
        
        const itemType = typeof item;

        if (itemType !== check.type) {
            // 如果直接访问也失败，再尝试 window[check.name] 以确认是否挂载到了window
            const windowItem = window[check.name];
            const windowItemType = typeof windowItem;

            let errorMessage = `错误: ${check.name} (应为 ${check.type}, 直接访问类型为 ${itemType}, window访问类型为 ${windowItemType}) 未定义或类型不匹配! `;
            errorMessage += `请检查 ${check.file} 是否已正确加载且在 main.js 之前，并且没有使用 export 关键字，且变量/类已正确声明。`;
            
            console.error(errorMessage);
            allClear = false;
        } else {
            // console.log(`[Main.js Check] PASSED: ${check.name} (${check.type}) is defined directly.`);
        }
    }

    if (!allClear) {
        const finalErrorMsg = "一个或多个核心组件加载失败，游戏无法启动。请打开浏览器开发者控制台 (通常按 F12)，查看详细错误信息，并确认所有JS文件路径正确、内部没有语法错误，且已按正确顺序加载。";
        console.error(finalErrorMsg);
        alert(finalErrorMsg);
        return;
    }
    
    console.log("[Main.js] 所有核心组件初步检查通过。尝试初始化 GameController...");

    try {
        // 现在可以直接使用这些类和变量，因为它们应该在全局作用域中
        window.gameController = new GameController('gameCanvas');
        console.log("[Main.js] GameController 实例已创建并挂载到 window.gameController。游戏启动中...");
    } catch (error) {
        console.error("[Main.js] 初始化 GameController 时发生严重错误:", error, error.stack);
        alert("游戏启动失败，请查看控制台获取详细错误信息。\n" + error.message + (error.stack ? `\nStack: ${error.stack}`: ''));
    }
};

// 确保 main.js 文件本身没有语法错误，并在末尾添加一个日志
console.log("[Main.js] Script loaded and parsed.");
