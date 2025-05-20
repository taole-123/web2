// js/ui/uiManager.js

/**
 * @file Manages all UI elements and screens.
 * Assumes HUD, UpgradeScreen classes are globally available.
 */

class UIManager {
    constructor(gameController) {
        this.gameController = gameController;

        // 主要UI屏幕元素
        this.heroSelectionScreenElement = document.getElementById('hero-selection-screen');
        this.heroOptionsContainer = document.getElementById('hero-options-container');
        this.confirmHeroSelectionButton = document.getElementById('confirm-hero-selection');

        this.gameOverScreenElement = document.getElementById('game-over-screen');
        this.statsTimeElement = document.getElementById('stats-time');
        this.statsKillsElement = document.getElementById('stats-kills');
        this.statsLevelElement = document.getElementById('stats-level');
        this.restartGameButton = document.getElementById('restart-game-button');

        this.pauseMenuElement = document.getElementById('pause-menu');
        this.resumeGameButton = document.getElementById('resume-game-button');
        this.quitToMenuButton = document.getElementById('quit-to-menu-button');

        // 实例化子UI模块
        if (typeof HUD !== 'function') console.error("HUD class not found for UIManager");
        this.hud = new HUD(this.gameController);

        if (typeof UpgradeScreen !== 'function') console.error("UpgradeScreen class not found for UIManager");
        this.upgradeScreen = new UpgradeScreen(this, this.gameController);


        this.selectedHeroId = null;
        this.bossWarningTimeout = null; // 用于Boss警告计时器

        this.initializeListeners();
        console.log("[UIManager] Initialized.");
    }

    initializeListeners() {
        if (this.confirmHeroSelectionButton) {
            this.confirmHeroSelectionButton.onclick = () => {
                if (this.selectedHeroId) {
                    // console.log(`[UIManager] Player confirmed hero: ${this.selectedHeroId}`);
                    this.gameController.actuallyStartGame(this.selectedHeroId);
                } else {
                    this.showTemporaryMessage("请先选择一个英雄！", "error");
                }
            };
        }

        if (this.restartGameButton) {
            this.restartGameButton.onclick = () => {
                this.gameController.restartGame();
            };
        }

        if (this.resumeGameButton) {
            this.resumeGameButton.onclick = () => {
                this.gameController.resumeGame();
            };
        }
        if (this.quitToMenuButton) {
            this.quitToMenuButton.onclick = () => {
                 this.hidePauseMenu(); // 隐藏暂停菜单
                 this.gameController.restartGame(); // 返回英雄选择界面
            };
        }

        // 监听键盘事件 (例如 Esc 暂停)
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.gameController.gameState === GAME_STATE.PLAYING) {
                    this.gameController.pauseGame();
                } else if (this.gameController.gameState === GAME_STATE.PAUSED) {
                    // 如果升级界面显示时按Esc，则关闭升级界面并继续游戏
                    if (this.upgradeScreen.screenElement.style.display === 'flex') {
                        this.upgradeScreen.hide();
                        this.gameController.resumeGame();
                    } else {
                         this.gameController.resumeGame(); // 否则就是普通暂停，恢复游戏
                    }
                }
            }
        });
    }

    update(deltaTime) {
        // HUD的更新通常由其自身或GameController在数据变化时触发调用 player.recalculateStats() -> hud.update()
        // 此处可以留空，或用于更新UIManager自身管理的动画等
        if (this.gameController.gameState === GAME_STATE.PLAYING || 
            (this.gameController.gameState === GAME_STATE.PAUSED && this.upgradeScreen.screenElement.style.display !== 'flex')) { // 仅当不是因升级而暂停时才更新HUD
            if (this.hud && typeof this.hud.update === 'function') {
                this.hud.update();
            }
        }
    }

    showTemporaryMessage(message, type = 'info', duration = 3000) {
        let messageDiv = document.getElementById('temp-message-display');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'temp-message-display';
            messageDiv.style.cssText = `
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                padding: 10px 20px; background-color: rgba(0,0,0,0.7); color: white;
                border-radius: 5px; z-index: 1000; font-size: 16px; text-align: center;
                transition: opacity 0.5s ease-out;
            `;
            document.body.appendChild(messageDiv);
        }
        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = type === 'error' ? 'rgba(200,0,0,0.8)' : 'rgba(0,100,200,0.8)';
        messageDiv.style.opacity = '1';

        setTimeout(() => {
            messageDiv.style.opacity = '0';
        }, duration - 500); // 提前开始淡出
    }

    showBossWarning(bossName, duration = 5000) {
        let warningDiv = document.getElementById('boss-warning-display');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'boss-warning-display';
            warningDiv.style.cssText = `
                position: fixed; top: 30%; left: 50%; transform: translateX(-50%);
                padding: 20px 40px; background-color: rgba(150, 0, 0, 0.85); color: white;
                border: 3px solid darkred; border-radius: 10px; z-index: 1001;
                font-size: 32px; text-align: center; font-weight: bold;
                box-shadow: 0 0 20px black;
                animation: bossWarningPulse 1s infinite alternate;
            `;
            // 简单的脉冲动画
            const styleSheet = document.styleSheets[0]; // 获取第一个样式表
            if (styleSheet) {
                 try {
                    styleSheet.insertRule(`
                        @keyframes bossWarningPulse {
                            from { transform: translateX(-50%) scale(1); }
                            to { transform: translateX(-50%) scale(1.05); }
                        }
                    `, styleSheet.cssRules.length);
                } catch (e) { console.warn("Failed to insert bossWarningPulse animation rule:", e); }
            }
            document.body.appendChild(warningDiv);
        }
        warningDiv.innerHTML = `<div>🚨 BOSS 来袭 🚨</div><div style="font-size: 24px; margin-top: 10px;">${bossName}</div>`;
        warningDiv.style.display = 'block';
        warningDiv.style.opacity = '1';

        if (this.bossWarningTimeout) clearTimeout(this.bossWarningTimeout);
        this.bossWarningTimeout = setTimeout(() => {
            warningDiv.style.opacity = '0';
            setTimeout(() => { warningDiv.style.display = 'none'; }, 500); // 等待淡出动画完成
        }, duration);
    }


    // --- Screen Management Methods ---
    showHeroSelectionScreen() {
        if (!this.heroSelectionScreenElement || !this.heroOptionsContainer) {
            console.error("Hero selection screen elements not found!");
            return;
        }
        this.hideAllScreens();
        this.heroOptionsContainer.innerHTML = '';
        this.selectedHeroId = null;

        for (const heroId in HEROES_DATA) {
            const hero = HEROES_DATA[heroId];
            const heroCard = document.createElement('div');
            heroCard.className = 'hero-card';
            heroCard.innerHTML = `
                <div class.hero-card-icon>${hero.icon || '❓'}</div>
                <h4>${hero.name}</h4>
                <p class="hero-card-desc">${hero.description || '暂无描述'}</p>
                <small>初始武器: ${WEAPONS_DATA[hero.initialWeapon]?.name || '无'}</small>
            `;
            heroCard.onclick = () => {
                this.heroOptionsContainer.querySelectorAll('.hero-card.selected').forEach(card => card.classList.remove('selected'));
                heroCard.classList.add('selected');
                this.selectedHeroId = heroId;
            };
            this.heroOptionsContainer.appendChild(heroCard);
        }
        this.heroSelectionScreenElement.style.display = 'flex';
    }

    hideHeroSelectionScreen() {
        if (this.heroSelectionScreenElement) this.heroSelectionScreenElement.style.display = 'none';
    }

    showUpgradeScreen() { // 由 GameController 在 player.levelUp 后调用
        this.hideAllScreens(true); // 隐藏其他屏幕，但保留HUD
        this.upgradeScreen.show();
    }

    hideUpgradeScreen() {
        this.upgradeScreen.hide();
    }

    showGameOverScreen(stats) {
        if (!this.gameOverScreenElement) return;
        this.hideAllScreens();
        if (this.statsTimeElement) this.statsTimeElement.textContent = stats.timeSurvived || 'N/A';
        if (this.statsKillsElement) this.statsKillsElement.textContent = stats.enemiesKilled || '0';
        if (this.statsLevelElement) this.statsLevelElement.textContent = stats.levelReached || '1';
        this.gameOverScreenElement.style.display = 'flex';
    }

    hideGameOverScreen() {
        if (this.gameOverScreenElement) this.gameOverScreenElement.style.display = 'none';
    }

    showPauseMenu() {
        if (!this.pauseMenuElement) return;
        // hideAllScreens(true); // 不完全隐藏所有，因为暂停是叠加在游戏画面上的
        this.hud.hide(); // 暂停时可以隐藏HUD，或者让它半透明
        this.pauseMenuElement.style.display = 'flex';
    }

    hidePauseMenu() {
        if (this.pauseMenuElement) this.pauseMenuElement.style.display = 'none';
        if (this.gameController.gameState === GAME_STATE.PLAYING || this.gameController.gameState === GAME_STATE.PAUSED) { // 确保游戏未结束
             this.hud.show();
        }
    }

    hideAllScreens(keepHud = false) {
        if (this.heroSelectionScreenElement) this.heroSelectionScreenElement.style.display = 'none';
        if (this.upgradeScreen.screenElement) this.upgradeScreen.hide(); // 使用其自身的hide方法
        if (this.gameOverScreenElement) this.gameOverScreenElement.style.display = 'none';
        if (this.pauseMenuElement) this.pauseMenuElement.style.display = 'none';
        
        if (!keepHud) {
            this.hud.hide();
        } else {
            this.hud.show(); // 如果要保留HUD，确保它是可见的
        }
    }
}

console.log('[UIManagerCore] UIManager class defined.');
