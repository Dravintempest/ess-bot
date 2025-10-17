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
    const userBiz = loadJSON('./database/user_business.json');
    const userCrypto = loadJSON('./database/crypto.json');
    
    const userData = usersData[m.sender] || { money: 0, bank: 0 };
    const userBusiness = userBiz[m.sender] || {};
    const userPortfolio = userData.crypto || {};
    
    // Hitung total kekayaan
    const totalWealth = userData.money + (userData.bank || 0);
    let cryptoValue = 0;
    Object.entries(userPortfolio).forEach(([code, amount]) => {
        const crypto = userCrypto[code];
        if (crypto) cryptoValue += crypto.price * amount;
    });
    
    let businessValue = 0;
    Object.values(userBusiness).forEach(biz => {
        businessValue += biz.profit * 24; // Nilai bisnis berdasarkan profit harian
    });

    const text = `💰 *ECONOMY MASTER MENU* 💰
*Halo ${pushName}!*

*📊 STATISTIK EKONOMI:*
▢ 💵 Uang Tunai: Rp${userData.money.toLocaleString()}
▢ 🏦 Tabungan: Rp${(userData.bank || 0).toLocaleString()}
▢ 💰 Total Kekayaan: Rp${totalWealth.toLocaleString()}
▢ 📈 Nilai Crypto: Rp${cryptoValue.toLocaleString()}
▢ 🏢 Nilai Bisnis: Rp${businessValue.toLocaleString()}

*💼 ECONOMY COMMANDS:*
┌─「 💰 BASIC 」
│ ▢ ${prefix}saldo - Cek saldo
│ ▢ ${prefix}bank simpan/tarik - Bank system
│ ▢ ${prefix}transfer @user - Transfer uang
│ ▢ ${prefix}top - Leaderboard uang
└─

┌─「 📈 INVESTASI 」
│ ▢ ${prefix}crypto - Market crypto
│ ▢ ${prefix}belicrypto - Beli crypto
│ ▢ ${prefix}portofolio - Portofolio crypto
│ ▢ ${prefix}grafik - Grafik harga
└─

┌─「 🏢 BISNIS 」
│ ▢ ${prefix}bisnis - Daftar bisnis
│ ▢ ${prefix}bukausaha - Buka usaha
│ ▢ ${prefix}tarikhasil - Ambil profit
│ ▢ ${prefix}upgradeusaha - Upgrade bisnis
└─

┌─「 🏦 ADVANCED 」
│ ▢ ${prefix}pinjam - Sistem pinjaman
│ ▢ ${prefix}utangku - Lihat utang
│ ▢ ${prefix}korupsi - Sistem korupsi
│ ▢ ${prefix}lapor - Lapor kejahatan
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
    const btnklick = "💰 Economy System";

    const buttonData = [
        {
            title: `💰 Check Balance`,
            description: "Cek saldo dan kekayaan",
            id: `${prefix}saldo`
        },
        {
            title: `📈 Crypto Market`,
            description: "Trading crypto",
            id: `${prefix}crypto`
        },
        {
            title: `🏢 My Business`,
            description: "Kelola bisnis", 
            id: `${prefix}bisnis`
        }
    ];
    
    await conn.sendButton(m.chat, text, footer, btnklick, image1, image2, buttonData, m);
};

handler.help = ['economymenu', 'menueconomy'];
handler.tags = ['economy', 'main'];
handler.command = ["economymenu", "menueconomy", "em"];
handler.limit = 1;

export default handler;
