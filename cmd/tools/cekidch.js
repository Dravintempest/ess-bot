import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

let handler = async (m, { conn, args, prefix, command }) => {
    try {
        // pastiin text ada
        let text = (args?.join(' ') || '').trim()
        if (!text) return m.reply(`❌ *Link channel mana?*\n\nContoh: ${prefix + command} https://whatsapp.com/channel/ABC123`)

        if (!text.includes("https://whatsapp.com/channel/")) 
            return m.reply("❌ Link tautan tidak valid!")

        const sid = link.split('https://whatsapp.com/channel/')[1]
    const SLink = `https://chat.whatsapp.com/${sid}`


        let result = text.split('https://whatsapp.com/channel/')[1]
let res = await conn.newsletterMetadata("invite", result)
let teks = `* *ID : ${res.id}*
* *Nama :* ${res.name}
* *Link :* ${SLink}
* *Total Pengikut :* ${res.subscribers}
* *Status :* ${res.state}
* *Verified :* ${res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak"}`

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
                            footer: { text: `Ess Bot` },
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
