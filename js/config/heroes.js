// js/config/heroes.js

/**
 * @file Defines all hero data for the game.
 * HEROES_DATA will be a global variable.
 */

const HEROES_DATA = {
    KASSANDRA: {
        id: "KASSANDRA",
        name: "卡珊德拉",
        description: "敏捷的游侠，来自古老的森林，箭无虚发，能感知自然的低语。",
        icon: "🧝‍♀️",
        modelPath: "assets/models/heroes/kassandra.png", // 示例路径
        stats: {
            maxHp: 90,
            moveSpeed: 3.0,
            attackDamage: 12,
            defense: 2,
            luck: 10,
            critChance: 0.05,
            pickupRadius: 150,
        },
        initialWeapon: "short_bow",
        initialSkills: [],
        color: "rgba(144, 238, 144, 0.8)"
    },
    ARTHUR: {
        id: "ARTHUR",
        name: "亚瑟",
        description: "身经百战的骑士，手持圣剑，守护着最后的防线。",
        icon: "騎士", // 示例 Emoji
        modelPath: "assets/models/heroes/arthur.png", // 示例路径
        stats: {
            maxHp: 120,
            moveSpeed: 2.6,
            attackDamage: 15,
            defense: 5,
            luck: 5,
            critChance: 0.03,
            pickupRadius: 120,
        },
        initialWeapon: "broadsword",
        initialSkills: ["toughness_rank1"], // 假设有此技能
        color: "rgba(173, 216, 230, 0.8)"
    }
};

console.log('[HeroesConfig] HEROES_DATA defined.');
// 确保没有 'export' 关键字
