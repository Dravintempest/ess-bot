import axios from 'axios'
import FormData from 'form-data'

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
      'dnt': '1',
      'sec-ch-ua-mobile': '?1',
      'origin': 'https://cekwebphishing.my.id',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://cekwebphishing.my.id/',
      'accept-language': 'id,en-US;q=0.9,en;q=0.8,ja;q=0.7',
      'priority': 'u=1, i',
      ...data.getHeaders()
    },
    data
  }

  const api = await axios.request(config)
  return api.data
}

let handler = async (m, { text }) => {
  try {
    if (!text) return m.reply(`❌ *Contoh Penggunaan:*\n.cekphising https://example.com`)

    // Tampilkan pesan processing
    await m.reply('🔄 *Memeriksa keamanan website...*\n⏳ Mohon tunggu sebentar...')

    const result = await cekWeb(text)
    
    // Handle nilai yang mungkin undefined
    const safeGet = (obj, key, defaultValue = 0) => {
      return obj && obj[key] !== undefined ? obj[key] : defaultValue
    }
    
    // Format hasil menjadi lebih menarik
    const statusText = safeGet(result, 'status_text', 'Tidak Diketahui')
    const statusEmoji = statusText === 'Aman' ? '🟢' : statusText === 'Berbahaya' ? '🔴' : '🟡'
    const score = safeGet(result, 'score', 0)
    const scoreColor = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴'
    const url = safeGet(result, 'url', text)
    const totals = safeGet(result, 'totals', {})
    const totalVendors = safeGet(result, 'total_vendors', safeGet(totals, 'clean', 0) + safeGet(totals, 'suspicious', 0) + safeGet(totals, 'malicious', 0) + safeGet(totals, 'phishing', 0))
    const vendors = safeGet(result, 'vendors', {})
    
    let message = `
🌐 *HASIL PEMERIKSAAN KEAMANAN WEBSITE*

📊 *Status:* ${statusEmoji} ${statusText}
⭐ *Skor Keamanan:* ${scoreColor} ${score}/100
🔗 *URL:* ${url}

📈 *STATISTIK DETEKSI:*
• ✅ Bersih: ${safeGet(totals, 'clean', 0)} vendor
• ⚠️ Mencurigakan: ${safeGet(totals, 'suspicious', 0)} vendor  
• 🚨 Berbahaya: ${safeGet(totals, 'malicious', 0)} vendor
• 🎣 Phising: ${safeGet(totals, 'phishing', 0)} vendor
• 📋 Total Vendor: ${totalVendors}

`

    // Tambahkan vendor terkenal yang clean
    const famousCleanVendors = [
      'Google Safebrowsing', 'Kaspersky', 'ESET', 'Sophos', 
      'Fortinet', 'BitDefender', 'MalwarePatrol', 'Phishtank',
      'URLhaus', 'OpenPhish', 'Yandex Safebrowsing', 'Webroot'
    ]
    
    let cleanCount = 0
    let cleanList = []
    
    for (const vendor of famousCleanVendors) {
      if (vendors[vendor] === 'clean' && cleanCount < 6) {
        cleanList.push(`✅ ${vendor}`)
        cleanCount++
      }
    }
    
    if (cleanList.length > 0) {
      message += `\n🔐 *VENDOR TERKENAL YANG AMAN:*\n${cleanList.join('\n')}`
    } else {
      // Jika tidak ada vendor clean yang terkenal, tampilkan vendor lain
      let otherClean = []
      for (const [vendor, status] of Object.entries(vendors)) {
        if (status === 'clean' && otherClean.length < 5) {
          otherClean.push(`✅ ${vendor}`)
        }
      }
      if (otherClean.length > 0) {
        message += `\n🔐 *VENDOR YANG MENANDAI AMAN:*\n${otherClean.join('\n')}`
      }
    }

    // Tambahkan rekomendasi berdasarkan skor
    let recommendation = ''
    if (score >= 80) {
      recommendation = `Website ini terlihat aman berdasarkan pemeriksaan ${totalVendors} vendor keamanan.`
    } else if (score >= 60) {
      recommendation = `Website ini mencurigakan. Hati-hati dalam memasukkan data pribadi.`
    } else if (score >= 1) {
      recommendation = `Website ini terdeteksi berbahaya! Jangan masukkan data apapun.`
    } else {
      recommendation = `Tidak dapat menentukan keamanan website. Disarankan untuk berhati-hati.`
    }

    message += `\n\n💡 *REKOMENDASI:*\n${recommendation}`

    message += `\n\n📅 *Diperiksa pada:* ${new Date().toLocaleString('id-ID')}`
    message += `\n✨ *Powered by:* ${global.namebot || 'WhatsApp Bot'}`

    await m.reply(message)

  } catch (e) {
    console.error('CekPhising Error:', e)
    
    let errorMessage = '❌ *Gagal memeriksa website!*'
    
    if (e.message.includes('network') || e.message.includes('ECONNREFUSED')) {
      errorMessage = '❌ *Koneksi gagal!*\nServer pemeriksa sedang down.'
    } else if (e.message.includes('timeout')) {
      errorMessage = '❌ *Timeout!*\nProses pemeriksaan terlalu lama.'
    } else if (e.message.includes('Invalid URL')) {
      errorMessage = '❌ *URL tidak valid!*\nPastikan format URL benar.'
    }
    
    await m.reply(`${errorMessage}\n\nError: ${e.message}`)
  }
}

// Helper function untuk handle undefined values
function safeGet(obj, key, defaultValue = null) {
  if (!obj || typeof obj !== 'object') return defaultValue
  return obj[key] !== undefined ? obj[key] : defaultValue
}

handler.command = ['cekphising', 'cekweb', 'ceksite', 'scanurl']
handler.help = ['cekphising <url>', 'cekweb <url>']
handler.tags = ['tools']

handler.limit = 2
handler.register = true

export default handler
