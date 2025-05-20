// js/core/combat.js

// 本文件规划用于存放更复杂的、全局性的战斗相关计算逻辑、
// 伤害类型系统、元素克制关系、状态效果（如中毒、燃烧、冰冻等）的详细处理机制，
// 以及可能的暴击、格挡、闪避等战斗判定。

// 在当前版本中：
// - 基础的碰撞检测由 helpers.js 中的 checkCollision() 函数提供。
// - 伤害的初步计算和应用分散在 Weapon.js (及其 Projectile/SummonedTendril 子类) 和 Enemy.js 的 takeDamage() 方法中。
// - Player.js 中的 getDamageMultiplier() 处理了卡珊德拉的双倍伤害被动。
// - Enemy.js 中的 applySlow() 处理了减速状态。

/**
 * GDD中规划的详细伤害计算公式 (未来扩展方向):
 * 最终伤害 = (
 * (武器基础伤害 * (1 + 武器等级加成) + 附加固定伤害)  // 1. 武器自身伤害
 * * (1 + 玩家全局百分比伤害加成总和)                  // 2. 玩家全局Buff (如来自被动、圣物)
 * * (1 + 暴击伤害倍率若暴击)                          // 3. 暴击修正
 * * (1 + 对特定标签敌人增伤)                          // 4. 对特定类型敌人增伤 (如对亡灵+20%)
 * * (1 + 易伤效果)                                  // 5. 敌人受到的易伤效果
 * )
 * * (1 - 敌人对应伤害类型抗性)                        // 6. 敌人元素/物理抗性减免
 * * (1 - 敌人固定减伤)                                // 7. 敌人固定数值减伤
 * * (1 - 敌人百分比减伤)                              // 8. 敌人百分比减伤
 *
 * - 伤害上限/下限: 可能需要对某些伤害来源（如百分比生命伤害）设置上限。
 * - 最小伤害保证: 即使经过各种减免，也可能需要保证至少1点伤害。
 */

// 伤害类型枚举 (未来扩展)
const DAMAGE_TYPES = {
    PHYSICAL_MELEE: 'PHYSICAL_MELEE',       // 物理近战
    PHYSICAL_RANGED: 'PHYSICAL_RANGED',     // 物理远程
    FIRE: 'FIRE',                         // 火焰
    ICE: 'ICE',                           // 冰霜
    LIGHTNING: 'LIGHTNING',               // 闪电
    HOLY: 'HOLY',                         // 神圣
    DARK: 'DARK',                         // 暗影/虚空
    POISON: 'POISON',                     // 毒素 (通常是持续伤害)
    TRUE_DAMAGE: 'TRUE_DAMAGE'            // 真实伤害 (无视大部分抗性和减伤)
    // ... 更多自定义类型
};

// 状态效果枚举与管理 (未来扩展)
const STATUS_EFFECTS = {
    SLOW: 'SLOW',
    STUN: 'STUN',
    BURN: 'BURN',           // 持续火焰伤害
    FREEZE: 'FREEZE',         // 无法行动
    POISONED: 'POISONED',     // 持续毒素伤害
    BLEED: 'BLEED',           // 持续物理伤害
    CURSED: 'CURSED',         // 受到伤害增加或其他负面效果
    VULNERABLE: 'VULNERABLE', // 受到的所有伤害增加
    // ...
};

/**
 * (未来) 应用一个状态效果到目标单位 (玩家或敌人)
 * @param {object} target - 目标对象 (Player 或 Enemy 实例)
 * @param {string} effectType - 状态效果类型 (来自 STATUS_EFFECTS)
 * @param {number} duration - 效果持续时间 (毫秒)
 * @param {number} magnitude - 效果强度 (例如，减速的百分比，持续伤害的每秒伤害值)
 * @param {object} [source=null] - 效果来源 (例如，造成此效果的武器或技能)
 */
function applyStatusEffect(target, effectType, duration, magnitude, source = null) {
    if (!target || !target.activeStatusEffects) {
        // console.warn("目标无效或没有activeStatusEffects属性，无法应用状态效果。");
        return;
    }

    // 示例：处理减速 (目前 Enemy.applySlow 是直接方法调用)
    if (effectType === STATUS_EFFECTS.SLOW && typeof target.applySlow === 'function') {
        target.applySlow(magnitude, duration); // magnitude 是减速百分比 (0.0 to 1.0)
        return;
    }

    // 通用状态效果处理逻辑 (未来可以更复杂)
    // target.activeStatusEffects[effectType] = {
    //     isActive: true,
    //     durationTimer: duration,
    //     magnitude: magnitude,
    //     source: source,
    //     startTime: Date.now() // 记录开始时间，用于某些效果的计算
    // };
    // console.log(`${target.name} 获得了状态效果: ${effectType} (强度: ${magnitude}, 持续: ${duration}ms)`);

    // 需要在目标对象的 update 方法中添加对 activeStatusEffects 的处理逻辑，
    // 例如计时、应用持续伤害、移除过期效果等。
}


/**
 * (未来) 计算暴击
 * @param {Player} attacker - 攻击者 (通常是玩家)
 * @param {object} weaponStats - 当前使用的武器属性 (可能包含暴击率、暴击伤害加成)
 * @returns {{isCritical: boolean, critMultiplier: number}}
 */
function calculateCriticalHit(attacker, weaponStats) {
    let isCritical = false;
    let critMultiplier = 1.0; // 默认为1 (非暴击)

    // const baseCritChance = (attacker.stats.critChance || 0) + (weaponStats.critChanceBonus || 0);
    // if (Math.random() < baseCritChance) {
    //     isCritical = true;
    //     critMultiplier = (attacker.stats.critDamageMultiplier || 1.5) + (weaponStats.critDamageBonus || 0); // 基础暴击伤害150%
    // }
    return { isCritical, critMultiplier };
}


// 目前此文件主要作为结构占位和未来功能的规划。
// 实际的战斗交互更多地发生在各个实体类中。
// console.log("Combat module loaded (currently a placeholder for advanced combat logic).");
