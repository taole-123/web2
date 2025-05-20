// js/core/enemy.js

/**
 * @file Defines the Enemy class.
 * Assumes ENEMIES_DATA and GAME_WIDTH, GAME_HEIGHT are globally available.
 */

class Enemy {
    constructor(enemyId, x, y, gameController) {
        this.id = `enemy_${Date.now()}_${Math.random().toString(36).substring(2,7)}`; // 唯一ID
        this.enemyId = enemyId; // 类型ID，对应 ENEMIES_DATA
        this.gameController = gameController;

        const enemyBaseData = ENEMIES_DATA[enemyId];
        if (!enemyBaseData) {
            console.error(`[Enemy] 未找到ID为 "${enemyId}" 的敌人数据!`);
            this.isAlive = false; // 标记为无效，将在下次清理时移除
            return;
        }

        this.baseData = enemyBaseData;
        this.name = enemyBaseData.name;
        this.stats = { ...enemyBaseData.stats }; // 当前属性，可能会被buff/debuff影响
        this.behavior = enemyBaseData.behavior;
        this.lootTable = enemyBaseData.lootTable || {};
        this.isBoss = enemyBaseData.isBoss || false;
        this.isElite = enemyBaseData.isElite || false; // 可以添加精英怪标记

        this.x = x;
        this.y = y;
        this.width = enemyBaseData.width || TILE_SIZE * 0.9;
        this.height = enemyBaseData.height || TILE_SIZE * 0.9;
        this.color = enemyBaseData.color || 'red';

        this.hp = this.stats.maxHp;
        this.isAlive = true;
        this.lastAttackTime = 0; // 用于远程攻击冷却
    }

    takeDamage(amount) {
        if (!this.isAlive) return;

        const damageTaken = Math.max(1, amount - (this.stats.defense || 0)); // 至少受到1点伤害
        this.hp -= damageTaken;
        // console.log(`[Enemy] "${this.name}" 受到 ${damageTaken} 点伤害. 剩余HP: ${this.hp}`);

        // TODO: 显示伤害数字效果

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (!this.isAlive) return; // 防止重复调用
        this.isAlive = false;
        this.hp = 0;
        // console.log(`[Enemy] "${this.name}" 已被击败.`);
        this.gameController.onEnemyKilled(this); // 通知 GameController
    }

    update(deltaTime, player) {
        if (!this.isAlive || !player || !player.isAlive) return;

        // 根据行为模式更新
        switch (this.behavior) {
            case 'chase_player':
                this.chasePlayer(deltaTime, player);
                break;
            case 'ranged_attack_stationary':
                this.rangedAttackStationary(deltaTime, player);
                break;
            case 'ranged_attack_and_kite':
                this.rangedAttackAndKite(deltaTime, player);
                break;
            // TODO: 实现 'boss_lich_king_pattern' 等复杂行为
            default:
                // 默认行为：简单追击
                this.chasePlayer(deltaTime, player);
        }
    }

    chasePlayer(deltaTime, player) {
        const direction = normalizeVector(player.x - this.x, player.y - this.y);
        this.x += direction.x * this.stats.moveSpeed * deltaTime * 60;
        this.y += direction.y * this.stats.moveSpeed * deltaTime * 60;
    }

    rangedAttackStationary(deltaTime, player) {
        const distanceToPlayer = distanceBetweenPoints(this.x, this.y, player.x, player.y);
        if (distanceToPlayer <= this.stats.attackRange) {
            this.attemptRangedAttack(player);
        } else {
            // 可选：如果玩家超出射程，缓慢向玩家移动
            this.chasePlayer(deltaTime * 0.5, player); // 以一半速度追击
        }
    }

    rangedAttackAndKite(deltaTime, player) {
        const distanceToPlayer = distanceBetweenPoints(this.x, this.y, player.x, player.y);
        const idealRange = this.stats.attackRange * 0.8; // 尝试保持在理想射程

        if (distanceToPlayer <= this.stats.attackRange) {
            this.attemptRangedAttack(player);
            // 如果玩家太近，尝试后退 (风筝)
            if (distanceToPlayer < idealRange / 2) {
                const direction = normalizeVector(this.x - player.x, this.y - player.y); // 远离玩家
                this.x += direction.x * this.stats.moveSpeed * deltaTime * 30; // 风筝时速度减半
                this.y += direction.y * this.stats.moveSpeed * deltaTime * 30;
            }
        } else {
            // 追击玩家进入射程
            this.chasePlayer(deltaTime, player);
        }
    }
    
    attemptRangedAttack(player) {
        const currentTime = performance.now();
        if (currentTime - this.lastAttackTime >= (this.stats.attackCooldown || 2000)) {
            this.lastAttackTime = currentTime;
            // console.log(`[Enemy] "${this.name}" 发动远程攻击!`);
            if (typeof Projectile === 'function' && this.stats.projectileId) {
                 // 假设弹射物数据也定义在某个地方，或直接使用固定参数
                const projectileData = WEAPONS_DATA[this.stats.projectileId] || { damage: this.stats.attackDamage, speed: 5, duration: 1500, asset: 'enemy_default_proj' };
                
                const dirX = player.x - this.x;
                const dirY = player.y - this.y;
                const norm = normalizeVector(dirX, dirY);

                const proj = new Projectile(
                    this.x, this.y,
                    norm.x * (projectileData.speed || 5),
                    norm.y * (projectileData.speed || 5),
                    projectileData.damage || this.stats.attackDamage,
                    projectileData.duration || 1500,
                    0, // 敌人弹射物通常不穿透
                    projectileData.assetId || 'enemy_default_projectile',
                    this.id // 标记为敌人弹射物，避免伤害其他敌人
                );
                this.gameController.addProjectile(proj);
            }
        }
    }


    draw(ctx) {
        if (!this.isAlive) return;

        ctx.fillStyle = this.color;
        // ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();


        // 绘制简易血条
        if (this.hp < this.stats.maxHp) {
            const hpBarWidth = this.width * 0.8;
            const hpBarHeight = 5;
            const hpBarX = this.x - hpBarWidth / 2;
            const hpBarY = this.y - this.height / 2 - hpBarHeight - 3;
            const hpPercentage = this.hp / this.stats.maxHp;

            ctx.fillStyle = '#500';
            ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            ctx.fillStyle = 'red';
            ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercentage, hpBarHeight);
        }
    }
}

console.log('[EnemyCore] Enemy class defined.');
