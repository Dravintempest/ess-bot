import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

let handler = async (m, { conn, text, prefix, command }) => {
    try {
        if (!text) return m.reply(`❌ *Link channel mana?*\n\nContoh: ${prefix + command} https://whatsapp.com/channel/ABC123`)

        if (!text.includes("https://whatsapp.com/channel/")) 
            return m.reply("❌ Link tautan tidak valid!")

        let channelId = text.split('https://whatsapp.com/channel/')[1]
        if (!channelId) return m.reply("❌ Tidak bisa mendapatkan ID channel!")

        let channelLink = `https://chat.whatsapp.com/${channelId}`

        let teks = `🌐 *INFORMASI CHANNEL WHATSAPP*\n\n` +
                   `🆔 *ID:* ${channelId}\n` +
                   `🔗 *Link:* ${channelLink}`

        
        let msg = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: {
                            body: { text: teks },
                            footer: { text: `🔍 ${global.namebot}` },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Salin ID",
                                            copy_code: channelId
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🌐 Buka Channel",
                                            url: channelLink
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
