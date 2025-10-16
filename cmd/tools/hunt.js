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
*Halo ${pushName}!*

*📊 STATISTIK BERBURU:*
▢ 🎯 Level: ${userHuntData.level}
▢ ⭐ EXP: ${createProgressBar(userHuntData.exp)}
▢ 💰 Nilai Buruan: Rp${totalAnimalValue.toLocaleString()}
▢ 🐾 Total Tangkapan: ${userHuntData.animalsCaught}
▢ 📦 Inventory: ${animalInventory.length} hewan
▢ ⚡ Energy: ${userHuntData.energy || 100}/100

*🎯 HUNTING COMMANDS:*
┌─「 🎯 BASIC 」
│ ▢ ${prefix}buru <spot> - Mulai berburu
│ ▢ ${prefix}listburu - List tempat berburu
│ ▢ ${prefix}burustats - Statistik berburu
│ ▢ ${prefix}jualhewan - Jual semua hewan
│ ▢ ${prefix}jual <hewan> - Jual hewan tertentu
└─

┌─「 📊 INFO 」
│ ▢ ${prefix}hewaninfo <hewan> - Detail hewan
│ ▢ ${prefix}hunttop - Leaderboard
│ ▢ ${prefix}huntstats - Statistik detail
│ ▢ ${prefix}animaldex - Pokédex hewan
└─

┌─「 ⚙️ ADVANCED 」
│ ▢ ${prefix}track - Lacak hewan
│ ▢ ${prefix}pasangjebak - Pasang jebakan
│ ▢ ${prefix}cekjebak - Cek jebakan
│ ▢ ${prefix}upgradeskill - Tingkatkan skill
│ ▢ ${prefix}burugift - Kirim hewan
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
    const btnklick = "🎯 Hunting System";

    const buttonData = [
        {
            title: `🎯 Start Hunting`,
            description: "Mulai adventure berburu!",
            id: `${prefix}listburu`
        },
        {
            title: `📊 Hunt Stats`,
            description: "Lihat statistik lengkap",
            id: `${prefix}huntstats`
        },
        {
            title: `🏆 Leaderboard`,
            description: "Peringkat hunter terbaik", 
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
