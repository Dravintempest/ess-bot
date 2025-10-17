import "../../settings/config.js";
import fs from "fs";

let handler = async (m, { conn, runtime, pushName, prefix }) => {
    const user = global.db.users[m.sender];
    
    function loadJSON(file) {
        try {
            return JSON.parse(fs.readFileSync(file));
        } catch {
            return {};
        }
    }
    
    const usersData = loadJSON('./database/users.json');
    const statsData = loadJSON('./database/stats.json');
    const inventory = loadJSON('./database/inventory.json');
    
    const userData = usersData[m.sender] || { level: 1, exp: 0 };
    const userStats = statsData[m.sender] || { hp: 100, stamina: 50, attack: 10, defense: 5, job: 'pengembara' };
    const userInventory = inventory[m.sender] || { items: [] };

    // Progress bar untuk EXP
    function createProgressBar(exp, maxExp = 100) {
        const percentage = (exp / maxExp) * 100;
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
    }

    const text = `⚔️ *RPG MASTER MENU* ⚔️
*Halo ${pushName}!*

*📊 STATISTIK RPG:*
▢ 🎯 Level: ${userData.level}
▢ ⭐ EXP: ${createProgressBar(userData.exp)}
▢ ❤️ HP: ${userStats.hp}/100
▢ ⚡ Stamina: ${userStats.stamina}/50
▢ ⚔️ Attack: ${userStats.attack}
▢ 🛡️ Defense: ${userStats.defense}
▢ 💼 Job: ${userStats.job}

*🗡️ RPG COMMANDS:*
┌─「 ⚔️ COMBAT 」
│ ▢ ${prefix}latih - Training stat
│ ▢ ${prefix}duel @user - Duel player
│ ▢ ${prefix}lawannpc - Lawan NPC
│ ▢ ${prefix}heal - Pulihkan HP
└─

┌─「 🗺️ EXPLORATION 」
│ ▢ ${prefix}jelajah - Explore dunia
│ ▢ ${prefix}lokasi - Daftar lokasi
│ ▢ ${prefix}quest - Misi harian
│ ▢ ${prefix}loot - Ambil item
└─

┌─「 🛠️ EQUIPMENT 」
│ ▢ ${prefix}equip - Pasang equipment
│ ▢ ${prefix}craft - Craft item
│ ▢ ${prefix}upgrade - Upgrade item
│ ▢ ${prefix}inventory - Lihat inventory
└─

┌─「 🏰 GUILD 」
│ ▢ ${prefix}guild buat - Buat guild
│ ▢ ${prefix}guild gabung - Gabung guild
│ ▢ ${prefix}guild info - Info guild
│ ▢ ${prefix}perang - Perang guild
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
    const btnklick = "⚔️ RPG System";

    const buttonData = [
        {
            title: `⚔️ Training`,
            description: "Tingkatkan statistik",
            id: `${prefix}latih`
        },
        {
            title: `🗺️ Explore`,
            description: "Jelajahi dunia",
            id: `${prefix}jelajah`
        },
        {
            title: `🛡️ Equipment`, 
            description: "Kelola equipment",
            id: `${prefix}inventory`
        }
    ];
    
    await conn.sendButton(m.chat, text, footer, btnklick, image1, image2, buttonData, m);
};

handler.help = ['rpgmenu', 'menurpg'];
handler.tags = ['rpg', 'main'];
handler.command = ["rpgmenu", "menurpg", "rm"];
handler.limit = 1;

export default handler;
