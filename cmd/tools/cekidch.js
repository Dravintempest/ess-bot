import pkg from '@whiskeysockets/baileys'
import "../../settings/config.js";
const { proto, generateWAMessageFromContent } = pkg;

let handler = async (m, { conn, args, prefix, command, pushName }) => {
    try {
        // pastiin text ada
        let text = (args?.join(' ') || '').trim()
        if (!text) return m.reply(`❌ *Link channel mana?*\n\nContoh: ${prefix + command} https://whatsapp.com/channel/ABC123`);

        if (!text.includes("https://whatsapp.com/channel/")) 
            return m.reply("❌ Link tautan tidak valid!");

        const sid = text.split('https://whatsapp.com/channel/')[1];
        const SLink = `https://whatsapp.com/channel/${sid}`;

        let res = await conn.newsletterMetadata("invite", sid);
        let teks = `*ID :* ${res.id}
*Nama :* ${res.name}
*Link :* ${SLink}
*Total Pengikut :* ${res.subscribers}
*Status :* ${res.state}
*Verified :* ${res.verification === "VERIFIED" ? "Terverifikasi" : "Tidak"}`;

        const footer = `${global.footer || 'Ess Bot'}`;
        const image1 = `https://files.catbox.moe/jlkib4.png`; // image utama

        // generate interactiveMessage dengan image
        const msg = generateWAMessageFromContent(
            m.chat,
            {
                templateMessage: {
                    hydratedTemplate: {
                        imageMessage: { 
                            url: image1 
                        },
                        hydratedContentText: teks,
                        hydratedFooterText: footer,
                        hydratedButtons: [
                            {
                                urlButton: {
                                    displayText: "🌐 Buka Channel",
                                    url: SLink
                                }
                            },
                            {
                                quickReplyButton: {
                                    displayText: "📋 Salin ID",
                                    id: `.copyid ${res.id}`
                                }
                            }
                        ]
                    }
                },
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    mentionedJid: m.quoted ? [m.quoted.sender] : [],
                    forwardedNewsletterMessageInfo: {
                        newsletterName: 'EssentialsR | Info',
                        newsletterJid: '120363367787013309@newsletter'
                    },
                    externalAdReply: {
                        title: global.namebotz || 'My Bot',
                        body: global.nameown || 'Bot Owner',
                        thumbnailUrl: image1,
                        sourceUrl: global.YouTube || 'https://youtube.com',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            },
            { quoted: m }
        );

        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });

    } catch (error) {
        console.error('cekidch error:', error)
        m.reply(`❌ Terjadi kesalahan.\nError: ${error.message || error}`)
    }
};

handler.help = ['cekidch <link>']
handler.tags = ['tools']
handler.command = ['idch', 'cekidch']
handler.register = true
handler.limit = 2

export default handler;
