/*

 * Thank you dev and friends
 * Fauzialifatah ( me )
 * Arifzyn 
 * Kiur
 
 */

import "./settings/config.js";
import {
  makeWASocket,
  useMultiFileAuthState,
  jidDecode,
  getContentType,
  DisconnectReason,
  Browsers,
  downloadContentFromMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import pino from "pino";
import readline from "readline";
import chalk from "chalk";
import fs from "fs-extra";
import NodeCache from "node-cache";
import fileType from 'file-type';
const { fileTypeFromBuffer } = fileType;
import axios from "axios";
import { runPlugins } from './handler.js';
import handleMessage from './source/message.js';
import { fileURLToPath } from 'url';
import { smsg } from "./source/myfunc.js";
import "./source/myfunc.js";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

global.mode = true;
global.sessionName = "session";
const pairingCode = process.argv.includes("pair");

if (!pairingCode) {
  console.log(chalk.redBright("command work ( node index.js pair"));
}

// Context Info Configuration
const contextInfoConfig = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterName: 'EssentialsR | Info',
    newsletterJid: '120363367787013309@newsletter'
  },
  externalAdReply: {
    title: "EssentialsR Bot",
    body: "EssentialsR | Official", 
    thumbnailUrl: "https://files.catbox.moe/jlkib4.png",
    sourceUrl: "https://www.esscloud.my.id",
    mediaType: 1,
    renderLargerThumbnail: false
  }
};

const getBuffer = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (e) {
        console.log(`Error : ${e}`);
    }
};

// Variabel global untuk panel interface
let panelInterface = null;

// Fungsi untuk git pull
async function gitPull() {
  try {
    console.log(chalk.cyan('╭──────────────────────────────────────···'));
    console.log(chalk.cyan('│ 🔄 MELAKUKAN GIT PULL...'));
    console.log(chalk.cyan('├──────────────────────────────────────···'));
    
    const { stdout, stderr } = await execAsync('git pull');
    
    if (stdout) {
      console.log(chalk.green('│ ✅ Git Pull Output:'));
      console.log(chalk.white('│ ' + stdout.replace(/\n/g, '\n│ ')));
    }
    
    if (stderr) {
      console.log(chalk.yellow('│ ⚠️ Git Pull Warning:'));
      console.log(chalk.white('│ ' + stderr.replace(/\n/g, '\n│ ')));
    }
    
    console.log(chalk.cyan('╰──────────────────────────────────────···'));
    console.log(chalk.green('✅ Git pull selesai!'));
    
    return { success: true, stdout, stderr };
  } catch (error) {
    console.log(chalk.red('╭──────────────────────────────────────···'));
    console.log(chalk.red('│ ❌ GAGAL GIT PULL'));
    console.log(chalk.red('├──────────────────────────────────────···'));
    console.log(chalk.red(`│ Error: ${error.message}`));
    console.log(chalk.red('╰──────────────────────────────────────···'));
    return { success: false, error: error.message };
  }
}

// Fungsi untuk restart bot
function restartBot() {
  console.log(chalk.yellow('🔄 Restarting bot...'));
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Fungsi untuk handle command dari panel/console
async function handlePanelCommand(input, conn) {
  try {
    // Bersihkan input dari karakter yang tidak diinginkan
    const cleanInput = input.trim().replace(/\s+/g, ' ');
    const args = cleanInput.split(' ');
    const command = args[0].toLowerCase();
    
    if (command === 'message' || command === 'msg') {
      if (args.length < 3) {
        console.log(chalk.red('Format salah! Gunakan: message <nomor> <pesan>'));
        console.log(chalk.yellow('Contoh: message 6281234567890 halo apa kabar?'));
        return;
      }
      
      let number = args[1];
      const message = args.slice(2).join(' ');
      
      // Format nomor
      if (!number.startsWith('62')) {
        if (number.startsWith('0')) {
          number = '62' + number.substring(1);
        } else if (number.startsWith('+62')) {
          number = number.substring(1);
        }
      }
      
      // Validasi nomor
      if (!number.match(/^62\d{9,12}$/)) {
        console.log(chalk.red('Nomor tidak valid! Format harus 62xxxx'));
        return;
      }
      
      const jid = number + '@s.whatsapp.net';
      
      console.log(chalk.cyan('╭──────────────────────────────────────···'));
      console.log(chalk.cyan('│ 📤 MENGIRIM PESAN KE:'));
      console.log(chalk.cyan('├──────────────────────────────────────···'));
      console.log(chalk.cyan(`│ 📞 Nomor: ${number}`));
      console.log(chalk.cyan(`│ 💬 Pesan: ${message}`));
      console.log(chalk.cyan('╰──────────────────────────────────────···'));
      
      // Kirim pesan dengan context info
      await conn.sendMessage(jid, { 
        text: message,
        contextInfo: contextInfoConfig
      });
      
      console.log(chalk.green('✅ Pesan berhasil dikirim!'));
      
    } else if (command === 'broadcast' || command === 'bc') {
      if (args.length < 3) {
        console.log(chalk.red('Format salah! Gunakan: broadcast <nomor1,nomor2,...> <pesan>'));
        console.log(chalk.yellow('Contoh: broadcast 6281234567890,6289876543210 halo semua'));
        return;
      }
      
      const numbers = args[1].split(',');
      const message = args.slice(2).join(' ');
      let successCount = 0;
      let failCount = 0;
      
      console.log(chalk.cyan('╭──────────────────────────────────────···'));
      console.log(chalk.cyan('│ 📤 BROADCAST PESAN:'));
      console.log(chalk.cyan('├──────────────────────────────────────···'));
      console.log(chalk.cyan(`│ 📞 Ke: ${numbers.length} nomor`));
      console.log(chalk.cyan(`│ 💬 Pesan: ${message}`));
      console.log(chalk.cyan('╰──────────────────────────────────────···'));
      
      for (let num of numbers) {
        try {
          let number = num.trim();
          
          // Format nomor
          if (!number.startsWith('62')) {
            if (number.startsWith('0')) {
              number = '62' + number.substring(1);
            } else if (number.startsWith('+62')) {
              number = number.substring(1);
            }
          }
          
          if (number.match(/^62\d{9,12}$/)) {
            const jid = number + '@s.whatsapp.net';
            await conn.sendMessage(jid, { 
              text: message,
              contextInfo: contextInfoConfig
            });
            successCount++;
            console.log(chalk.green(`✅ Berhasil ke: ${number}`));
          } else {
            failCount++;
            console.log(chalk.red(`❌ Gagal ke: ${num} (format salah)`));
          }
        } catch (error) {
          failCount++;
          console.log(chalk.red(`❌ Gagal ke: ${num}`));
        }
        
        // Delay antar pesan untuk menghindari spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(chalk.cyan('╭──────────────────────────────────────···'));
      console.log(chalk.cyan('│ 📊 HASIL BROADCAST:'));
      console.log(chalk.cyan('├──────────────────────────────────────···'));
      console.log(chalk.green(`│ ✅ Berhasil: ${successCount}`));
      console.log(chalk.red(`│ ❌ Gagal: ${failCount}`));
      console.log(chalk.cyan('╰──────────────────────────────────────···'));
      
    } else if (command === 'image' || command === 'img') {
      if (args.length < 4) {
        console.log(chalk.red('Format salah! Gunakan: image <nomor> <url_gambar> <caption>'));
        console.log(chalk.yellow('Contoh: image 6281234567890 https://example.com/image.jpg ini gambarnya'));
        return;
      }
      
      let number = args[1];
      const imageUrl = args[2];
      const caption = args.slice(3).join(' ');
      
      // Format nomor
      if (!number.startsWith('62')) {
        if (number.startsWith('0')) {
          number = '62' + number.substring(1);
        } else if (number.startsWith('+62')) {
          number = number.substring(1);
        }
      }
      
      // Validasi nomor
      if (!number.match(/^62\d{9,12}$/)) {
        console.log(chalk.red('Nomor tidak valid! Format harus 62xxxx'));
        return;
      }
      
      const jid = number + '@s.whatsapp.net';
      
      console.log(chalk.cyan('╭──────────────────────────────────────···'));
      console.log(chalk.cyan('│ 🖼️ MENGIRIM GAMBAR KE:'));
      console.log(chalk.cyan('├──────────────────────────────────────···'));
      console.log(chalk.cyan(`│ 📞 Nomor: ${number}`));
      console.log(chalk.cyan(`│ 🌐 URL Gambar: ${imageUrl}`));
      console.log(chalk.cyan(`│ 💬 Caption: ${caption}`));
      console.log(chalk.cyan('╰──────────────────────────────────────···'));
      
      // Kirim gambar dengan context info
      await conn.sendMessage(jid, {
        image: { url: imageUrl },
        caption: caption,
        contextInfo: contextInfoConfig
      });
      
      console.log(chalk.green('✅ Gambar berhasil dikirim!'));
      
    } else if (command === 'gitpull' || command === 'update') {
      // Fitur git pull
      const result = await gitPull();
      if (result.success) {
        console.log(chalk.yellow('💡 Ketik "restart" untuk menerapkan update'));
      }
      
    } else if (command === 'restart') {
      // Restart bot
      console.log(chalk.yellow('🔄 Restarting bot...'));
      if (panelInterface) {
        panelInterface.close();
      }
      setTimeout(() => {
        process.exit(0);
      }, 2000);
      
    } else if (command === 'help' || command === '?') {
      console.log(chalk.cyan('╭──────────────────────────────────────···'));
      console.log(chalk.cyan('│ 🛠️ PANEL COMMANDS:'));
      console.log(chalk.cyan('├──────────────────────────────────────···'));
      console.log(chalk.cyan('│ message <nomor> <pesan>'));
      console.log(chalk.cyan('│   - Kirim pesan teks ke satu nomor'));
      console.log(chalk.cyan('│ image <nomor> <url> <caption>'));
      console.log(chalk.cyan('│   - Kirim gambar ke satu nomor'));
      console.log(chalk.cyan('│ broadcast <nomor1,nomor2> <pesan>'));
      console.log(chalk.cyan('│   - Kirim pesan ke banyak nomor'));
      console.log(chalk.cyan('│ gitpull / update'));
      console.log(chalk.cyan('│   - Update bot dari GitHub'));
      console.log(chalk.cyan('│ restart'));
      console.log(chalk.cyan('│   - Restart bot'));
      console.log(chalk.cyan('│ help - Tampilkan bantuan ini'));
      console.log(chalk.cyan('│ exit - Keluar dari bot'));
      console.log(chalk.cyan('╰──────────────────────────────────────···'));
      
    } else if (command === 'exit' || command === 'quit') {
      console.log(chalk.yellow('👋 Keluar dari bot...'));
      if (panelInterface) {
        panelInterface.close();
      }
      process.exit(0);
      
    } else {
      console.log(chalk.red('❌ Command tidak dikenali! Ketik "help" untuk bantuan'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Error:', error.message));
  }
}

async function startServer() {
  const child = async () => {
    process.on("unhandledRejection", (err) => console.error(err));
    const { state, saveCreds } = await useMultiFileAuthState("./" + sessionName);
    
    // Perbaikan: Pastikan msgRetryCounterCache didefinisikan
    const msgRetryCounterCache = new NodeCache();
    
    const conn = makeWASocket({
      printQRInTerminal: !pairingCode,
      logger: pino({
        level: "silent",
      }),
      browser: ["Linux", "Chrome", "20.0.00"],
      auth: state,
      msgRetryCounterCache, // Sekarang sudah terdefinisi
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
    });
    
    global.conn = conn;

    conn.ev.on("creds.update", saveCreds);

    if (!conn.authState.creds.registered) {
      console.log(chalk.cyan("╭──────────────────────────────────────···"));
      console.log(`📨 ${chalk.redBright("Please type your WhatsApp number")}:`);
      console.log(chalk.cyan("├──────────────────────────────────────···"));
      
      // Buat interface sementara untuk pairing
      const tempRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const question = (text) => new Promise((resolve) => tempRl.question(text, resolve));
      
      let phoneNumber = await question(`   ${chalk.cyan("- Number")}: `);
      console.log(chalk.cyan("╰──────────────────────────────────────···"));
      phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

      setTimeout(async () => {
        let code = await conn.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.cyan("╭──────────────────────────────────────···"));
        console.log(` 💻 ${chalk.redBright("Your Pairing Code")}:`);
        console.log(chalk.cyan("├──────────────────────────────────────···"));
        console.log(`   ${chalk.cyan("- Code")}: ${code}`);
        console.log(chalk.cyan("╰──────────────────────────────────────···"));
        tempRl.close();
      }, 3000);
    }

    conn.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        let m = chatUpdate.messages[0];
        if (!m.message) return;
        m.message =
          Object.keys(m.message)[0] === "ephemeralMessage"
            ? m.message.ephemeralMessage.message
            : m.message;
        if (m.key && m.key.remoteJid === "status@broadcast") return;
        if (!conn.public && !m.key.fromMe && chatUpdate.type === "notify")
          return;
        if (m.key.id.startsWith("BAE5") && m.key.id.length === 16) return;
        m = smsg(conn, m);
        handleMessage(conn, m, chatUpdate);
      } catch (err) {
        console.error(chalk.red('[ERROR] Gagal memproses pesan:'), err);
      }
    });

    conn.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user && decode.server && decode.user + "@" + decode.server) ||
          jid
        );
      } else return jid;
    };

    conn.public = mode;
    conn.serializeM = (m) => smsg(conn, m);

    conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log('Koneksi terputus dengan alasan:', DisconnectReason[reason]);
        if (reason === DisconnectReason.loggedOut) {
          console.log("❌ Sesi invalid, hapus folder session dan scan ulang");
          process.exit();
        } else {
          console.log("⚠️ Koneksi terputus, mencoba reconnect...");
          child();
        }
      } else if (connection === "open") {
        console.log(chalk.black(chalk.bgWhite("✅ Berhasil Terhubung....")));
        
        // Hanya buat panel interface sekali saja
        if (!panelInterface) {
          console.log('\n' + chalk.cyan('╭──────────────────────────────────────···'));
          console.log(chalk.cyan('│ 🎮 PANEL CONTROL READY'));
          console.log(chalk.cyan('│ Ketik "help" untuk melihat commands'));
          console.log(chalk.cyan('╰──────────────────────────────────────···\n'));
          
          // Buat panel interface dengan konfigurasi yang benar
          panelInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.yellow('PANEL> '),
            terminal: true
          });
          
          panelInterface.prompt();
          
          panelInterface.on('line', async (input) => {
            if (input.trim()) {
              await handlePanelCommand(input, conn);
            }
            panelInterface.prompt();
          });
          
          panelInterface.on('close', () => {
            console.log(chalk.yellow('\n👋 Panel ditutup, bot tetap berjalan...'));
            panelInterface = null;
          });
        }
      }
    });
    
    conn.sendButton = async (jid, text, footer, btnklick, image1, image2, buttons, quoted, options) => {
    const message = {
        footer: footer,
        headerType: 1,
        viewOnce: true,
        image: { url: image1 },
        caption: text,
        buttons: [
            {
                buttonId: 'action',
                buttonText: { displayText: 'Pilih Opsi' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: btnklick,
                        sections: [
                            {
                                title: 'MENU UTAMA',
                                rows: buttons.map(btn => ({
                                    title: btn.title,
                                    description: btn.description || '',
                                    id: btn.id
                                }))
                            }
                        ]
                    })
                }
            }
        ],
        contextInfo: contextInfoConfig,
        ...options
    };

    return await conn.sendMessage(jid, message, { quoted });
    };

    conn.downloadAndSaveMediaMessage = async (
      message,
      filename,
      attachExtension = true
    ) => {
      let quoted = message.msg ? message.msg : message;
      let mime = (message.msg || message).mimetype || "";
      let messageType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      let type = await fileTypeFromBuffer(buffer);
      let trueFileName = attachExtension ? filename + "." + type.ext : filename;
      await fs.writeFileSync(trueFileName, buffer);
      return trueFileName;
    };

    conn.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || "";
      let messageType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mime.split("/")[0];
      const stream = await downloadContentFromMessage(message, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    };

    conn.sendText = (jid, teks, quoted = "", options) => {
      return conn.sendMessage(
        jid,
        {
          text: teks,
          contextInfo: contextInfoConfig,
          ...options,
        },
        {
          quoted,
          ...options,
        }
      );
    };

    conn.sendImage = async (jid, path, caption = "", quoted = "", options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(`,`)[1], "base64") : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
      return await conn.sendMessage(
        jid,
        {
          image: buffer,
          caption: caption,
          jpegThumbnail: "",
          contextInfo: contextInfoConfig,
          ...options,
        },
        {
          quoted,
        }
      );
    };

    conn.sendVideo = async (
      jid,
      path,
      caption = "",
      quoted = "",
      gif = false,
      options
    ) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(`,`)[1], "base64") : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
      return await conn.sendMessage(
        jid,
        {
          video: buffer,
          caption: caption,
          gifPlayback: gif,
          jpegThumbnail: "",
          contextInfo: contextInfoConfig,
          ...options,
        },
        {
          quoted,
        }
      );
    };

    conn.sendAudio = async (jid, path, quoted = "", ptt = false, options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(`,`)[1], "base64") : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
      return await conn.sendMessage(
        jid,
        {
          audio: buffer,
          ptt: ptt,
          contextInfo: contextInfoConfig,
          ...options,
        },
        {
          quoted,
        }
      );
    };

    return conn;
  };
  child().catch((err) => console.log(err));
}

startServer();

let file = fileURLToPath(import.meta.url);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(` ~> File updated: ${file}`);
    import(`${file}`);
});
