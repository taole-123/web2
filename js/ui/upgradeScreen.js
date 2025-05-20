// js/ui/upgradeScreen.js

/**
 * @file Manages the upgrade selection screen.
 * Assumes WEAPONS_DATA, SKILLS_DATA, RELICS (and getRelicById) are globally available.
 */

class UpgradeScreen {
    constructor(uiManager, gameController) {
        this.uiManager = uiManager;
        this.gameController = gameController;
        this.screenElement = document.getElementById('upgrade-screen');
        this.optionsContainer = document.getElementById('upgrade-options-container');
        
        // 移除旧的确认按钮逻辑，因为选项本身就是按钮
        // this.confirmButton = document.getElementById('confirm-upgrade'); 
        
        this.availableUpgrades = []; // 当前可供选择的升级项
        this.selectedUpgrade = null;

        if (!this.screenElement || !this.optionsContainer) {
            console.error("Upgrade screen elements not found in HTML!");
        }
        // this.initializeListeners(); // 监听器在 populateOptions 中为每个选项动态添加
    }

    // initializeListeners() {
    //     // 如果有全局确认按钮，则在此处添加监听
    //     // if (this.confirmButton) {
    //     //     this.confirmButton.onclick = () => this.handleConfirm();
    //     // }
    // }

    show() {
        if (!this.screenElement) return;
        this.populateOptions();
        this.screenElement.style.display = 'flex';
    }

    hide() {
        if (!this.screenElement) return;
        this.screenElement.style.display = 'none';
        this.optionsContainer.innerHTML = ''; // 清空选项，以便下次重新生成
        this.availableUpgrades = [];
        this.selectedUpgrade = null;
    }

    populateOptions() {
        if (!this.optionsContainer || !this.gameController.player) return;
        this.optionsContainer.innerHTML = '<h2>选择一项强化:</h2>';
        this.availableUpgrades = this.generateUpgradeOptions(3); // 生成3个升级选项

        this.availableUpgrades.forEach(upgrade => {
            const optionElement = document.createElement('div');
            optionElement.className = 'upgrade-option-card'; // 用于CSS样式
            
            let icon = '❓';
            let name = upgrade.name || '未知升级';
            let description = upgrade.description || '效果未知。';
            let currentLevelText = '';

            if (upgrade.type === 'weapon') {
                const weaponData = WEAPONS_DATA[upgrade.id];
                const playerWeapon = this.gameController.player.weapons.find(w => w.weaponId === upgrade.id);
                icon = weaponData.icon;
                name = weaponData.name;
                currentLevelText = playerWeapon ? ` (当前 Lvl ${playerWeapon.level})` : ' (新!)';
                description = playerWeapon && playerWeapon.level >= weaponData.maxLevel ? `已达最高等级!` : weaponData.description;
                 if (playerWeapon && playerWeapon.level < weaponData.maxLevel) {
                    const nextLevelStats = weaponData.levelStats.find(s => s.level === playerWeapon.level + 1);
                    description += `<br>下一级: ${this.formatStatChanges(nextLevelStats, playerWeapon.currentStats)}`;
                } else if (!playerWeapon) {
                     const firstLevelStats = weaponData.levelStats.find(s => s.level === 1);
                     description += `<br>初始: ${this.formatStatChanges(firstLevelStats, {})}`;
                }

            } else if (upgrade.type === 'skill') {
                // TODO: 技能升级显示
                const skillData = SKILLS_DATA[upgrade.id];
                icon = skillData.icon;
                name = skillData.name;
                description = skillData.description;
            } else if (upgrade.type === 'relic') {
                const relicData = getRelicById(upgrade.id);
                icon = relicData.icon;
                name = relicData.name;
                description = relicData.description;
            }

            optionElement.innerHTML = `
                <div class="upgrade-icon">${icon}</div>
                <div class="upgrade-details">
                    <h4>${name}${currentLevelText}</h4>
                    <p>${description}</p>
                </div>
            `;
            optionElement.onclick = () => this.handleSelection(upgrade);
            this.optionsContainer.appendChild(optionElement);
        });
    }
    
    formatStatChanges(newStats, oldStats) {
        if (!newStats) return "属性无变化。";
        let changes = [];
        for (const key in newStats) {
            if (key === 'level' || key === 'effects') continue;
            const oldValue = oldStats ? oldStats[key] : 0;
            if (newStats[key] !== oldValue) {
                changes.push(`${key}: ${oldValue || 'N/A'} -> ${newStats[key]}`);
            }
        }
        if (newStats.effects && newStats.effects.length > 0) {
            changes.push(`效果: ${newStats.effects.join(', ')}`);
        }
        return changes.length > 0 ? changes.join('; ') : "属性无明显变化。";
    }


    generateUpgradeOptions(count = 3) {
        const player = this.gameController.player;
        let options = [];
        let possibleUpgrades = [];

        // 1. 现有武器升级或获取新武器
        const ownedWeaponIds = player.weapons.map(w => w.weaponId);
        for (const weaponId in WEAPONS_DATA) {
            const weaponData = WEAPONS_DATA[weaponId];
            const playerWeapon = player.weapons.find(w => w.weaponId === weaponId);
            if (playerWeapon) { // 已拥有，可升级
                if (playerWeapon.level < weaponData.maxLevel) {
                    possibleUpgrades.push({ type: 'weapon', id: weaponId, name: weaponData.name, description: `升级 ${weaponData.name} 至 Lvl ${playerWeapon.level + 1}`, weight: 10 });
                }
            } else { // 未拥有，可获取 (如果武器池中武器少于一定数量，例如4个)
                if (player.weapons.length < 4) { // 限制玩家同时拥有的主动武器数量
                     possibleUpgrades.push({ type: 'weapon', id: weaponId, name: weaponData.name, description: `获得新武器: ${weaponData.name}`, weight: 8 });
                }
            }
        }

        // 2. 技能获取或升级 (TODO)
        for (const skillId in SKILLS_DATA) {
            // const skillData = SKILLS_DATA[skillId];
            // const playerSkill = player.skills.find(s => s.id === skillId); // 假设技能对象有id
            // if (playerSkill && playerSkill.level < skillData.maxLevel) { ... }
            // else if (!playerSkill) { ... }
            // 简化：暂时只允许获取新技能
            if (!player.skills.some(s => s.id === skillId)) { // 假设 player.skills 存储的是技能对象或ID
                 possibleUpgrades.push({ type: 'skill', id: skillId, name: SKILLS_DATA[skillId].name, description: `学习新技能: ${SKILLS_DATA[skillId].name}`, weight: 7 });
            }
        }
        
        // 3. 获取圣物 (如果当前圣物数量少于某个限制，例如3个)
        if (player.relics.length < 3) {
            RELICS.forEach(relic => {
                if (!player.relics.some(r => r.id === relic.id)) { // 确保玩家没有这个圣物
                    possibleUpgrades.push({ type: 'relic', id: relic.id, name: relic.name, description: relic.description, weight: 5 });
                }
            });
        }

        // 4. 随机属性提升 (如果上面选项不足) - 也可以作为一种固定选项
        // possibleUpgrades.push({ type: 'stat_boost', name: '随机属性强化', description: '随机提升一项核心属性。', details: { options: [...] }, weight: 3 });


        // 加权随机选择
        let weightedOptions = [];
        possibleUpgrades.forEach(opt => {
            for (let i = 0; i < (opt.weight || 1); i++) {
                weightedOptions.push(opt);
            }
        });
        
        if (weightedOptions.length === 0) { // 如果没有任何可选升级（不太可能发生）
            return [{type: 'stat_boost', name: '生命回复', description: '回复少量生命值。', id:'temp_heal'}];
        }


        while (options.length < count && weightedOptions.length > 0) {
            const randomIndex = Math.floor(Math.random() * weightedOptions.length);
            const chosenOption = weightedOptions[randomIndex];
            
            // 确保不重复添加同ID的升级选项 (除非是不同类型的，例如武器升级和获取同名圣物)
            if (!options.some(opt => opt.id === chosenOption.id && opt.type === chosenOption.type)) {
                options.push(chosenOption);
            }
            // 从 weightedOptions 中移除所有同类型的 chosenOption，避免重复选择
            weightedOptions = weightedOptions.filter(opt => !(opt.id === chosenOption.id && opt.type === chosenOption.type));
        }
        
        // 如果选项不足count个，可以补充一些通用选项，比如“跳过”或“少量经验”
        while (options.length < count && options.length < possibleUpgrades.length) {
             // 尝试从 possibleUpgrades 中找不重复的
            let fallbackOption = possibleUpgrades.find(pu => !options.some(op => op.id === pu.id && op.type === pu.type));
            if (fallbackOption) options.push(fallbackOption); else break;
        }
        if (options.length === 0 && possibleUpgrades.length > 0) options.push(possibleUpgrades[0]); // 保底一个


        return options;
    }

    handleSelection(upgrade) {
        this.selectedUpgrade = upgrade;
        // console.log(`[UpgradeScreen] Player selected:`, upgrade);
        this.applyUpgrade(upgrade);
        this.hide();
        this.gameController.resumeGame(); // 选择后自动继续游戏
    }

    // handleConfirm() {
    //     if (this.selectedUpgrade) {
    //         this.applyUpgrade(this.selectedUpgrade);
    //         this.hide();
    //         this.gameController.resumeGame();
    //     } else {
    //         // console.warn("[UpgradeScreen] No upgrade selected to confirm.");
    //         // 可以给个提示，或者默认选择第一个
    //     }
    // }

    applyUpgrade(upgrade) {
        const player = this.gameController.player;
        switch (upgrade.type) {
            case 'weapon':
                player.addWeapon(upgrade.id); // addWeapon 内部处理升级或添加新武器
                break;
            case 'skill':
                player.addSkill(upgrade.id); // TODO: 实现
                break;
            case 'relic':
                player.addRelic(upgrade.id);
                break;
            case 'stat_boost':
                // TODO: 实现随机属性提升逻辑
                if (upgrade.id === 'temp_heal') player.heal(player.currentStats.maxHp * 0.1); // 回复10%血
                break;
            default:
                console.warn(`[UpgradeScreen] 未知的升级类型: ${upgrade.type}`);
        }
    }
}

console.log('[UpgradeScreenCore] UpgradeScreen class defined.');
