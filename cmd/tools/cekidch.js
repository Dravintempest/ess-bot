import pkg from '@whiskeysockets/baileys'
import "../../settings/config.js";
const { proto, generateWAMessageFromContent } = pkg

let handler = async (m, { conn, args, prefix, command }) => {
    try {
        let text = (args?.join(' ') || '').trim()
        if (!text) return m.reply(`❌ *Link channel mana?*\n\nContoh: ${prefix + command} https://whatsapp.com/channel/ABC123`)

        if (!text.includes("https://whatsapp.com/channel/")) 
            return m.reply("❌ Link tautan tidak valid!")

        const sid = text.split('https://whatsapp.com/channel/')[1]
        const SLink = `https://whatsapp.com/channel/${sid}`

        let res = await conn.newsletterMetadata("invite", sid)
        let teks = `*ID :* ${res.id}
*Nama :* ${res.name}
*Link :* ${SLink}
*Total Pengikut :* ${res.subscribers}
*Status :* ${res.state}
*Verified :* ${res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak"}`

        const image1 = `https://files.catbox.moe/jlkib4.png`;

        let msg = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                            externalAdReply: {
                                title: global.namebotz || 'Ess Bot',
                                body: global.nameown || 'Bot Utilities', 
                                thumbnailUrl: image1,
                                sourceUrl: global.YouTube || 'https://youtube.com',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            },
                            forwardingScore: 999,
                            isForwarded: true
                        },
                        interactiveMessage: {
                            body: { text: teks },
                            footer: { text: `${global.footer || 'Ess Bot'}` },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Salin ID", 
                                            copy_code: res.id
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🌐 Buka Channel",
                                            url: SLink
                                        })
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { quoted: m }
        )

        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id })

    } catch (error) {
        console.error('cekidch error:', error)
        m.reply(`❌ Terjadi kesalahan.\nError: ${error.message || error}`)
    }
}

handler.help = ['cekidch <link>']
handler.tags = ['tools']
handler.command = ['idch', 'cekidch']
handler.register = true
handler.limit = 2
export default handler
