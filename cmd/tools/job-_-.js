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
*Hello ${pushName}!*

*📊 WORK STATS:*
▢ 🎯 Level: ${userWorkData.level}
▢ ⭐ EXP: ${createProgressBar(userWorkData.exp)}
▢ 💰 Money: Rp${userWorkData.money.toLocaleString()}
▢ 💼 Jobs Done: ${userWorkData.workCount || 0}
▢ ⚡ Energy: ${userWorkData.energy || 100}/100

*💼 WORK COMMANDS:*
┌─「 💼 BASIC 」
│ ▢ ${prefix}work <job> - Start working
│ ▢ ${prefix}worklist - List all jobs
│ ▢ ${prefix}mywork - My work stats
│ ▢ ${prefix}energy - Check energy
│ ▢ ${prefix}rest - Restore energy
└─

┌─「 📊 INFO 」
│ ▢ ${prefix}workinfo <job> - Job details
│ ▢ ${prefix}worktop - Leaderboard
│ ▢ ${prefix}workstats - Detailed stats
│ ▢ ${prefix}salary - Salary information
└─

┌─「 ⚙️ ADVANCED 」
│ ▢ ${prefix}career - Career progress
│ ▢ ${prefix}promote - Job promotion
│ ▢ ${prefix}findjob - Find new jobs
│ ▢ ${prefix}quitjob - Leave current job
└─

*🔧 BOT INFO:*
▢ ⏱️ Runtime: ${runtime(process.uptime())}
▢ 👑 Role: ${user.role}
▢ 🎫 Limit: ${user.limit === Infinity ? '∞' : user.limit}
▢ 📊 Total Commands: ${user.command}
`;

    const footer = `${global.footer}`;
    const image1 = `https://files.catbox.moe/8x9p2q.png`;
    const image2 = `https://files.catbox.moe/8x9p2q.png`;
    const btnklick = "💼 Work System";

    const buttonData = [
        {
            title: `💼 Start Working`,
            description: "Begin your career!",
            id: `${prefix}worklist`
        },
        {
            title: `📊 Work Stats`,
            description: "View work statistics",
            id: `${prefix}workstats`
        },
        {
            title: `🏆 Leaderboard`,
            description: "Top worker rankings", 
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
