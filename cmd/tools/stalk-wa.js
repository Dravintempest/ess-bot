import pkg from '@varshade/baileys'

const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = pkg

let handler = async (m, { conn, args, usedPrefix, command }) => {

    if (!args[0]) {
        return m.reply(`*Contoh penggunaan:* ${usedPrefix + command} 6281234567890\n\n*Note:* Gunakan format internasional tanpa +`)
    }

    let number = args[0].replace(/[^0-9]/g, '')
    if (!number.startsWith('62')) {
        number = '62' + number
    }
    
    let jid = number + '@s.whatsapp.net'
    
    try {
        await m.reply('🔍 *Mencari informasi WhatsApp...*')
        
        // Get profile picture
        let profilePicture
        try {
            profilePicture = await conn.profilePictureUrl(jid, 'image')
        } catch {
            profilePicture = global.gfx // Fallback ke gambar default
        }

        // Get user info
        let user = await conn.fetchStatus(jid).catch(e => null)
        let businessProfile = await conn.getBusinessProfile(jid).catch(e => null)
        
        // Prepare media
        const uploadedMedia = await prepareWAMessageMedia(
            { image: { url: profilePicture } },
            { upload: conn.waUploadToServer }
        )

        // Format informasi
        let lastSeen = 'Tidak tersedia'
        let isBusiness = businessProfile ? 'Ya' : 'Tidak'
        let businessInfo = ''
        
        if (businessProfile) {
            businessInfo = `🏢 *Business Info:*\n` +
                          `• Nama: ${businessProfile.business_name || 'Tidak ada'}\n` +
                          `• Deskripsi: ${businessProfile.business_description || 'Tidak ada'}\n` +
                          `• Kategori: ${businessProfile.business_category || 'Tidak ada'}\n` +
                          `• Email: ${businessProfile.business_email || 'Tidak ada'}\n` +
                          `• Website: ${businessProfile.business_website || 'Tidak ada'}\n\n`
        }

        let statusInfo = user ? 
            `📝 *Status:* ${user.status || 'Tidak ada status'}\n` +
            `⏰ *Update:* ${new Date(user.setAt).toLocaleString('id-ID')}\n\n` :
            `📝 *Status:* Tidak tersedia\n\n`

        let bodyText = `📱 *WHATSAPP STALKER REPORT*\n\n` +
                      `👤 *Nomor:* +${number}\n` +
                      `📞 *Format:* ${formatPhoneNumber(number)}\n` +
                      `🏪 *Business Account:* ${isBusiness}\n\n` +
                      statusInfo +
                      businessInfo +
                      `🔍 *Informasi Lain:*\n` +
                      `• Profil Picture: ${profilePicture !== global.gfx ? 'Tersedia' : 'Default/Tidak tersedia'}\n` +
                      `• Terakhir Online: ${lastSeen}\n` +
                      `• Status Broadcast: ${user ? 'Aktif' : 'Tidak aktif'}\n\n` +
                      `*Data diambil secara real-time dari WhatsApp*`

        // Create interactive message
        let stalkMessage = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                            mentionedJid: [m.sender],
                            isForwarded: true,
                            forwardingScore: 256,
                            businessMessageForwardInfo: { 
                                businessOwnerJid: conn.decodeJid(conn.user.id) 
                            }
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ 
                                text: bodyText 
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `🔍 ${global.namebot} • WhatsApp Stalker • ${new Date().toLocaleDateString('id-ID')}`
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                hasMediaAttachment: true,
                                ...uploadedMedia
                            }),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: global.newsid,
                                    newsletterName: global.nameown,
                                    serverMessageId: -1
                                },
                                businessMessageForwardInfo: { 
                                    businessOwnerJid: conn.decodeJid(conn.user.id) 
                                },
                                forwardingScore: 256
                            },
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📞 Hubungi Nomor",
                                            url: `https://wa.me/${number}`
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🔄 Cek Ulang",
                                            id: `${usedPrefix + command} ${number}`
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Salin Nomor",
                                            copy_code: `+${number}`
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            },
            { quoted: m, userJid: m.chat }
        )

        await conn.relayMessage(m.chat, stalkMessage.message, { messageId: stalkMessage.key.id })

    } catch (error) {
        console.error('Stalk error:', error)
        
        // Fallback ke pesan biasa jika error
        let errorMessage = `❌ *GAGAL MENGUMPULKAN INFORMASI*\n\n` +
                          `Nomor: +${number}\n` +
                          `Error: ${error.message}\n\n` +
                          `*Kemungkinan penyebab:*\n` +
                          `• Nomor tidak terdaftar di WhatsApp\n` +
                          `• Privacy settings yang ketat\n` +
                          `• Koneksi internet bermasalah\n\n` +
                          `Coba lagi dengan nomor yang berbeda.`

        await m.reply(errorMessage)
    }
}

// Helper function untuk format nomor telepon
function formatPhoneNumber(number) {
    let cleaned = number.replace(/\D/g, '')
    if (cleaned.startsWith('62')) {
        cleaned = cleaned.substring(2)
    }
    
    let match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/)
    if (match) {
        return '+62 ' + match[1] + '-' + match[2] + '-' + match[3]
    }
    
    match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (match) {
        return '+62 ' + match[1] + '-' + match[2] + '-' + match[3]
    }
    
    return '+62 ' + cleaned
}

handler.help = ['wastalk <nomor>']
handler.tags = ['tools']
handler.command = /^(wastalk|stalk|stalkwa)$/i
handler.premium = false
handler.limit = 3
handler.register = true

export default handler
