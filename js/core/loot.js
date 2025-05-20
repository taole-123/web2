// js/core/loot.js

/**
 * @file Defines Loot base class, specific loot types (e.g., ExperienceOrb), and LootManager.
 * Assumes GAME_WIDTH, GAME_HEIGHT are globally available.
 */

// 基类 Loot (可选)
class Loot {
    constructor(x, y, type, gameController) {
        this.id = `loot_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
        this.x = x;
        this.y = y;
        this.type = type; // 'experienceOrb', 'healthPotion', 'goldCoin', 'relicPart'
        this.gameController = gameController;
        this.width = TILE_SIZE * 0.5;
        this.height = TILE_SIZE * 0.5;
        this.isActive = true;
        this.pickupRadius = TILE_SIZE * 0.75; // 自身被拾取的半径
        this.magnetRadius = TILE_SIZE * 2.5; // 开始被玩家吸引的半径
        this.magnetSpeed = 4; // 被吸引时的速度
    }

    update(deltaTime, player) {
        if (!this.isActive) return;

        // 磁铁效果：如果玩家在 magnetRadius 内，则向玩家移动
        if (player && player.isAlive) {
            const dist = distanceBetweenPoints(this.x, this.y, player.x, player.y);
            if (dist < (player.currentStats.pickupRadius || this.magnetRadius)) { // 使用玩家的拾取范围
                const direction = normalizeVector(player.x - this.x, player.y - this.y);
                this.x += direction.x * this.magnetSpeed * deltaTime * 60; // 假设速度基于60FPS
                this.y += direction.y * this.magnetSpeed * deltaTime * 60;
            }
        }
    }

    // 碰撞检测由 GameController 处理，如果碰撞则调用 collect
    collect(player) {
        if (!this.isActive) return false;
        // console.log(`[Loot] "${this.type}" at (${this.x.toFixed(0)},${this.y.toFixed(0)}) collected by player.`);
        this.isActive = false; // 标记为不再活动，将在下一帧被移除
        this.onCollected(player); // 执行特定掉落物的收集效果
        return true;
    }

    onCollected(player) {
        // 子类应重写此方法
        console.warn(`[Loot] onCollected method not implemented for type: ${this.type}`);
    }

    draw(ctx) {
        if (!this.isActive) return;
        // 子类应重写此方法以绘制自己
        ctx.fillStyle = 'gray'; // Default loot color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}


class ExperienceOrb extends Loot {
    constructor(x, y, xpValue, gameController) {
        super(x, y, 'experienceOrb', gameController);
        this.xpValue = xpValue;
        this.color = this.getColorForXP(xpValue);
        this.width = this.getSizeForXP(xpValue);
        this.height = this.width;
    }

    getColorForXP(xp) {
        if (xp >= 100) return 'gold';
        if (xp >= 50) return 'cyan';
        if (xp >= 20) return 'blue';
        return 'lightblue';
    }
    
    getSizeForXP(xp) {
        if (xp >= 100) return TILE_SIZE * 0.6;
        if (xp >= 50) return TILE_SIZE * 0.5;
        if (xp >= 20) return TILE_SIZE * 0.4;
        return TILE_SIZE * 0.3;
    }


    onCollected(player) {
        player.collectExperience(this.xpValue);
        // console.log(`[ExperienceOrb] Player collected ${this.xpValue} XP.`);
    }

    draw(ctx) {
        if (!this.isActive) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Pulsating effect for larger orbs
        const pulseFactor = (this.xpValue > 20) ? (1 + Math.sin(performance.now() / (200 + Math.random()*100)) * 0.1) : 1;
        ctx.arc(this.x, this.y, (this.width / 2) * pulseFactor, 0, Math.PI * 2);
        ctx.fill();
        
        // Optional: add a white highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x - this.width*0.1, this.y - this.height*0.1, this.width / 5, 0, Math.PI*2);
        ctx.fill();
    }
}

// 其他掉落物类型可以类似定义
class HealthPotion extends Loot {
    constructor(x, y, healAmount, gameController) {
        super(x, y, 'healthPotion', gameController);
        this.healAmount = healAmount;
        this.color = 'red';
        this.width = TILE_SIZE * 0.4;
        this.height = TILE_SIZE * 0.6; // 药瓶形状
    }

    onCollected(player) {
        player.heal(this.healAmount);
        console.log(`[HealthPotion] Player healed for ${this.healAmount}.`);
    }

    draw(ctx) {
        if (!this.isActive) return;
        // 绘制一个简单的药瓶形状
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fillStyle = 'darkred';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height * 0.3); // 瓶盖
    }
}


// LootManager 类定义
class LootManager {
    constructor(gameController) {
        this.gameController = gameController;
        // console.log("[LootManager] Initialized.");
    }

    /**
     * 根据敌人的掉落表请求掉落物
     * @param {number} x - 掉落位置X
     * @param {number} y - 掉落位置Y
     * @param {object} lootTable - 敌人的掉落表 { itemId: chance, ... }
     */
    requestLootDrop(x, y, lootTable) {
        if (!lootTable) return;

        for (const itemId in lootTable) {
            if (Math.random() < lootTable[itemId]) {
                // console.log(`[LootManager] Attempting to spawn loot: ${itemId}`);
                this.spawnLootItem(x, y, itemId);
            }
        }
    }

    /**
     * 生成特定类型的掉落物
     * @param {number} x
     * @param {number} y
     * @param {string} itemId - 掉落物ID或类型
     * @param {object} details - 额外的掉落物详情 (例如圣物效果指定的xpAmount)
     */
    spawnLootItem(x, y, itemId, details = {}) {
        let lootInstance = null;
        // 为掉落物添加轻微的随机散布
        const offsetX = (Math.random() - 0.5) * TILE_SIZE * 0.5;
        const offsetY = (Math.random() - 0.5) * TILE_SIZE * 0.5;
        const spawnX = x + offsetX;
        const spawnY = y + offsetY;

        switch (itemId) {
            case 'experienceOrb': // 通常由圣物等直接指定类型和值
                lootInstance = new ExperienceOrb(spawnX, spawnY, details.xpAmount || 10, this.gameController);
                break;
            case 'xp_orb_small':
                lootInstance = new ExperienceOrb(spawnX, spawnY, 5, this.gameController);
                break;
            case 'xp_orb_medium':
                lootInstance = new ExperienceOrb(spawnX, spawnY, 20, this.gameController);
                break;
            case 'xp_orb_large':
                lootInstance = new ExperienceOrb(spawnX, spawnY, 50, this.gameController);
                break;
            case 'health_potion_small':
                lootInstance = new HealthPotion(spawnX, spawnY, 20, this.gameController); // 回复20点HP
                break;
            // ... 更多掉落物类型
            default:
                console.warn(`[LootManager] 未知的掉落物ID: ${itemId}`);
                return;
        }

        if (lootInstance) {
            this.gameController.addLoot(lootInstance);
            // console.log(`[LootManager] Spawned ${itemId} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
        }
    }
    
    // 用于圣物等直接指定掉落经验球的情况
    spawnExperienceOrb(x, y, xpValue) {
        const orb = new ExperienceOrb(x, y, xpValue, this.gameController);
        this.gameController.addLoot(orb);
    }

    // 用于圣物等直接指定掉落特定物品的情况
    spawnSpecificLoot(x, y, lootDetails) {
        if (lootDetails && lootDetails.lootType) {
            this.spawnLootItem(x, y, lootDetails.lootType, lootDetails);
        } else {
            console.warn("[LootManager] spawnSpecificLoot called with invalid lootDetails:", lootDetails);
        }
    }
}

console.log('[LootCore] Loot, ExperienceOrb, HealthPotion, and LootManager classes defined.');
// 没有 'export' 关键字
