// js/core/spawner.js

/**
 * @file Defines the Spawner class for managing enemy generation.
 * Assumes LEVEL_CONFIG, ENEMIES_DATA, SPAWN_AREAS are globally available.
 * Assumes Enemy class is globally available.
 */

class Spawner {
    constructor(gameController) {
        this.gameController = gameController;
        this.currentLevel = 1; // 当前游戏关卡
        this.levelData = null; // 当前关卡的配置数据
        this.activeEnemyGroups = []; // 当前关卡激活的敌人组配置
        this.groupTimers = {}; // 各敌人组的生成计时器
        this.groupSpawnCounters = {}; // 各敌人组已生成的数量 (用于控制 count)
        this.isSpawning = false;
        this.levelStartTime = 0; // 当前关卡开始时间
        this.bossSpawned = false; // 当前关卡的Boss是否已生成

        // console.log("[Spawner] Initialized.");
    }

    start() {
        this.isSpawning = true;
        this.currentLevel = 1; // 或者从 gameController 获取当前关卡
        this.bossSpawned = false;
        this.loadLevelData(this.currentLevel);
        this.levelStartTime = performance.now();
        console.log(`[Spawner] Starting level ${this.currentLevel}.`);
    }

    stop() {
        this.isSpawning = false;
        console.log("[Spawner] Spawning stopped.");
    }

    reset() {
        this.stop();
        this.activeEnemyGroups = [];
        this.groupTimers = {};
        this.groupSpawnCounters = {};
        this.currentLevel = 1;
        this.levelData = null;
        this.bossSpawned = false;
    }

    loadLevelData(levelNumber) {
        this.levelData = LEVEL_CONFIG[levelNumber];
        if (!this.levelData) {
            console.error(`[Spawner] 未找到关卡 ${levelNumber} 的配置数据! Spawning will stop.`);
            this.stop();
            return;
        }
        this.activeEnemyGroups = JSON.parse(JSON.stringify(this.levelData.enemyGroups || [])); // 深拷贝
        this.groupTimers = {};
        this.groupSpawnCounters = {};
        this.bossSpawned = false;

        this.activeEnemyGroups.forEach((group, index) => {
            const groupId = `level${levelNumber}_group${index}`;
            this.groupTimers[groupId] = group.spawnDelay || 0; // 初始化计时器为首次延迟
            this.groupSpawnCounters[groupId] = 0;
        });
        // console.log(`[Spawner] Loaded data for level ${levelNumber}:`, this.levelData);
    }

    update(deltaTime) {
        if (!this.isSpawning || !this.levelData) return;

        const currentTime = performance.now();
        const timeIntoLevel = (currentTime - this.levelStartTime) / 1000; // 秒

        // 处理每个激活的敌人组
        this.activeEnemyGroups.forEach((group, index) => {
            const groupId = `level${this.currentLevel}_group${index}`;
            
            // 检查是否达到最大生成数 (如果定义了 count)
            if (group.count && this.groupSpawnCounters[groupId] >= group.count) {
                return; // 该组已完成指定数量的生成
            }

            this.groupTimers[groupId] -= deltaTime * 1000; // 计时器递减 (毫秒)

            if (this.groupTimers[groupId] <= 0) {
                // 时间到，生成敌人
                const enemyData = ENEMIES_DATA[group.enemyId];
                if (!enemyData) {
                    console.warn(`[Spawner] 未找到敌人ID "${group.enemyId}" 的数据，无法生成。`);
                    this.groupTimers[groupId] = group.spawnInterval || 5000; // 重置计时器
                    return;
                }

                // 检查场上同类型最大存活数
                const aliveOfType = this.gameController.getAliveEnemyCountOfType(group.enemyId);
                if (group.maxAlive && aliveOfType >= group.maxAlive) {
                    this.groupTimers[groupId] = 1000; // 短暂延迟后再次检查
                    return;
                }
                
                // 获取生成位置
                let spawnPosition;
                const spawnAreaFunction = SPAWN_AREAS[group.spawnAreaKey || 'full_screen_edge'];
                if (typeof spawnAreaFunction === 'function') {
                    spawnPosition = spawnAreaFunction();
                } else {
                    console.warn(`[Spawner] 未知的 spawnAreaKey: ${group.spawnAreaKey}. 使用默认边缘生成。`);
                    spawnPosition = SPAWN_AREAS.full_screen_edge();
                }


                if (typeof Enemy === 'function') {
                    const newEnemy = new Enemy(group.enemyId, spawnPosition.x, spawnPosition.y, this.gameController);
                    if (newEnemy.isAlive) { // 确保敌人实例有效创建
                        this.gameController.addEnemy(newEnemy);
                        this.groupSpawnCounters[groupId]++;
                        // console.log(`[Spawner] Spawned ${group.enemyId} at (${spawnPosition.x.toFixed(0)}, ${spawnPosition.y.toFixed(0)}). Count: ${this.groupSpawnCounters[groupId]}/${group.count || 'unlimited'}`);
                    }
                } else {
                     console.error("[Spawner] Enemy class not defined. Cannot spawn enemies.");
                }
                
                // 重置计时器为生成间隔
                this.groupTimers[groupId] = group.spawnInterval || 5000;
            }
        });

        // 检查Boss生成 (如果配置了)
        if (this.levelData.bossId && !this.bossSpawned && this.levelData.bossSpawnTime && timeIntoLevel >= this.levelData.bossSpawnTime) {
            this.spawnBoss(this.levelData.bossId);
        }

        // 检查是否需要进入下一关 (示例：基于时间或Boss击杀)
        // if (timeIntoLevel >= (this.levelData.duration || Infinity) || (this.levelData.bossId && this.bossSpawned && !this.gameController.isBossAlive(this.levelData.bossId))) {
        //     this.goToNextLevel();
        // }
    }

    spawnBoss(bossId) {
        const bossData = ENEMIES_DATA[bossId];
        if (!bossData || !bossData.isBoss) {
            console.error(`[Spawner] 尝试生成无效的Boss ID: ${bossId}`);
            return;
        }
        // Boss 通常在特定位置生成，例如屏幕中央或顶部
        const spawnX = GAME_WIDTH / 2;
        const spawnY = TILE_SIZE * 2; 
        
        if (typeof Enemy === 'function') {
            const bossEnemy = new Enemy(bossId, spawnX, spawnY, this.gameController);
            if (bossEnemy.isAlive) {
                this.gameController.addEnemy(bossEnemy);
                this.bossSpawned = true;
                console.log(`[Spawner] BOSS "${bossData.name}" HAS SPAWNED!`);
                // 可以在此触发Boss战音乐、UI提示等
                this.gameController.uiManager.showBossWarning(bossData.name);
            }
        } else {
            console.error("[Spawner] Enemy class not defined. Cannot spawn boss.");
        }
    }

    goToNextLevel() {
        this.currentLevel++;
        if (LEVEL_CONFIG[this.currentLevel]) {
            console.log(`[Spawner] Advancing to level ${this.currentLevel}.`);
            this.loadLevelData(this.currentLevel);
            this.levelStartTime = performance.now(); // 重置关卡开始时间
            this.bossSpawned = false;
            // 通知 GameController 关卡变更 (如果需要)
            // this.gameController.onLevelChange(this.currentLevel);
        } else {
            console.log("[Spawner] All configured levels completed or next level not found!");
            this.stop(); // 停止生成
            // 触发游戏胜利或无尽模式等
            // this.gameController.gameWon();
        }
    }
}

console.log('[SpawnerCore] Spawner class defined.');
