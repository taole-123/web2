// js/config/relics.js

/**
 * @file Defines all relics available in the game.
 * RELICS and getRelicById will be global.
 */

const RELICS = [
    {
        id: 'imperial_seal_fragment',
        name: '传国玉玺碎片',
        description: '天命所归：玩家升级时，有15%几率额外获得一次随机属性提升。',
        icon: '👑',
        rarity: 'epic',
        theme: '大唐秘宝',
        effects: [
            {
                trigger: 'onLevelUp',
                chance: 0.15,
                action: 'randomStatBoost',
                details: {
                    possibleStats: [
                        { stat: 'maxHp', value: 0.05, type: 'percentage_base' },
                        { stat: 'attackDamage', value: 0.03, type: 'percentage_base' },
                        { stat: 'moveSpeed', value: 0.02, type: 'percentage_base' }
                    ],
                    count: 1
                }
            }
        ]
    },
    {
        id: 'taiping_jing_fragment',
        name: '太平要术残页',
        description: '道法自然：每拾取8个经验魂晶，回复1点生命值。',
        icon: '📜',
        rarity: 'rare',
        theme: '大唐秘宝',
        effects: [
            {
                trigger: 'onXPCollect',
                condition: { type: 'counter', threshold: 8, counterId: 'taipingXPCount' },
                action: 'heal',
                details: { amount: 1 }
            }
        ]
    },
    {
        id: 'buliangren_secret_order',
        name: '不良人秘令',
        description: '影疾：提升10%移动速度，但受到的伤害增加8%。',
        icon: '㊙️',
        rarity: 'rare',
        theme: '大唐秘宝',
        effects: [
            {
                trigger: 'passive',
                action: 'modifyStat',
                details: { stat: 'moveSpeed', value: 0.10, type: 'percentage_add' }
            },
            {
                trigger: 'passive',
                action: 'modifyStat',
                details: { stat: 'damageTakenMultiplier', value: 0.08, type: 'percentage_add' }
            }
        ]
    },
    {
        id: 'shangyuan_brocade_pouch',
        name: '上元锦绣囊',
        description: '瑞气东来：击败精英敌人或首领后，额外掉落一颗小型经验魂晶(15经验)。',
        icon: '🛍️',
        rarity: 'rare',
        theme: '大唐秘宝',
        effects: [
            {
                trigger: 'onEliteOrBossKill',
                action: 'spawnLoot',
                details: { lootType: 'experienceOrb', xpAmount: 15 }
            }
        ]
    }
];

function getRelicById(id) {
    return RELICS.find(relic => relic.id === id);
}

console.log('[RelicsConfig] RELICS and getRelicById defined.');
// 确保没有 'export' 关键字
