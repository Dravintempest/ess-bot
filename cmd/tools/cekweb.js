// cekphising.js
import axios from 'axios'
import FormData from 'form-data'

/**
 * Fungsi yang memanggil API cek web phishing.
 * Mengembalikan hasil API apa adanya (object).
 */
async function cekWeb(url) {
  const data = new FormData()
  data.append('url', url)

  const config = {
    method: 'POST',
    url: 'https://cekwebphishing.my.id/scan.php',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      dnt: '1',
      'sec-ch-ua-mobile': '?1',
      origin: 'https://cekwebphishing.my.id',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      referer: 'https://cekwebphishing.my.id/',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8,ja;q=0.7',
      priority: 'u=1, i',
      ...data.getHeaders()
    },
    data,
    timeout: 15000 // 15 detik timeout
  }

  const api = await axios.request(config)
  return api.data
}

/**
 * Helper safe getter
 */
function safeGet(obj, key, defaultValue = null) {
  if (!obj || typeof obj !== 'object') return defaultValue
  return obj[key] !== undefined ? obj[key] : defaultValue
}

/**
 * Handler command
 * Menerima parameter m (message) dan context yang berisi text (jika ada)
 */
let handler = async (m, { text }) => {
  try {
    // DEBUG: log singkat, hapus/comment kalau sudah aman
    console.log('cekphising called', {
      text,
      conversation: m?.message?.conversation,
      extendedText: m?.message?.extendedTextMessage?.text,
      caption: m?.message?.imageMessage?.caption,
      quoted: !!m?.quoted
    })

    // Ambil teks/URL dari berbagai lokasi pesan WA
    let raw =
      text ||
      (m?.message?.conversation) ||
      (m?.message?.extendedTextMessage && m.message.extendedTextMessage.text) ||
      (m?.message?.imageMessage && m.message.imageMessage.caption) ||
      (m?.quoted && (m.quoted.text || (m.quoted.message && m.quoted.message.conversation))) ||
      ''

    raw = ('' + raw).trim()

    if (!raw) {
      return m.reply('❌ *Contoh Penggunaan:*\n.cekphising https://example.com')
    }

    // Cari URL, pertama coba http/https, kalau nggak ada coba domain-like
    const urlMatch = raw.match(/https?:\/\/[^\s]+/i) || raw.match(/[^\s]+\.[a-z]{2,6}[^\s]*/i)
    if (!urlMatch) {
      return m.reply('❌ *URL tidak ditemukan dalam pesan.*\nContoh: .cekphising https://example.com')
    }

    let url = urlMatch[0].trim()

    // Normalisasi: tambahkan https:// kalau belum ada
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url

    // Informasi processing ke user
    await m.reply('🔄 *Memeriksa keamanan website...*\n⏳ Mohon tunggu sebentar...')

    // Panggil API
    const result = await cekWeb(url)

    // Parsing hasil dengan fallback
    const statusText = safeGet(result, 'status_text', 'Tidak Diketahui')
    const statusEmoji = statusText === 'Aman' ? '🟢' : statusText === 'Berbahaya' ? '🔴' : '🟡'
    const score = Number(safeGet(result, 'score', 0)) || 0
    const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴'
    const totals = safeGet(result, 'totals', {})
    const vendors = safeGet(result, 'vendors', {})

    const totalVendors = safeGet(result, 'total_vendors',
      (Number(safeGet(totals, 'clean', 0)) || 0)
      + (Number(safeGet(totals, 'suspicious', 0)) || 0)
      + (Number(safeGet(totals, 'malicious', 0)) || 0)
      + (Number(safeGet(totals, 'phishing', 0)) || 0)
    )

    // Bangun pesan hasil
    let message = `
🌐 *HASIL PEMERIKSAAN KEAMANAN WEBSITE*

📊 *Status:* ${statusEmoji} ${statusText}
⭐ *Skor Keamanan:* ${scoreEmoji} ${score}/100
🔗 *URL:* ${url}

📈 *STATISTIK DETEKSI:*
• ✅ Bersih: ${safeGet(totals, 'clean', 0)} vendor
• ⚠️ Mencurigakan: ${safeGet(totals, 'suspicious', 0)} vendor  
• 🚨 Berbahaya: ${safeGet(totals, 'malicious', 0)} vendor
• 🎣 Phising: ${safeGet(totals, 'phishing', 0)} vendor
• 📋 Total Vendor: ${totalVendors}
`

    // Vendor terkenal
    const famousCleanVendors = [
      'Google Safebrowsing', 'Kaspersky', 'ESET', 'Sophos',
      'Fortinet', 'BitDefender', 'MalwarePatrol', 'Phishtank',
      'URLhaus', 'OpenPhish', 'Yandex Safebrowsing', 'Webroot'
    ]

    let cleanList = []
    for (const vendor of famousCleanVendors) {
      if (vendors[vendor] === 'clean' && cleanList.length < 6) cleanList.push(`✅ ${vendor}`)
    }
    if (cleanList.length) message += `\n🔐 *VENDOR TERKENAL YANG AMAN:*\n${cleanList.join('\n')}`
    else {
      // fallback: tampilkan sampai 5 vendor yang menandai clean
      let otherClean = []
      for (const [vendor, status] of Object.entries(vendors || {})) {
        if (status === 'clean' && otherClean.length < 5) otherClean.push(`✅ ${vendor}`)
      }
      if (otherClean.length) message += `\n🔐 *VENDOR YANG MENANDAI AMAN:*\n${otherClean.join('\n')}`
    }

    // Rekomendasi berdasarkan skor
    let recommendation = ''
    if (score >= 80) recommendation = `Website ini terlihat aman berdasarkan pemeriksaan ${totalVendors} vendor keamanan.`
    else if (score >= 60) recommendation = `Website ini mencurigakan. Hati-hati dalam memasukkan data pribadi.`
    else if (score >= 1) recommendation = `Website ini terdeteksi berbahaya! Jangan masukkan data apapun.`
    else recommendation = `Tidak dapat menentukan keamanan website. Disarankan untuk berhati-hati.`

    message += `\n\n💡 *REKOMENDASI:*\n${recommendation}`
    message += `\n\n📅 *Diperiksa pada:* ${new Date().toLocaleString('id-ID')}`
    message += `\n✨ *Powered by:* ${global?.namebot || 'WhatsApp Bot'}`

    await m.reply(message)
  } catch (e) {
    console.error('CekPhising Error:', e)
    let errorMessage = '❌ *Gagal memeriksa website!*'
    const emsg = (e && e.message) ? e.message.toLowerCase() : ''

    if (emsg.includes('network') || emsg.includes('econnrefused')) {
      errorMessage = '❌ *Koneksi gagal!*\nServer pemeriksa sedang down.'
    } else if (emsg.includes('timeout')) {
      errorMessage = '❌ *Timeout!*\nProses pemeriksaan terlalu lama.'
    } else if (emsg.includes('invalid url')) {
      errorMessage = '❌ *URL tidak valid!*\nPastikan format URL benar.'
    }

    // Kirim error message ke user (plus detail error untuk debugging)
    await m.reply(`${errorMessage}\n\nError: ${(e && e.message) || e}`)
  }
}

// command metadata
handler.command = ['cekphising', 'cekweb', 'ceksite', 'scanurl']
handler.help = ['cekphising <url>', 'cekweb <url>']
handler.tags = ['tools']
handler.limit = 2
handler.register = true

export default handler
