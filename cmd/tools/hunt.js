import "../../settings/config.js";
import fs from "fs-extra";

let handler = async (m, { conn, runtime, pushName, prefix }) => {
    const user = global.db.users[m.sender];
    
    function loadJSON(file) {
        try {
            return fs.readJsonSync(file);
        } catch {
            return {};
        }
    }
    
    const usersData = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    
    const userHuntData = usersData[m.sender] || { 
        money: 0, 
        animalsCaught: 0, 
        level: 1, 
        exp: 0,
        energy: 100
    };
    
    const userInventory = inventory[m.sender] || { animals: [] };
    const animalInventory = userInventory.animals || [];
    
    // Hitung total nilai hewan
    const totalAnimalValue = animalInventory.reduce((sum, animal) => sum + animal.value, 0);
    
    // Progress bar untuk EXP
    function createProgressBar(exp, maxExp = 100) {
        const percentage = (exp / maxExp) * 100;
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
    }
    
    const text = `*🎯 HUNTING MASTER MENU 🎯*
*Hello ${pushName}!*

*📊 HUNTING STATS:*
▢ 🎯 Level: ${userHuntData.level}
▢ ⭐ EXP: ${createProgressBar(userHuntData.exp)}
▢ 💰 Hunt Value: Rp${totalAnimalValue.toLocaleString()}
▢ 🐾 Animals Caught: ${userHuntData.animalsCaught}
▢ 📦 Inventory: ${animalInventory.length} animals
▢ ⚡ Energy: ${userHuntData.energy || 100}/100

*🎯 HUNTING COMMANDS:*
┌─「 🎯 BASIC 」
│ ▢ ${prefix}hunt <spot> - Start hunting
│ ▢ ${prefix}huntlist - List hunting spots
│ ▢ ${prefix}myhunt - My hunting stats
│ ▢ ${prefix}sellanimals - Sell all animals
│ ▢ ${prefix}sell <animal> - Sell specific
└─

┌─「 📊 INFO 」
│ ▢ ${prefix}huntinfo <animal> - Animal details
│ ▢ ${prefix}hunttop - Leaderboard
│ ▢ ${prefix}huntstats - Detailed stats
│ ▢ ${prefix}animalinfo - Animal information
└─

┌─「 ⚙️ ADVANCED 」
│ ▢ ${prefix}track - Track animals
│ ▢ ${prefix}setsnare - Set animal trap
│ ▢ ${prefix}checktrap - Check traps
│ ▢ ${prefix}upgradeskill - Improve hunting
└─

*🔧 BOT INFO:*
▢ ⏱️ Runtime: ${runtime(process.uptime())}
▢ 👑 Role: ${user.role}
▢ 🎫 Limit: ${user.limit === Infinity ? '∞' : user.limit}
▢ 📊 Total Commands: ${user.command}
`;

    const footer = `${global.footer}`;
    const image1 = `https://files.catbox.moe/kj8x7w.png`;
    const image2 = `https://files.catbox.moe/kj8x7w.png`;
    const btnklick = "🎯 Hunting System";

    const buttonData = [
        {
            title: `🎯 Start Hunting`,
            description: "Begin your hunting adventure!",
            id: `${prefix}huntlist`
        },
        {
            title: `📊 Hunt Stats`,
            description: "View hunting statistics",
            id: `${prefix}huntstats`
        },
        {
            title: `🏆 Leaderboard`,
            description: "Top hunter rankings", 
            id: `${prefix}hunttop`
        }
    ];
    
    await conn.sendButton(m.chat, text, footer, btnklick, image1, image2, buttonData, m);
};

handler.help = ['huntmenu', 'huntingmenu', 'menuhunt'];
handler.tags = ['hunting', 'main'];
handler.command = ["huntmenu", "huntingmenu", "menuhunt", "hm"];
handler.limit = 1;

export default handler;
