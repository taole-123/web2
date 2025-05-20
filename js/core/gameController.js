// js/core/gameController.js

/**
 * @file Main game controller class.
 * Assumes Player, UIManager, Spawner, LootManager classes and config files are globally available.
 */

class GameController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with ID "${canvasId}" not found! Game cannot start.`);
            alert(`Canvas with ID "${canvasId}" not found!`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME_WIDTH;  // 使用全局常量
        this.canvas.height = GAME_HEIGHT; // 使用全局常量

        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.lootItems = [];
        this.temporaryHitboxes = []; // 用于近战攻击等临时判定区

        // 实例化管理器
        if (typeof UIManager !== 'function') throw new Error("UIManager class is not defined!");
        this.uiManager = new UIManager(this);

        if (typeof Spawner !== 'function') throw new Error("Spawner class is not defined!");
        this.spawner = new Spawner(this);

        if (typeof LootManager !== 'function') throw new Error("LootManager class is not defined!");
        this.lootManager = new LootManager(this);
        
        this.inputState = { up: false, down: false, left: false, right: false, mouseX:0, mouseY:0 }; // 玩家输入状态

        this.gameState = GAME_STATE.HERO_SELECTION;
        this.gameTime = 0;
        this.killCount = 0;
        this.lastTime = 0;
        this.selectedHeroId = null;
        this._animationFrameId = null;

        this.gameLoop = this.gameLoop.bind(this); // 绑定this

        this.setupInputHandlers();
        this.uiManager.showHeroSelectionScreen(); // 初始显示英雄选择
        console.log("[GameController] Initialized. Canvas size:", this.canvas.width, "x", this.canvas.height);
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== GAME_STATE.PLAYING && this.gameState !== GAME_STATE.PAUSED) return; // 只在游戏中处理
            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup':    this.inputState.up = true; break;
                case 's': case 'arrowdown':  this.inputState.down = true; break;
                case 'a': case 'arrowleft':  this.inputState.left = true; break;
                case 'd': case 'arrowright': this.inputState.right = true; break;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.gameState !== GAME_STATE.PLAYING && this.gameState !== GAME_STATE.PAUSED) return;
             switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup':    this.inputState.up = false; break;
                case 's': case 'arrowdown':  this.inputState.down = false; break;
                case 'a': case 'arrowleft':  this.inputState.left = false; break;
                case 'd': case 'arrowright': this.inputState.right = false; break;
            }
        });
        // 鼠标移动 (可选，用于武器瞄准等)
        // this.canvas.addEventListener('mousemove', (e) => {
        //     const rect = this.canvas.getBoundingClientRect();
        //     this.inputState.mouseX = e.clientX - rect.left;
        //     this.inputState.mouseY = e.clientY - rect.top;
        // });
    }


    actuallyStartGame(heroId) { // 由 UIManager 在英雄选择确认后调用
        if (this.gameState !== GAME_STATE.HERO_SELECTION) return;
        this.selectedHeroId = heroId;
        
        if (typeof Player !== 'function') {
            console.error("Player class is not defined! Cannot start game.");
            this.uiManager.showTemporaryMessage("错误: 玩家模块加载失败!", "error");
            return;
        }
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, heroId, this);
        if (!this.player.heroData) { // Player构造函数中如果heroData未找到会用默认值，这里再检查一下
            this.uiManager.showTemporaryMessage("错误: 英雄数据加载失败!", "error");
            this.player = null; // 清理无效玩家
            return;
        }

        this.enemies = [];
        this.projectiles = [];
        this.lootItems = [];
        this.temporaryHitboxes = [];
        this.gameTime = 0;
        this.killCount = 0;
        
        this.spawner.start(); // 启动敌人生成器
        
        this.uiManager.hideHeroSelectionScreen();
        this.uiManager.hud.show(); // 显示游戏主界面
        this.uiManager.hud.update(); // 初始更新HUD，包括武器和圣物
        this.uiManager.hud.updateWeaponDisplay(this.player.weapons);
        this.uiManager.hud.updateRelicDisplay(this.player.relics);


        this.gameState = GAME_STATE.PLAYING;
        this.lastTime = performance.now();
        if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
        this.gameLoop();
        console.log(`[GameController] Game started with hero: ${this.player.heroData.name}. State: ${this.gameState}`);
    }

    gameLoop(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime; // 初始化lastTime
        const deltaTime = (currentTime - this.lastTime) / 1000; // 秒
        this.lastTime = currentTime;

        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameTime += deltaTime;
            
            // 更新逻辑
            if (this.player) this.player.update(deltaTime, this.inputState);
            this.spawner.update(deltaTime);
            this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));
            this.projectiles.forEach(p => p.update(deltaTime));
            this.lootItems.forEach(loot => loot.update(deltaTime, this.player)); // 掉落物也可能被玩家吸引
            this.updateTemporaryHitboxes(deltaTime);


            this.handleCollisions();

            // 清理非活动单位
            this.enemies = this.enemies.filter(enemy => enemy.isAlive);
            this.projectiles = this.projectiles.filter(p => p.isActive);
            this.lootItems = this.lootItems.filter(loot => loot.isActive);
            this.temporaryHitboxes = this.temporaryHitboxes.filter(hb => hb.isActive);
        }

        // 渲染
        this.clearCanvas();
        this.drawBackground();
        
        this.lootItems.forEach(loot => loot.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        if (this.player) this.player.draw(this.ctx); // 玩家在敌人和掉落物之上
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.temporaryHitboxes.forEach(hb => { // (可选) 调试绘制临时攻击框
            // ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            // ctx.strokeRect(hb.x - hb.width/2, hb.y - hb.height/2, hb.width, hb.height);
        });


        // UI 更新 (HUD主要由数据变化驱动，但其他UI元素可能需要每帧更新)
        this.uiManager.update(deltaTime);

        // 请求下一帧
        if (this.gameState !== GAME_STATE.GAME_OVER && this.gameState !== GAME_STATE.HERO_SELECTION) {
             this._animationFrameId = requestAnimationFrame(this.gameLoop);
        } else {
            if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }
    
    addTemporaryHitbox(hitboxData) {
        // hitboxData: { x, y, width, height, damage, knockback, duration, startTime, ownerId, type }
        this.temporaryHitboxes.push({ ...hitboxData, isActive: true });
    }

    updateTemporaryHitboxes(deltaTime) {
        const currentTime = performance.now();
        this.temporaryHitboxes.forEach(hb => {
            if (currentTime - hb.startTime > hb.duration) {
                hb.isActive = false;
            }
        });
    }


    handleCollisions() {
        if (!this.player || !this.player.isAlive) return;

        // 玩家与敌人碰撞 (触碰伤害)
        this.enemies.forEach(enemy => {
            if (enemy.isAlive && this.checkCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.stats.collisionDamage || 1);
                // 可以添加一个短暂的无敌或击退效果
            }
        });

        // 弹射物与敌人碰撞
        this.projectiles.forEach(projectile => {
            if (!projectile.isActive || projectile.ownerId === 'enemy') return; // 玩家弹射物打敌人
            this.enemies.forEach(enemy => {
                if (enemy.isAlive && !projectile.hitEnemies.has(enemy.id) && this.checkCollision(projectile, enemy)) {
                    enemy.takeDamage(projectile.damage);
                    projectile.onHit(enemy); // 处理穿透或消失
                    // 如果弹射物在 onHit 后仍然 active (例如穿透)，则不应立即从 hitEnemies 移除
                }
            });
        });
        
        // 敌人弹射物与玩家碰撞
        this.projectiles.forEach(projectile => {
            if (!projectile.isActive || projectile.ownerId !== 'enemy') return; // 敌人弹射物打玩家
            if (this.checkCollision(projectile, this.player)) {
                this.player.takeDamage(projectile.damage);
                projectile.isActive = false; // 敌人弹射物通常一击即溃
            }
        });
        
        // 近战攻击判定区与敌人碰撞
        this.temporaryHitboxes.forEach(hitbox => {
            if (hitbox.isActive && hitbox.type === 'melee_hit' && hitbox.ownerId === this.player.id) {
                this.enemies.forEach(enemy => {
                    if (enemy.isAlive && this.checkCollision(hitbox, enemy)) {
                        enemy.takeDamage(hitbox.damage);
                        // TODO: 应用击退 hitbox.knockback
                        // 通常一个近战攻击会对一个敌人只造成一次伤害，需要标记
                        // 为了简化，暂时允许多次伤害，但更好的做法是标记已击中
                    }
                });
            }
        });


        // 玩家与掉落物碰撞
        this.lootItems.forEach(loot => {
            if (loot.isActive && this.checkCollision(this.player, loot, player.currentStats.pickupRadius || loot.pickupRadius)) {
                loot.collect(this.player);
            }
        });
    }

    checkCollision(rect1, rect2, customRadius1 = 0) {
        // AABB 碰撞检测 (假设 x, y 是中心点)
        const r1HalfWidth = (rect1.width / 2) + customRadius1;
        const r1HalfHeight = (rect1.height / 2) + customRadius1;
        const r2HalfWidth = rect2.width / 2;
        const r2HalfHeight = rect2.height / 2;

        return Math.abs(rect1.x - rect2.x) < (r1HalfWidth + r2HalfWidth) &&
               Math.abs(rect1.y - rect2.y) < (r1HalfHeight + r2HalfHeight);
    }
    
    onEnemyKilled(enemy) {
        this.killCount++;
        if (this.player) this.player.collectExperience(enemy.stats.xpValue || 5); // 敌人死亡给经验
        this.lootManager.requestLootDrop(enemy.x, enemy.y, enemy.lootTable);

        if (enemy.isBoss || enemy.isElite) {
            if (this.player) this.player.handleEliteOrBossKill(enemy);
        }
        // console.log(`Kill count: ${this.killCount}`);
        if (this.uiManager.hud) this.uiManager.hud.update(); // 更新击杀数显示
    }
    
    getAliveEnemyCountOfType(enemyId) {
        return this.enemies.filter(e => e.isAlive && e.enemyId === enemyId).length;
    }

    pauseGame(newState = GAME_STATE.PAUSED) { // newState 可以是 PAUSED 或 LEVEL_UP
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = newState;
            console.log(`Game paused. Reason: ${newState}`);
            if (newState === GAME_STATE.PAUSED) {
                this.uiManager.showPauseMenu();
            } else if (newState === GAME_STATE.LEVEL_UP) {
                this.uiManager.showUpgradeScreen();
            }
        }
    }

    resumeGame() {
        if (this.gameState === GAME_STATE.PAUSED || this.gameState === GAME_STATE.LEVEL_UP) {
            const previousState = this.gameState;
            this.gameState = GAME_STATE.PLAYING;
            this.lastTime = performance.now(); // 重置时间以避免deltaTime过大
            console.log("Game resumed.");
            
            if (previousState === GAME_STATE.PAUSED) this.uiManager.hidePauseMenu();
            if (previousState === GAME_STATE.LEVEL_UP) this.uiManager.hideUpgradeScreen();
            
            if (!this._animationFrameId) { // 如果循环已停止，则重启
                 this.gameLoop(performance.now());
            }
        }
    }

    gameOver() {
        if (this.gameState === GAME_STATE.GAME_OVER) return; // 防止重复调用
        this.gameState = GAME_STATE.GAME_OVER;
        console.log("Game Over.");
        this.spawner.stop();
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        this.uiManager.showGameOverScreen({
            timeSurvived: this.getFormattedGameTime(),
            enemiesKilled: this.killCount,
            levelReached: this.player ? this.player.level : 1
        });
    }

    restartGame() { // 返回英雄选择界面
        console.log("Restarting game (back to hero selection)...");
        if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.lootItems = [];
        this.temporaryHitboxes = [];
        this.gameTime = 0;
        this.killCount = 0;
        this.selectedHeroId = null;
        this.spawner.reset();
        
        this.gameState = GAME_STATE.HERO_SELECTION;
        this.uiManager.showHeroSelectionScreen(); // 显示英雄选择
    }
    
    addProjectile(projectile) { this.projectiles.push(projectile); }
    addEnemy(enemy) { this.enemies.push(enemy); }
    addLoot(loot) { this.lootItems.push(loot); }

    clearCanvas() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    drawBackground() {
        this.ctx.fillStyle = '#1a1a2e'; // 深邃星空蓝
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // 可以绘制网格或其他背景元素
    }
    getFormattedGameTime() {
        const totalSeconds = Math.floor(this.gameTime);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

console.log('[GameControllerCore] GameController class defined.');
