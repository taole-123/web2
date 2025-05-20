// js/core/weapon.js

/**
 * @file Defines the base Weapon class and Projectile class.
 * Assumes WEAPONS_DATA, GAME_WIDTH, GAME_HEIGHT, normalizeVector are globally available.
 */

class Weapon {
    constructor(playerId, weaponId, gameController) {
        this.playerId = playerId;
        this.weaponId = weaponId;
        this.gameController = gameController;

        const weaponBaseData = WEAPONS_DATA[weaponId];
        if (!weaponBaseData) {
            console.error(`[Weapon] 未找到ID为 "${weaponId}" 的武器数据!`);
            this.isValid = false;
            return;
        }
        this.isValid = true;
        this.baseData = weaponBaseData;
        this.name = weaponBaseData.name;
        this.type = weaponBaseData.type;
        this.level = 0;
        this.currentStats = {};
        this.lastAttackTime = 0;

        this.addLevel(); // 武器获取时至少1级
    }

    addLevel() {
        if (!this.isValid) return;
        if (this.level < this.baseData.maxLevel) {
            this.level++;
            const levelStatData = this.baseData.levelStats.find(stat => stat.level === this.level);
            if (levelStatData) {
                this.currentStats = { ...levelStatData };
                // console.log(`[Weapon] "${this.name}" 提升到等级 ${this.level}.`);
            } else {
                console.warn(`[Weapon] "${this.name}" 找不到等级 ${this.level} 的属性数据。`);
                this.level--; // 回退
            }
        } else {
            // console.log(`[Weapon] "${this.name}" 已达到最高等级 ${this.baseData.maxLevel}。`);
        }
    }

    canAttack(currentTime) {
        if (!this.isValid || !this.currentStats.cooldown) return false;
        return currentTime - this.lastAttackTime >= this.currentStats.cooldown;
    }

    attack(currentTime, player) {
        if (!this.isValid || !this.canAttack(currentTime)) return;
        this.lastAttackTime = currentTime;

        switch (this.type) {
            case 'ranged':
                this.performRangedAttack(player);
                break;
            case 'melee_swing':
                this.performMeleeSwing(player);
                break;
            default:
                console.warn(`[Weapon] 未知的武器类型: ${this.type}`);
        }
    }

    performRangedAttack(player) {
        const stats = this.currentStats;
        const numProjectiles = stats.projectiles || 1;
        const projectileSpeed = stats.projectileSpeed || 5;
        const damage = stats.damage || 10;
        const duration = stats.duration || 1000;
        const pierce = stats.pierce || 0;
        const projectileAsset = this.baseData.projectileAsset || 'default_projectile';

        let targetX = player.x + (player.directionX || 0) * 100;
        let targetY = player.y + (player.directionY !== 0 ? player.directionY : 1) * 100; // 确保 directionY 非0

        const baseAngle = Math.atan2(targetY - player.y, targetX - player.x);
        const spreadAngleIncrement = numProjectiles > 1 ? (Math.PI / 12) / (numProjectiles -1) : 0; // 总共30度扇形

        for (let i = 0; i < numProjectiles; i++) {
            let currentAngle = baseAngle;
            if (numProjectiles > 1) {
                 // 从 -(totalSpread / 2) 到 +(totalSpread / 2)
                const totalSpread = Math.PI / 12; // 例如总共30度
                currentAngle += (i * (totalSpread / (numProjectiles -1 ))) - (totalSpread / 2) ;
            }


            const velX = Math.cos(currentAngle) * projectileSpeed;
            const velY = Math.sin(currentAngle) * projectileSpeed;

            if (typeof Projectile === 'function') {
                const projectile = new Projectile(
                    player.x, player.y, velX, velY, damage, duration, pierce,
                    projectileAsset, player.id, this.gameController
                );
                this.gameController.addProjectile(projectile);
            } else {
                console.warn("[Weapon] Projectile class not found.");
            }
        }
    }

    performMeleeSwing(player) {
        const stats = this.currentStats;
        const damage = stats.damage || 15;
        const areaMultiplier = stats.area || 1.0;
        const duration = stats.duration || 300;
        const knockback = stats.knockback || 0;

        // 假设玩家有一个朝向 (directionX, directionY)
        // 攻击框中心点相对于玩家的偏移
        const offsetX = (player.directionX || 0) * (TILE_SIZE * 0.6 * areaMultiplier);
        const offsetY = (player.directionY !== 0 ? player.directionY : 1) * (TILE_SIZE * 0.6 * areaMultiplier);


        const attackHitbox = {
            x: player.x + offsetX,
            y: player.y + offsetY,
            width: TILE_SIZE * 1.2 * areaMultiplier, // 示例攻击框大小
            height: TILE_SIZE * 0.8 * areaMultiplier,
            damage: damage,
            knockback: knockback,
            duration: duration,
            startTime: performance.now(),
            ownerId: player.id,
            type: 'melee_hit',
            hitEnemies: new Set() // 用于确保一次挥砍只对一个敌人造成一次伤害
        };
        this.gameController.addTemporaryHitbox(attackHitbox);
    }

    update(deltaTime, player) { /* 可选的每帧更新 */ }
    draw(ctx, player) { /* 可选的独立绘制 */ }
}

class Projectile {
    constructor(x, y, velX, velY, damage, duration, pierce, assetId, ownerId, gameController) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.damage = damage;
        this.duration = duration;
        this.pierce = pierce;
        this.assetId = assetId;
        this.ownerId = ownerId;
        this.gameController = gameController; // 用于可能的复杂逻辑或特效触发

        this.width = 10;
        this.height = 10;
        this.birthTime = performance.now();
        this.isActive = true;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        if (!this.isActive) return;

        this.x += this.velX * deltaTime * 60; // 假设速度基于60FPS
        this.y += this.velY * deltaTime * 60;

        if (performance.now() - this.birthTime > this.duration) {
            this.isActive = false;
        }
        if (this.x < -this.width || this.x > GAME_WIDTH + this.width ||
            this.y < -this.height || this.y > GAME_HEIGHT + this.height) {
            this.isActive = false;
        }
    }

    onHit(enemy) {
        if (this.pierce > 0) {
            this.pierce--;
            this.hitEnemies.add(enemy.id);
        } else {
            this.isActive = false;
        }
    }

    draw(ctx) {
        if (!this.isActive) return;
        ctx.fillStyle = (this.ownerId.startsWith('player_')) ? 'yellow' : '#ff6666'; // 玩家黄色，敌人红色
        if (this.assetId === 'arrow_basic') {
            ctx.beginPath();
            ctx.moveTo(this.x - this.velX * 0.2, this.y - this.velY * 0.2); // 箭尾
            ctx.lineTo(this.x + this.velX * 0.1, this.y + this.velY * 0.1); // 箭头
            ctx.lineWidth = 3;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
            ctx.lineWidth = 1; // Reset
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

console.log('[WeaponCore] Weapon and Projectile classes defined.');
// 确保没有 'export' 关键字
