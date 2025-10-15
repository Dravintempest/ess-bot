import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

let handler = async (m, { conn, args, prefix, command }) => {
    try {
        // pastiin text ada
        let text = (args?.join(' ') || '').trim()
        if (!text) return m.reply(`❌ *Link channel mana?*\n\nContoh: ${prefix + command} https://whatsapp.com/channel/ABC123`)

        if (!text.includes("https://whatsapp.com/channel/")) 
            return m.reply("❌ Link tautan tidak valid!")

        const sid = text.split('https://whatsapp.com/channel/')[1]
    const SLink = `https://whatsapp.com/channel/${sid}`

        const image1 = `https://files.catbox.moe/jlkib4.png`;
        let quoted = m.quoted ? m.quoted : m


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
                                ],
                            contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentionedJid: [quoted.sender],
            forwardedNewsletterMessageInfo: {
                newsletterName: 'EssentialsR | Info',
                newsletterJid: '120363400190026912@newsletter'
            },
            externalAdReply: {
                title: global.namebotz,
                body: global.nameown,
                thumbnailUrl: image1,
                sourceUrl: global.YouTube,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
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
