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
    const userWorkData = usersData[m.sender] || { 
        money: 0, 
        workCount: 0, 
        level: 1, 
        exp: 0,
        energy: 100
    };
    
    // Progress bar untuk EXP
    function createProgressBar(exp, maxExp = 100) {
        const percentage = (exp / maxExp) * 100;
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
    }
    
    const text = `*💼 WORK MASTER MENU 💼*
*Halo ${pushName}!*

*📊 STATISTIK PEKERJAAN:*
▢ 🎯 Level: ${userWorkData.level}
▢ ⭐ EXP: ${createProgressBar(userWorkData.exp)}
▢ 💰 Uang: Rp${userWorkData.money.toLocaleString()}
▢ 💼 Total Kerja: ${userWorkData.workCount || 0}
▢ ⚡ Energy: ${userWorkData.energy || 100}/100

*💼 WORK COMMANDS:*
┌─「 💼 BASIC 」
│ ▢ ${prefix}kerja <job> - Mulai bekerja
│ ▢ ${prefix}listkerja - List semua pekerjaan
│ ▢ ${prefix}kerjastats - Statistik kerja
│ ▢ ${prefix}energy - Cek energy
│ ▢ ${prefix}istirahat - Pulihkan energy
└─

┌─「 📊 INFO 」
│ ▢ ${prefix}jobinfo <job> - Detail pekerjaan
│ ▢ ${prefix}worktop - Leaderboard
│ ▢ ${prefix}workstats - Statistik detail
│ ▢ ${prefix}gaji - Informasi gaji
└─

┌─「 ⚙️ ADVANCED 」
│ ▢ ${prefix}karir - Progress karir
│ ▢ ${prefix}promosi - Promosi pekerjaan
│ ▢ ${prefix}carikerja - Cari pekerjaan baru
│ ▢ ${prefix}quitjob - Keluar dari pekerjaan
└─

*🔧 BOT INFO:*
▢ ⏱️ Runtime: ${runtime(process.uptime())}
▢ 👑 Role: ${user.role}
▢ 🎫 Limit: ${user.limit === Infinity ? '∞' : user.limit}
▢ 📊 Total Command: ${user.command}
`;

    const footer = `${global.footer}`;
    const image1 = `https://files.catbox.moe/8x9p2q.png`;
    const image2 = `https://files.catbox.moe/8x9p2q.png`;
    const btnklick = "💼 Work System";

    const buttonData = [
        {
            title: `💼 Start Working`,
            description: "Mulai karirmu sekarang!",
            id: `${prefix}listkerja`
        },
        {
            title: `📊 Work Stats`,
            description: "Lihat statistik lengkap",
            id: `${prefix}workstats`
        },
        {
            title: `🏆 Leaderboard`,
            description: "Peringkat worker terbaik", 
            id: `${prefix}worktop`
        }
    ];
    
    await conn.sendButton(m.chat, text, footer, btnklick, image1, image2, buttonData, m);
};

handler.help = ['workmenu', 'jobmenu', 'menuwork'];
handler.tags = ['work', 'main'];
handler.command = ["workmenu", "jobmenu", "menuwork", "wm"];
handler.limit = 1;

export default handler;
