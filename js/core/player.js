// js/core/player.js

/**
 * @file Defines the Player class.
 * Assumes config files (HEROES_DATA, LEVEL_CONFIG, RELICS, WEAPONS_DATA, SKILLS_DATA)
 * and utility classes/functions (Weapon, getRelicById, normalizeVector, clamp, TILE_SIZE etc.) are globally available.
 */

class Player {
    constructor(x, y, heroId, gameController) {
        this.gameController = gameController;
        this.id = `player_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;

        let heroData; // 声明 heroData

        if (typeof window.HEROES_DATA === 'undefined') {
            console.error(`[Player Critical Error] window.HEROES_DATA is undefined! Cannot load hero data. This might be due to a script loading issue or browser extension interference.`);
            // 设置一个非常基础的默认值，或者让游戏无法继续
            this.heroData = { id:"FALLBACK_DEFAULT", name: 'Fallback Hero', stats: { maxHp: 100, moveSpeed: 2.0, attackDamage: 5, defense: 0, luck: 0, critChance: 0, pickupRadius: 50 }, color: 'black', initialWeapon: null, initialSkills: [] };
            // 可以在这里抛出错误或通知GameController游戏无法初始化
            // throw new Error("HEROES_DATA is not available, cannot initialize player.");
        } else {
            heroData = window.HEROES_DATA[heroId];
            if (!heroData) {
                console.error(`[Player] Hero data for ID "${heroId}" not found in window.HEROES_DATA! Using default.`);
                this.heroData = { id:"DEFAULT_HERO_NOT_FOUND", name: `Default (ID: ${heroId} missing)`, stats: { maxHp: 100, moveSpeed: 2.5, attackDamage: 10, defense: 0, luck: 0, critChance: 0.05, pickupRadius: 100 }, color: 'gray', initialWeapon: null, initialSkills: [] };
            } else {
                this.heroData = heroData;
            }
        }
        
        this.x = x;
        this.y = y;
        // 确保 TILE_SIZE 已定义，否则使用备用值
        const tileSize = typeof window.TILE_SIZE === 'number' ? window.TILE_SIZE : 42;
        this.width = tileSize * 0.8;
        this.height = tileSize * 0.8;
        this.color = this.heroData.color || 'blue';

        this.baseStats = { ...(this.heroData.stats || { maxHp: 100, moveSpeed: 2.5, attackDamage: 10, defense: 0, luck: 0, critChance: 0.05, pickupRadius: 100 }) }; // 确保 stats 存在
        this.currentStats = { ...this.baseStats };
        this.hp = this.currentStats.maxHp;
        this.damageTakenMultiplier = 1.0;

        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = (window.LEVEL_CONFIG && window.LEVEL_CONFIG[this.level]?.xpNeeded) || 100;

        this.relics = [];
        this.activeRelicEffects = {
            passiveStats: {},
            onLevelUp: [],
            onXPCollect: [],
            onEliteOrBossKill: [],
            onDamageTaken: []
        };
        this.relicCounters = {};

        this.weapons = [];
        this.skills = [];

        this.directionX = 0;
        this.directionY = 1;
        this.isAlive = true;

        this.init();
    }

    init() {
        console.log(`[Player] 英雄 "${this.heroData.name}" (ID: ${this.id}) 已准备就绪!`);
        if (this.heroData.initialWeapon) {
            this.addWeapon(this.heroData.initialWeapon);
        }
        if (this.heroData.initialSkills && this.heroData.initialSkills.length > 0) {
            this.heroData.initialSkills.forEach(skillId => this.addSkill(skillId));
        }
        this.recalculateStats();
    }

    addWeapon(weaponId) {
        if (typeof Weapon !== 'function') {
            console.error("[Player] Weapon class not found. Cannot add weapon.");
            return false;
        }
        const existingWeapon = this.weapons.find(w => w.weaponId === weaponId);
        if (existingWeapon) {
            existingWeapon.addLevel();
        } else {
            const newWeapon = new Weapon(this.id, weaponId, this.gameController);
            if (newWeapon.isValid) {
                this.weapons.push(newWeapon);
                console.log(`[Player] 获得新武器: ${newWeapon.name}`);
            } else {
                 console.warn(`[Player] 尝试添加无效的武器ID: ${weaponId}`);
                 return false;
            }
        }
        if (this.gameController.uiManager && this.gameController.uiManager.hud) {
            this.gameController.uiManager.hud.updateWeaponDisplay(this.weapons);
        }
        return true;
    }

    addSkill(skillId) {
        const skillData = window.SKILLS_DATA ? window.SKILLS_DATA[skillId] : undefined;
        if (skillData) {
            this.skills.push({ id: skillId, data: skillData });
            console.log(`[Player] TODO: 添加技能 ${skillId}`);
            this.recalculateStats();
        } else {
            console.warn(`[Player] 未找到技能ID: ${skillId} 或 SKILLS_DATA 未定义`);
        }
    }

    addRelic(relicId) {
        if (typeof window.getRelicById !== 'function' || typeof window.RELICS === 'undefined') {
            console.error("[Player] getRelicById function or RELICS data is not available.");
            return false;
        }
        const relicData = window.getRelicById(relicId);
        if (!relicData) {
            console.warn(`[Player] 尝试添加未知的圣物ID: ${relicId}`);
            return false;
        }
        if (this.relics.find(r => r.id === relicId)) {
            console.warn(`[Player] 圣物 "${relicData.name}" (${relicId}) 已拥有。`);
            return false;
        }

        this.relics.push(relicData);
        console.log(`[Player] 获得圣物: ${relicData.icon} ${relicData.name}`);

        relicData.effects.forEach(effect => {
            const triggerType = effect.trigger;
            if (!this.activeRelicEffects[triggerType]) {
                this.activeRelicEffects[triggerType] = [];
            }
            
            if (triggerType === 'passive' && effect.action === 'modifyStat') {
                const { stat, value, type } = effect.details;
                if (!this.activeRelicEffects.passiveStats[stat]) {
                    this.activeRelicEffects.passiveStats[stat] = [];
                }
                this.activeRelicEffects.passiveStats[stat].push({ value, type, source: relicData.id, sourceRelicName: relicData.name });
            } else {
                 this.activeRelicEffects[triggerType].push({ ...effect, sourceRelicName: relicData.name });
            }

            if (effect.condition && effect.condition.type === 'counter') {
                this.relicCounters[effect.condition.counterId] = this.relicCounters[effect.condition.counterId] || 0;
            }
        });

        this.recalculateStats();
        if (this.gameController.uiManager && this.gameController.uiManager.hud) {
            this.gameController.uiManager.hud.updateRelicDisplay(this.relics);
        }
        return true;
    }

    recalculateStats() {
        this.currentStats = { ...(this.heroData.stats || { maxHp: 100, moveSpeed: 2.5, attackDamage: 10, defense: 0, luck: 0, critChance: 0.05, pickupRadius: 100 }) };
        this.damageTakenMultiplier = 1.0;

        for (const statName in this.baseStats) {
            if (this.heroData.stats.hasOwnProperty(statName) && this.baseStats[statName] !== this.heroData.stats[statName]) {
                 this.currentStats[statName] = this.baseStats[statName];
            }
        }

        if (this.activeRelicEffects.passiveStats) {
            for (const statKey in this.activeRelicEffects.passiveStats) {
                if (this.activeRelicEffects.passiveStats.hasOwnProperty(statKey)) {
                    const modifiersArray = this.activeRelicEffects.passiveStats[statKey];
                    modifiersArray.forEach(mod => {
                        this._applyStatModifier(statKey, mod.value, mod.type, 'relic', mod.sourceRelicName);
                    });
                }
            }
        }

        this.skills.forEach(skillInfo => {
            const skillData = skillInfo.data;
            if (skillData && skillData.type === 'passive_stat_boost' && skillData.levelStats) {
                const skillLevelData = skillData.levelStats[0]; 
                if (skillLevelData && skillLevelData.effects) {
                    skillLevelData.effects.forEach(effect => {
                        this._applyStatModifier(effect.stat, effect.value, effect.type, 'skill', skillData.name);
                    });
                }
            }
        });

        this.hp = Math.min(this.hp, this.currentStats.maxHp);
        
        if (this.gameController.uiManager && this.gameController.uiManager.hud) {
            this.gameController.uiManager.hud.update();
        }
    }

    _applyStatModifier(statName, value, type, source, sourceName = 'Unknown') {
        const originalHeroStat = this.heroData.stats[statName];

        switch (statName) {
            case 'maxHp':
            case 'attackDamage':
            case 'defense':
            case 'luck':
            case 'critChance':
            case 'pickupRadius':
            case 'moveSpeed':
            case 'area':
            case 'duration':
            case 'cooldown':
            case 'projectiles':
                if (this.currentStats.hasOwnProperty(statName) || ['area', 'duration', 'cooldown', 'projectiles'].includes(statName) ) {
                    if (!this.currentStats.hasOwnProperty(statName)) this.currentStats[statName] = (statName === 'projectiles' ? 1 : (statName === 'cooldown' ? 1000 : 1) ); // Default for new stats

                    if (type === 'flat_add') {
                        this.currentStats[statName] += value;
                    } else if (type === 'percentage_add') {
                        this.currentStats[statName] *= (1 + value);
                    } else if (type === 'percentage_base' && typeof originalHeroStat === 'number') {
                        this.currentStats[statName] += originalHeroStat * value;
                    } else if (type === 'percentage_base' && typeof originalHeroStat === 'undefined' && !['maxHp', 'attackDamage', 'defense', 'luck', 'critChance', 'pickupRadius', 'moveSpeed'].includes(statName) ) {
                        this.currentStats[statName] *= (1 + value);
                    }
                }
                break;
            case 'damageTakenMultiplier':
                this.damageTakenMultiplier *= (1 + value);
                break;
            default:
                break;
        }
        if (statName === 'cooldown' && this.currentStats[statName] < 50) this.currentStats[statName] = 50;
        if (statName === 'projectiles' && this.currentStats[statName] < 1) this.currentStats[statName] = 1;
    }

    takeDamage(rawAmount) {
        if (!this.isAlive) return;
        const defenseReduction = this.currentStats.defense || 0;
        const damageAfterDefense = Math.max(0, rawAmount - defenseReduction);
        const finalDamage = Math.max(0, damageAfterDefense * this.damageTakenMultiplier);
        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        if (this.gameController.uiManager && this.gameController.uiManager.hud) this.gameController.uiManager.hud.update();
    }

    heal(amount) {
        if (!this.isAlive || amount <= 0) return;
        this.hp = Math.min(this.hp + amount, this.currentStats.maxHp);
        if (this.gameController.uiManager && this.gameController.uiManager.hud) this.gameController.uiManager.hud.update();
    }

    collectExperience(xpAmount) {
        if (!this.isAlive) return;
        this.experience += xpAmount;
        if (this.activeRelicEffects.onXPCollect) {
            this.activeRelicEffects.onXPCollect.forEach(effect => {
                if (effect.condition && effect.condition.type === 'counter') {
                    const counterId = effect.condition.counterId;
                    this.relicCounters[counterId] = (this.relicCounters[counterId] || 0) + 1;
                    if (this.relicCounters[counterId] >= effect.condition.threshold) {
                        if (effect.action === 'heal' && effect.details && typeof effect.details.amount === 'number') this.heal(effect.details.amount);
                        this.relicCounters[counterId] = 0;
                    }
                }
            });
        }
        if (this.experience >= this.experienceToNextLevel) this.levelUp();
        if (this.gameController.uiManager && this.gameController.uiManager.hud) this.gameController.uiManager.hud.update();
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = (window.LEVEL_CONFIG && window.LEVEL_CONFIG[this.level]?.xpNeeded) || Math.floor(this.experienceToNextLevel * 1.25);
        console.log(`[Player] 等级提升! 当前等级: ${this.level}.`);
        this.hp = this.currentStats.maxHp;
        if (this.activeRelicEffects.onLevelUp) {
            this.activeRelicEffects.onLevelUp.forEach(effect => {
                if (effect.chance === undefined || Math.random() < effect.chance) {
                    if (effect.action === 'randomStatBoost' && effect.details && effect.details.possibleStats) {
                        const count = effect.details.count || 1;
                        for (let i = 0; i < count; i++) {
                            const boostedStatDetail = effect.details.possibleStats[Math.floor(Math.random() * effect.details.possibleStats.length)];
                            this._applyPermanentBaseStatBoost(boostedStatDetail.stat, boostedStatDetail.value, boostedStatDetail.type, effect.sourceRelicName);
                        }
                    }
                }
            });
        }
        this.recalculateStats();
        this.gameController.pauseGame(window.GAME_STATE.LEVEL_UP);
    }

    _applyPermanentBaseStatBoost(statName, value, type, sourceRelicName) {
        const originalHeroStat = this.heroData.stats[statName];
        let changeAmount = 0;
        if (type === 'flat_add') changeAmount = value;
        else if (type === 'percentage_base' && typeof originalHeroStat === 'number') changeAmount = originalHeroStat * value;
        else { console.warn(`[Player._applyPermanentBaseStatBoost] 无效的提升类型或基础属性未找到: ${statName}`); return; }
        if (!this.baseStats.hasOwnProperty(statName)) this.baseStats[statName] = this.heroData.stats[statName] || 0;
        this.baseStats[statName] += changeAmount;
        console.log(`[圣物] "${sourceRelicName}" 触发: 基础 ${statName} 获得永久提升 ${changeAmount.toFixed(2)}! 新基础值: ${this.baseStats[statName].toFixed(2)}`);
    }

    handleEliteOrBossKill(enemy) {
        if (!this.isAlive) return;
        if (this.activeRelicEffects.onEliteOrBossKill) {
            this.activeRelicEffects.onEliteOrBossKill.forEach(effect => {
                if (effect.action === 'spawnLoot' && effect.details) this.gameController.lootManager.spawnSpecificLoot(enemy.x, enemy.y, effect.details);
            });
        }
    }

    die() {
        if (!this.isAlive) return;
        this.isAlive = false; this.hp = 0;
        console.log(`[Player] 英雄 "${this.heroData.name}" 已阵亡。`);
        this.gameController.gameOver();
    }

    update(deltaTime, inputState) {
        if (!this.isAlive) return;
        let moveX = 0, moveY = 0;
        if (inputState.left) moveX -= 1; if (inputState.right) moveX += 1;
        if (inputState.up) moveY -= 1; if (inputState.down) moveY += 1;
        if (moveX !== 0 || moveY !== 0) {
            const normalized = window.normalizeVector(moveX, moveY);
            this.x += normalized.x * this.currentStats.moveSpeed * deltaTime * 60;
            this.y += normalized.y * this.currentStats.moveSpeed * deltaTime * 60;
            this.directionX = normalized.x; this.directionY = normalized.y;
        }
        this.x = window.clamp(this.x, this.width / 2, window.GAME_WIDTH - this.width / 2);
        this.y = window.clamp(this.y, this.height / 2, window.GAME_HEIGHT - this.height / 2);
        const currentTime = performance.now();
        this.weapons.forEach(weapon => {
            weapon.update(deltaTime, this);
            if (weapon.canAttack(currentTime)) weapon.attack(currentTime, this);
        });
    }

    draw(ctx) {
        if (!this.isAlive) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.width / 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'red'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.fillText('💀', this.x, this.y + 6);
            return;
        }
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2); ctx.fill();
        const hpBarWidth = this.width * 1.2, hpBarHeight = 8, hpBarX = this.x - hpBarWidth / 2, hpBarY = this.y - this.height / 2 - hpBarHeight - 5;
        const hpPercentage = this.hp / this.currentStats.maxHp;
        ctx.fillStyle = '#555'; ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        ctx.fillStyle = hpPercentage > 0.6 ? 'green' : hpPercentage > 0.3 ? 'orange' : 'red';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercentage, hpBarHeight);
        ctx.strokeStyle = '#333'; ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    }
}

console.log('[PlayerCore] Player class defined.');
// 没有 'export' 关键字
