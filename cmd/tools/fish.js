import "../../settings/config.js";
import fs from "fs-extra";

let handler = async (m, { conn, runtime, pushName, prefix }) => {
    const user = global.db.users[m.sender];
    
    function loadJSON(file) {
        try {
            return JSON.parse(fs.readFileSync(file));
        } catch {
            return {};
        }
    }
    
    const usersFish = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    const userFishData = usersFish[m.sender] || { 
        money: 0, 
        fishCaught: 0, 
        level: 1, 
        exp: 0,
        rareRate: 1.0,
        equipment: "pancing_biasa"
    };
    
    const userInventory = inventory[m.sender] || [];
    const totalFishValue = userInventory.reduce((sum, ikan) => sum + ikan.harga, 0);
    
    // Progress bar untuk EXP
    function createProgressBar(exp, maxExp = 100) {
        const percentage = (exp / maxExp) * 100;
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
    }
    
    // Hitung rare fish
    const rareFish = userInventory.filter(ikan => ikan.rarity === 'rare').length;
    const legendaryFish = userInventory.filter(ikan => ikan.rarity === 'legendary').length;
    
    const text = `*🎣 FISHING MASTER MENU 🎣*
*Halo ${pushName}!*

*📊 STATISTIK MANCING:*
▢ 🎯 Level: ${userFishData.level}
▢ ⭐ EXP: ${createProgressBar(userFishData.exp)}
▢ 💰 Uang: Rp${userFishData.money.toLocaleString()}
▢ 🎣 Total Tangkapan: ${userFishData.fishCaught}
▢ 📦 Inventory: ${userInventory.length} ikan
▢ 💎 Value: Rp${totalFishValue.toLocaleString()}
▢ 🔮 Rare Rate: ${userFishData.rareRate}x
▢ ⚔️ Equipment: ${userFishData.equipment}

*🎮 FISHING COMMANDS:*
┌─「 🎣 BASIC 」
│ ▢ ${prefix}mancing - Mulai memancing
│ ▢ ${prefix}fishlist - Daftar semua ikan  
│ ▢ ${prefix}tasikan - Inventory ikan
│ ▢ ${prefix}jualikan - Jual semua ikan
│ ▢ ${prefix}jual <ikan> - Jual ikan tertentu
└─

┌─「 📊 INFO 」
│ ▢ ${prefix}fishinfo <ikan> - Detail ikan
│ ▢ ${prefix}fishtop - Leaderboard
│ ▢ ${prefix}fishstats - Statistik detail
│ ▢ ${prefix}fishdex - Pokédex ikan
└─

┌─「 ⚙️ ADVANCED 」
│ ▢ ${prefix}fishupgrade - Upgrade equipment
│ ▢ ${prefix}fishshop - Beli item
│ ▢ ${prefix}fishtask - Misi harian
│ ▢ ${prefix}fishbattle - Battle ikan
│ ▢ ${prefix}fishgift - Kirim ikan
└─

*🔧 BOT INFO:*
▢ ⏱️ Runtime: ${runtime(process.uptime())}
▢ 👑 Role: ${user.role}
▢ 🎫 Limit: ${user.limit === Infinity ? '∞' : user.limit}
▢ 📊 Total Command: ${user.command}
`;

    const footer = `${global.footer}`;
    const image1 = `https://files.catbox.moe/jlkib4.png`;
    const image2 = `https://files.catbox.moe/jlkib4.png`;
    const btnklick = "🎣 Fishing System";

    const buttonData = [
        {
            title: `🎣 Start Fishing`,
            description: "Mulai adventure memancing!",
            id: `${prefix}mancing`
        },
        {
            title: `📊 My Stats`,
            description: "Lihat statistik lengkap",
            id: `${prefix}fishstats`
        },
        {
            title: `🏆 Leaderboard`,
            description: "Peringkat pemain terbaik", 
            id: `${prefix}fishtop`
        }
    ];
    
    await conn.sendButton(m.chat, text, footer, btnklick, image1, image2, buttonData, m);
};

handler.help = ['fishmenu', 'fishingmenu', 'menufish'];
handler.tags = ['fishing', 'main'];
handler.command = ["fishmenu", "fishingmenu", "menufish", "fm"];
handler.limit = 1;

export default handler;
