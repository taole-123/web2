// js/ui/hud.js

/**
 * @file Defines the HUD class for displaying game information.
 */

class HUD {
    constructor(gameController) {
        this.gameController = gameController;

        this.hudElement = document.getElementById('hud');
        this.hpElement = document.getElementById('hud-hp-value');
        this.levelElement = document.getElementById('hud-level-value');
        this.xpElement = document.getElementById('hud-xp-value');
        this.xpBarFillElement = document.getElementById('hud-xp-bar-fill');
        this.timerElement = document.getElementById('hud-timer-value');
        this.killCountElement = document.getElementById('hud-kill-count-value');
        
        this.relicsListElement = document.getElementById('hud-relics-list');
        this.weaponsContainerElement = document.createElement('div'); // 动态创建武器显示区域
        this.weaponsContainerElement.id = 'hud-weapons-container';
        this.weaponsContainerElement.className = 'hud-item';
        this.weaponsContainerElement.innerHTML = '<h4>武器:</h4>';
        
        this.weaponsListElement = document.createElement('ul');
        this.weaponsListElement.id = 'hud-weapons-list';
        this.weaponsListElement.style.cssText = 'list-style-type:none; padding-left:0; display:flex; flex-direction: column; gap:3px;'; // 武器垂直排列
        this.weaponsContainerElement.appendChild(this.weaponsListElement);
        
        // 将武器容器添加到主HUD区域的某个地方
        // 例如，添加到圣物容器之后
        const relicsContainer = document.getElementById('hud-relics-container');
        if (relicsContainer && relicsContainer.parentNode) {
            relicsContainer.parentNode.insertBefore(this.weaponsContainerElement, relicsContainer.nextSibling);
        } else if (this.hudElement) { // 如果圣物容器不存在，则直接添加到HUD末尾
            this.hudElement.appendChild(this.weaponsContainerElement);
        }


        if (!this.hudElement || !this.hpElement || !this.relicsListElement) {
            console.warn("HUD elements not fully found in HTML. HUD display might be incomplete.");
        }
    }

    show() {
        if (this.hudElement) this.hudElement.style.display = 'flex'; // 或 'block'
    }
    hide() {
        if (this.hudElement) this.hudElement.style.display = 'none';
    }

    update() {
        if (!this.gameController || !this.gameController.player || !this.gameController.player.isAlive) {
            // 如果玩家不存在或已死亡，可以考虑隐藏部分HUD或显示特定信息
            // 但基本更新逻辑应先检查 player 对象
            if (this.gameController.gameState !== GAME_STATE.GAME_OVER && this.gameController.gameState !== GAME_STATE.HERO_SELECTION) {
                 // console.warn("[HUD] Player not available for HUD update.");
            }
            return;
        }
        const player = this.gameController.player;

        if (this.hpElement) {
            this.hpElement.textContent = `${player.hp.toFixed(0)} / ${player.currentStats.maxHp.toFixed(0)}`;
        }
        if (this.levelElement) {
            this.levelElement.textContent = `${player.level}`;
        }
        if (this.xpElement) {
            this.xpElement.textContent = `${player.experience.toFixed(0)} / ${player.experienceToNextLevel}`;
        }
        if (this.xpBarFillElement) {
            const xpPercentage = (player.experience / player.experienceToNextLevel) * 100;
            this.xpBarFillElement.style.width = `${clamp(xpPercentage, 0, 100)}%`; // 使用 clamp 确保在0-100之间
        }
        if (this.timerElement) {
            this.timerElement.textContent = this.gameController.getFormattedGameTime();
        }
        if (this.killCountElement) {
            this.killCountElement.textContent = `${this.gameController.killCount}`;
        }
        // 圣物和武器的更新由专门方法处理，在获取或升级时调用
    }

    updateRelicDisplay(relics) {
        if (!this.relicsListElement) return;
        this.relicsListElement.innerHTML = '';
        if (relics && relics.length > 0) {
            relics.forEach(relic => {
                const listItem = document.createElement('li');
                listItem.innerHTML = relic.icon;
                listItem.title = `${relic.name}: ${relic.description}`;
                listItem.className = 'hud-icon-item relic-icon';
                this.relicsListElement.appendChild(listItem);
            });
        }
    }
    
    updateWeaponDisplay(weapons) {
        if(!this.weaponsListElement) return;
        this.weaponsListElement.innerHTML = '';
        if(weapons && weapons.length > 0) {
            weapons.forEach(weaponInstance => {
                const weaponData = WEAPONS_DATA[weaponInstance.weaponId];
                if(weaponData){
                    const listItem = document.createElement('li');
                    listItem.className = 'hud-weapon-item';
                    listItem.innerHTML = `
                        <span class="hud-icon-item weapon-icon" title="${weaponData.name}: ${weaponData.description}">${weaponData.icon}</span>
                        <span>${weaponData.name} (Lvl ${weaponInstance.level})</span>
                    `;
                    this.weaponsListElement.appendChild(listItem);
                }
            });
        }
    }
}
console.log('[HUDCore] HUD class defined.');
