/*

 * Thank you dev and friends
 * Fauzialifatah ( me )
 * Arifzyn 
 * Kiur
 
 */

import "../source/events/database.js";
import "../settings/config.js";
import {
  BufferJSON,
  WA_DEFAULT_EPHEMERAL,
  generateWAMessageFromContent,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  getContentType,
} from "@whiskeysockets/baileys";
import fs from "fs";
import util from "util";
import chalk from "chalk";
import { exec } from "child_process";
import axios from "axios";
import syntaxerror from "syntax-error";
import { fileURLToPath } from 'url';
import path from "path"
import os from "os";
import jimp from "jimp";
import speed from 'performance-now';
import {
  generateProfilePicture,
  getBuffer,
  fetchJson,
  fetchText,
  getRandom,
  getGroupAdmins,
  runtime,
  sleep,
  makeid,
} from "../source/myfunc.js";
import { qtext } from '../source/quoted.js';
import { runPlugins } from '../handler.js';
import { leveluser } from '../source/events/_levelup.js';

let prefix = ".";
let mode = true;

// Helper functions untuk JSON
function loadJSON(file) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file));
        }
        return {};
    } catch (error) {
        console.log('Error loading JSON:', error);
        return {};
    }
}

function saveJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.log('Error saving JSON:', error);
        return false;
    }
}

// Data untuk sistem baru
const fishingSpots = loadJSON('./database/fishing_spots.json');
const baitData = loadJSON('./database/bait_data.json');
const huntingSpots = loadJSON('./database/hunting_spots.json');
const jobs = loadJSON('./database/jobs.json');
const animals = loadJSON('./database/animals.json');
const cryptoData = loadJSON('./database/crypto.json');
const stocks = loadJSON('./database/stocks.json');
const businesses = loadJSON('./database/businesses.json');
const locations = loadJSON('./database/locations.json');
const items = loadJSON('./database/items.json');

// Active sessions
const activeFishing = new Map();
const activeHunting = new Map();
const activeExploration = new Map();

function getRandomFish(spot, bait = 'cacing') {
    const fishData = loadJSON('./database/ikan.json');
    const spotData = fishingSpots[spot];
    const baitMultiplier = baitData[bait]?.effectiveness || 1.0;
    
    let rarityWeights = {
        'common': spotData.commonFish,
        'rare': spotData.rareFish * baitMultiplier,
        'legendary': spotData.legendaryFish * baitMultiplier,
        'mythic': (spotData.mythicFish || 0) * baitMultiplier
    };
    
    let totalWeight = 0;
    fishData.forEach(fish => {
        totalWeight += rarityWeights[fish.rarity] || 1;
    });
    
    let random = Math.random() * totalWeight;
    
    for (let fish of fishData) {
        const weight = rarityWeights[fish.rarity] || 1;
        if (random < weight) {
            const weightRange = fish.berat_max - fish.berat_min;
            const fishWeight = (Math.random() * weightRange + fish.berat_min).toFixed(2);
            
            return {
                ...fish,
                weight: fishWeight,
                value: Math.floor(fish.harga * (baitData[bait]?.rarityBonus || 1.0))
            };
        }
        random -= weight;
    }
    return fishData[0];
}

function getRandomAnimal(spot) {
    const spotAnimals = huntingSpots[spot].animals;
    const animal = spotAnimals[Math.floor(Math.random() * spotAnimals.length)];
    return {
        name: animal,
        value: animals[animal]?.value || 2000,
        meat: animals[animal]?.meat || 1
    };
}

function createFishingAnimation(position, progress, fishPosition) {
    const barLength = 20;
    const filled = Math.floor((progress / 100) * barLength);
    const empty = barLength - filled;
    
    // Buat bar dengan | di tengah
    let leftBar = '='.repeat(Math.max(0, filled - 1));
    let rightBar = '='.repeat(Math.max(0, empty - 1));
    let bar = leftBar + '|' + rightBar;
    
    // Place fish in the bar
    let fishBar = bar.split('');
    if (fishPosition >= 0 && fishPosition < barLength) {
        fishBar[fishPosition] = '🐟';
    }
    bar = fishBar.join('');
    
    return `🎣 *SEDANG MEMANCING* 🎣\n\n` +
           `📍 ${bar}\n\n` +
           `⚡ *Progress:* ${progress}%\n` +
           `🎯 *Posisi Ikan:* ${fishPosition + 1}/${barLength}\n\n` +
           `💡 *Ketik ← atau → untuk menggerakkan kail!*`;
}

// Fungsi untuk update crypto prices
function updateCryptoPrices() {
    const cryptos = loadJSON('./database/crypto.json');
    Object.keys(cryptos).forEach(code => {
        const change = (Math.random() - 0.5) * 0.4; // ±20%
        cryptos[code].price = Math.max(1, Math.floor(cryptos[code].price * (1 + change)));
        cryptos[code].trend = change > 0 ? 'naik' : 'turun';
    });
    saveJSON('./database/crypto.json', cryptos);
}

// Update setiap 10 menit
setInterval(updateCryptoPrices, 10 * 60 * 1000);

export default async (conn, m) => {
  loadDataBase(conn, m);
  try {
    const body = m.body || m.text || "";
    const budy = m.body || m.text || "";
    const command = body.startsWith(prefix) ? body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase() : "";
    const commands = command.replace(prefix, "");
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(" ");
    const text = q;
    const quoted = m.quoted ? m.quoted : m;
    const message = m;
    const messageType = m.mtype;
    const messageKey = message.key;
    const pushName = m.pushName || "Undefined";
    const example = (teks) => {
return `\n *Example Command :*\n *${prefix+command}* ${teks}\n`
}
    const itsMe = m.key.fromMe;
    const chat = m.chat;
    const sender = m.sender;
    const userId = sender.split("@")[0];
    const reply = m.reply;
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(chat) : '';
    const groupName = isGroup ? groupMetadata.subject : '';
    const groupId = isGroup ? groupMetadata.id : '';
    const groupMembers = isGroup ? groupMetadata.participants : '';
    const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : '';
    const isBotGroupAdmins = groupAdmins.includes(botNumber) || false;
    const isGroupAdmins = groupAdmins.includes(sender);

    // Handle fishing controls
    if (body === '←' || body === '→') {
        const userId = m.sender;
        const session = activeFishing.get(userId);
        
        if (!session) return;
        
        if (body === '←') {
            session.hookPosition = Math.max(0, session.hookPosition - 1);
        } else if (body === '→') {
            session.hookPosition = Math.min(19, session.hookPosition + 1);
        }
        
        // Update progress based on hook position
        if (session.hookPosition === session.fishPosition) {
            session.progress = Math.min(100, session.progress + 10);
        } else {
            session.progress = Math.max(0, session.progress - 5);
        }
        
        return m.reply(`🎣 Hook dipindah ke posisi ${session.hookPosition + 1}\n⚡ Progress: ${session.progress}%`);
    }

    if (body.startsWith("$")) {
      if (!itsMe) return;
      await m.reply("_Executing..._");
      exec(q, async (err, stdout) => {
        if (err) return m.reply(`${err}`);
        if (stdout) {
          await m.reply(`${stdout}`);
        }
      });
    }

    if (body.startsWith(">")) {
      if (!itsMe) return;
      try {
        const txtt = util.format(await eval(`(async()=>{ ${q} })()`));
        m.reply(txtt);
      } catch (e) {
        let _syntax = "";
        let _err = util.format(e);
        let err = syntaxerror(q, "EvalError", {
          allowReturnOutsideFunction: true,
          allowAwaitOutsideFunction: true,
          sourceType: "module",
        });
        if (err) _syntax = err + "\n\n";
        m.reply(util.format(_syntax + _err));
      }
    }

    if (body.startsWith("=>")) {
      if (!itsMe) return;
      try {
        const txtt = util.format(await eval(`(async()=>{ return ${q} })()`));
        m.reply(txtt);
      } catch (e) {
        let _syntax = "";
        let _err = util.format(e);
        let err = syntaxerror(q, "EvalError", {
          allowReturnOutsideFunction: true,
          allowAwaitOutsideFunction: true,
          sourceType: "module",
        });
        if (err) _syntax = err + "\n\n";
        m.reply(util.format(_syntax + _err));
      }
    }

    if (!mode) {
      if (!m.key.fromMe) return;
    }

    if (m.message) {
      console.log(chalk.bgMagenta(" [===>] "), chalk.cyanBright("Time: ") + chalk.greenBright(new Date()) + "\n", chalk.cyanBright("Message: ") + chalk.greenBright(budy || m.mtype) + "\n" + chalk.cyanBright("From:"), chalk.greenBright(pushName), chalk.yellow("- " + m.sender) + "\n" + chalk.cyanBright("Chat Type:"), chalk.greenBright(!m.isGroup ? "Private Chat" : "Group Chat - " + chalk.yellow(m.chat)));
    }

    if (!body.startsWith(prefix)) {
      return;
    }
    
    if (global.db && global.db.users && global.db.users[m.sender]) {
    const user = global.db.users[m.sender];
    const oldRole = user.role;
    user.command += 1;
    const newRole = leveluser(user.command).rank;
    if (oldRole !== newRole) {
        user.role = newRole;
        const upuser = `🎉 *LEVEL UP!* 🎉\n\n*Name:* ${pushName}\n*Old Level:* ${oldRole}\n*New Level:* ${newRole}\n\nKeep using bot to reach next level!`;
        
        conn.sendMessage(m.chat, { text: upuser }, { quoted: qtext });
    }
}

    const resize = async (imageUrl, width, height) => {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const read = await jimp.read(response.data);
  const data = await read.resize(width, height).getBufferAsync(jimp.MIME_JPEG);
  return data;
};

    const reaction = async (jid, emoji) => {
    conn.sendMessage(jid, { react: { text: emoji, key: m.key }}
        );
    };
   
    const plug = { conn, command, quoted, fetchJson, qtext, budy, commands, args, q, message, messageType, messageKey, pushName, itsMe, chat, sender, userId, reply, botNumber, isGroup, groupMetadata, groupName, groupId, groupMembers, groupAdmins, isBotGroupAdmins, isGroupAdmins, generateProfilePicture, getBuffer, fetchJson,fetchText, getRandom, runtime, sleep, makeid, prefix, reaction };

    const pluginHandled = await runPlugins(m, plug);
    if (pluginHandled) {
        return;
    }

    switch (commands) {

      // ==================== FISHING SYSTEM ====================
      case 'fishing': case 'fish': case 'mancing': {
    const userData = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!userData[userId] || !userData[userId].currentSpot) {
        return m.reply(`🎣 *PILIH SPOT MEMANCING* 🎣\n\n` +
                      `📍 *Available Spots:*\n` +
                      `• ${prefix}spots - Lihat semua spot\n` +
                      `• ${prefix}gotospot <nama_spot> - Pergi ke spot\n\n` +
                      `*Contoh:* ${prefix}gotospot sungai`);
    }
    
    const inventory = loadJSON('./database/inventory.json');
    if (!inventory[userId] || !inventory[userId].bait || inventory[userId].bait.length === 0) {
        return m.reply(`❌ *Kamu tidak punya umpan!*\n\n` +
                      `🛒 Beli umpan di shop:\n` +
                      `• ${prefix}shop - Lihat toko\n` +
                      `• ${prefix}buy <umpan> - Beli umpan`);
    }
    
    const cooldownFile = './database/cooldown.json';
    const cooldowns = loadJSON(cooldownFile);
    
    if (cooldowns[userId] && Date.now() - cooldowns[userId] < 30000) {
        const remaining = Math.ceil((30000 - (Date.now() - cooldowns[userId])) / 1000);
        return m.reply(`⏰ *Cooldown!* Tunggu ${remaining} detik lagi.`);
    }
    
    cooldowns[userId] = Date.now();
    saveJSON(cooldownFile, cooldowns);
    
    const spot = userData[userId].currentSpot;
    const bait = inventory[userId].bait[0];
    
    inventory[userId].bait.shift();
    saveJSON('./database/inventory.json', inventory);
    
    const fishingSession = {
        spot: spot,
        bait: bait,
        progress: 0,
        fishPosition: Math.floor(Math.random() * 20),
        hookPosition: 10,
        messageId: null,
        startTime: Date.now()
    };
    
    const animMessage = await conn.sendMessage(m.chat, { 
        text: createFishingAnimation(10, 0, fishingSession.fishPosition) 
    }, { quoted: m });
    
    fishingSession.messageId = animMessage.key.id;
    activeFishing.set(userId, fishingSession);
    
    const animateFishing = async () => {
        const session = activeFishing.get(userId);
        if (!session) return;
        
        if (Math.random() < 0.4) {
            session.fishPosition = Math.max(0, Math.min(19, session.fishPosition + (Math.random() < 0.5 ? 1 : -1)));
        }
        
        if (session.hookPosition === session.fishPosition) {
            session.progress = Math.min(100, session.progress + 8);
        } else {
            session.progress = Math.max(0, session.progress - 3);
        }
        
        try {
            await conn.sendMessage(m.chat, {
                text: createFishingAnimation(session.hookPosition, session.progress, session.fishPosition)
            }, { quoted: m });
        } catch (e) {
            console.log('Error updating message:', e);
        }
        
        if (session.progress >= 100) {
            activeFishing.delete(userId);
            
            const caughtFish = getRandomFish(spot, bait);
            const users = loadJSON('./database/users.json');
            const userInventory = loadJSON('./database/inventory.json');
            
            if (!userInventory[userId]) userInventory[userId] = { fish: [], bait: [], animals: [], items: [] };
            if (!userInventory[userId].fish) userInventory[userId].fish = [];
            
            userInventory[userId].fish.push(caughtFish);
            
            if (!users[userId]) users[userId] = { money: 0, fishCaught: 0, level: 1, exp: 0, energy: 100 };
            users[userId].fishCaught = (users[userId].fishCaught || 0) + 1;
            users[userId].exp = (users[userId].exp || 0) + 5;
            users[userId].energy = Math.max(0, (users[userId].energy || 100) - 10);
            
            saveJSON('./database/users.json', users);
            saveJSON('./database/inventory.json', userInventory);
            
            await conn.sendMessage(m.chat, {
                text: `🎉 *SELAMAT! ANDA DAPAT IKAN!* 🎉\n\n` +
                      `🐟 *${caughtFish.nama}*\n` +
                      `⚖️ Berat: ${caughtFish.weight}kg\n` +
                      `💰 Harga: Rp${caughtFish.value.toLocaleString()}\n` +
                      `⭐ Rarity: ${caughtFish.rarity}\n` +
                      `📍 ${caughtFish.deskripsi}\n\n` +
                      `⚡ Energy: ${users[userId].energy}/100`
            }, { quoted: m });
            
            return;
        }
        
        if (activeFishing.has(userId)) {
            setTimeout(animateFishing, 2000);
        }
    };
    
    setTimeout(animateFishing, 2000);
}
break;

case 'spots': case 'fishspots': {
    let spotsList = "🎣 *DAFTAR SPOT MEMANCING* 🎣\n━━━━━━━━━━━━━━━━━━━━\n\n";
    
    Object.entries(fishingSpots).forEach(([key, spot]) => {
        const difficulty = spot.difficulty === 'easy' ? '🟢 Mudah' : 
                          spot.difficulty === 'medium' ? '🟡 Medium' : '🔴 Sulit';
        
        spotsList += `📍 *${spot.name}*\n`;
        spotsList += `   🎯 Difficulty: ${difficulty}\n`;
        spotsList += `   ⭐ Common: ${spot.commonFish}% | Rare: ${spot.rareFish}%\n`;
        if (spot.legendaryFish) spotsList += `   💫 Legendary: ${spot.legendaryFish}%\n`;
        if (spot.mythicFish) spotsList += `   ✨ Mythic: ${spot.mythicFish}%\n`;
        spotsList += `   ⏱️ Travel: ${spot.travelTime / 1000} detik\n\n`;
    });
    
    spotsList += `💡 *Gunakan:* ${prefix}gotospot <nama_spot>\n*Contoh:* ${prefix}gotospot sungai`;
    
    m.reply(spotsList);
}
break;

case 'gotospot': {
    const spotName = args[0]?.toLowerCase();
    if (!spotName || !fishingSpots[spotName]) {
        return m.reply(`❌ *Spot tidak ditemukan!*\n\n` +
                      `📍 *Available Spots:*\n` +
                      `${Object.keys(fishingSpots).map(s => `• ${s}`).join('\n')}\n\n` +
                      `💡 *Contoh:* ${prefix}gotospot sungai`);
    }
    
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!users[userId]) users[userId] = { money: 0, fishCaught: 0, level: 1, exp: 0, energy: 100 };
    
    if (users[userId].energy < 5) {
        return m.reply(`❌ *Energy habis!*\n\n` +
                      `⚡ Energy kamu: ${users[userId].energy}/100\n` +
                      `💤 Istirahat dulu atau minum energy drink!`);
    }
    
    users[userId].energy = Math.max(0, users[userId].energy - 5);
    users[userId].currentSpot = spotName;
    saveJSON('./database/users.json', users);
    
    const spot = fishingSpots[spotName];
    
    let travelMsg = await m.reply(`🚶 *Berjalan ke ${spot.name}...*`);
    await sleep(spot.travelTime);
    
    await conn.sendMessage(m.chat, {
        text: `✅ *Berhasil sampai di ${spot.name}!*\n\n` +
              `🌊 Sekarang kamu bisa memancing di sini!\n` +
              `🎣 Gunakan: ${prefix}fish\n\n` +
              `⚡ Energy: ${users[userId].energy}/100`
    }, { quoted: m });
}
break;

      // ==================== WORK SYSTEM ====================
      case 'work': case 'kerja': {
    const jobName = args[0]?.toLowerCase();
    if (!jobName || !jobs[jobName]) {
        return m.reply(`💼 *DAFTAR PEKERJAAN* 💼\n\n` +
                      `${Object.entries(jobs).map(([key, job]) => 
                          `👨‍💼 *${job.name}*\n   💰 Rp${job.income.min.toLocaleString()} - Rp${job.income.max.toLocaleString()}\n   ⚡ Energy: ${job.energyCost} | ⏱️ ${job.time/1000}s\n   🛠️ ${prefix}work ${key}`
                      ).join('\n\n')}`);
    }
    
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!users[userId]) users[userId] = { money: 0, workCount: 0, level: 1, exp: 0, energy: 100 };
    
    const job = jobs[jobName];
    
    if (users[userId].energy < job.energyCost) {
        return m.reply(`❌ *Energy tidak cukup!*\n\n` +
                      `⚡ Diperlukan: ${job.energyCost} energy\n` +
                      `⚡ Energy kamu: ${users[userId].energy}/100\n\n` +
                      `💤 Istirahat dulu!`);
    }
    
    let workMsg = await m.reply(`💼 *Mulai bekerja sebagai ${job.name}...*`);
    await sleep(job.time);
    
    const income = Math.floor(Math.random() * (job.income.max - job.income.min + 1)) + job.income.min;
    
    users[userId].money = (users[userId].money || 0) + income;
    users[userId].workCount = (users[userId].workCount || 0) + 1;
    users[userId].exp = (users[userId].exp || 0) + 3;
    users[userId].energy = Math.max(0, users[userId].energy - job.energyCost);
    
    saveJSON('./database/users.json', users);
    
    await conn.sendMessage(m.chat, {
        text: `✅ *SELESAI BEKERJA!* ✅\n\n` +
              `👨‍💼 Pekerjaan: ${job.name}\n` +
              `💵 Gaji: Rp${income.toLocaleString()}\n` +
              `💰 Total uang: Rp${users[userId].money.toLocaleString()}\n` +
              `⚡ Energy: ${users[userId].energy}/100\n\n` +
              `📈 Pengalaman kerja: ${users[userId].workCount} kali`
    }, { quoted: m });
}
break;

      // ==================== HUNTING SYSTEM ====================
      case 'hunt': case 'berburu': case 'buru': {
    const spotName = args[0]?.toLowerCase();
    if (!spotName || !huntingSpots[spotName]) {
        return m.reply(`🎯 *DAFTAR SPOT BERBURU* 🎯\n\n` +
                      `${Object.entries(huntingSpots).map(([key, spot]) => 
                          `📍 *${spot.name}*\n   🎯 Success: ${spot.successRate}% | ⏱️ ${spot.travelTime/1000}s\n   🛒 ${prefix}hunt ${key}`
                      ).join('\n\n')}`);
    }
    
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!users[userId]) users[userId] = { money: 0, animalsCaught: 0, level: 1, exp: 0, energy: 100 };
    
    if (users[userId].energy < 15) {
        return m.reply(`❌ *Energy habis!*\n\n` +
                      `⚡ Energy: ${users[userId].energy}/100\n` +
                      `💤 Istirahat dulu!`);
    }
    
    const spot = huntingSpots[spotName];
    
    let huntMsg = await m.reply(`🎯 *Mulai berburu di ${spot.name}...*`);
    await sleep(spot.travelTime);
    
    const success = Math.random() * 100 < spot.successRate;
    const inventory = loadJSON('./database/inventory.json');
    
    if (success) {
        const animal = getRandomAnimal(spotName);
        
        if (!inventory[userId]) inventory[userId] = { fish: [], bait: [], animals: [], items: [] };
        if (!inventory[userId].animals) inventory[userId].animals = [];
        
        inventory[userId].animals.push(animal);
        
        users[userId].animalsCaught = (users[userId].animalsCaught || 0) + 1;
        users[userId].exp = (users[userId].exp || 0) + 8;
        users[userId].energy = Math.max(0, users[userId].energy - 15);
        
        saveJSON('./database/users.json', users);
        saveJSON('./database/inventory.json', inventory);
        
        await conn.sendMessage(m.chat, {
            text: `🎉 *BERBURU SUKSES!* 🎉\n\n` +
                  `🐾 *${animal.name.toUpperCase()}*\n` +
                  `💰 Nilai: Rp${animal.value.toLocaleString()}\n` +
                  `🥩 Daging: ${animal.meat} kg\n\n` +
                  `⚡ Energy: ${users[userId].energy}/100`
        }, { quoted: m });
    } else {
        users[userId].energy = Math.max(0, users[userId].energy - 10);
        saveJSON('./database/users.json', users);
        
        await conn.sendMessage(m.chat, {
            text: `❌ *BERBURU GAGAL!*\n\n` +
                  `🐾 Hewan lolos dari perburuan!\n` +
                  `💡 Coba lagi di spot yang berbeda\n\n` +
                  `⚡ Energy: ${users[userId].energy}/100`
        }, { quoted: m });
    }
}
break;

      // ==================== ECONOMY SYSTEM ====================
      case 'balance': case 'saldo': case 'uang': {
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    const userData = users[userId] || { money: 0, bank: 0 };
    
    const balance = `💰 *SALDO & KEKAYAAN* 💰\n\n` +
                   `👤 *${pushName}*\n\n` +
                   `💵 Uang Tunai: Rp${userData.money.toLocaleString()}\n` +
                   `🏦 Tabungan Bank: Rp${(userData.bank || 0).toLocaleString()}\n` +
                   `📊 Total Kekayaan: Rp${(userData.money + (userData.bank || 0)).toLocaleString()}\n\n` +
                   `💡 Gunakan:\n` +
                   `• ${prefix}bank simpan <jumlah> - Menabung\n` +
                   `• ${prefix}bank tarik <jumlah> - Tarik tunai`;
    
    m.reply(balance);
}
break;

case 'bank': {
    const action = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    
    if (!action || !['simpan', 'tarik'].includes(action) || !amount || amount <= 0) {
        return m.reply(`🏦 *SISTEM BANK* 🏦\n\n` +
                      `• ${prefix}bank simpan <jumlah> - Menabung\n` +
                      `• ${prefix}bank tarik <jumlah> - Tarik tunai\n\n` +
                      `💡 Contoh: ${prefix}bank simpan 1000`);
    }
    
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    const userData = users[userId] || { money: 0, bank: 0 };
    
    if (action === 'simpan') {
        if (userData.money < amount) {
            return m.reply(`❌ *Uang tunai tidak cukup!*\n\n` +
                          `💵 Uang tunai: Rp${userData.money.toLocaleString()}\n` +
                          `💳 Ingin menabung: Rp${amount.toLocaleString()}`);
        }
        
        userData.money -= amount;
        userData.bank = (userData.bank || 0) + amount;
        
        m.reply(`✅ *Berhasil menabung!*\n\n` +
                `💳 Ditabung: Rp${amount.toLocaleString()}\n` +
                `💵 Uang tunai: Rp${userData.money.toLocaleString()}\n` +
                `🏦 Tabungan: Rp${userData.bank.toLocaleString()}`);
    } else if (action === 'tarik') {
        if ((userData.bank || 0) < amount) {
            return m.reply(`❌ *Tabungan tidak cukup!*\n\n` +
                          `🏦 Tabungan: Rp${(userData.bank || 0).toLocaleString()}\n` +
                          `💳 Ingin tarik: Rp${amount.toLocaleString()}`);
        }
        
        userData.bank -= amount;
        userData.money += amount;
        
        m.reply(`✅ *Berhasil menarik uang!*\n\n` +
                `💵 Ditarik: Rp${amount.toLocaleString()}\n` +
                `💵 Uang tunai: Rp${userData.money.toLocaleString()}\n` +
                `🏦 Tabungan: Rp${userData.bank.toLocaleString()}`);
    }
    
    saveJSON('./database/users.json', users);
}
break;

case 'transfer': {
    if (!m.mentionedJid || m.mentionedJid.length === 0) {
        return m.reply(`💸 *TRANSFER UANG* 💸\n\n` +
                      `Format: ${prefix}transfer @user <jumlah>\n` +
                      `Contoh: ${prefix}transfer @${userId} 1000`);
    }
    
    const targetUser = m.mentionedJid[0];
    const amount = parseInt(args[args.length - 1]);
    
    if (!amount || amount <= 0) {
        return m.reply(`❌ *Jumlah tidak valid!*`);
    }
    
    if (targetUser === m.sender) {
        return m.reply(`❌ *Tidak bisa transfer ke diri sendiri!*`);
    }
    
    const users = loadJSON('./database/users.json');
    const senderData = users[m.sender] || { money: 0 };
    const targetData = users[targetUser] || { money: 0 };
    
    if (senderData.money < amount) {
        return m.reply(`❌ *Uang tidak cukup!*\n\n` +
                      `💵 Uang kamu: Rp${senderData.money.toLocaleString()}\n` +
                      `💸 Ingin transfer: Rp${amount.toLocaleString()}`);
    }
    
    senderData.money -= amount;
    targetData.money = (targetData.money || 0) + amount;
    
    saveJSON('./database/users.json', users);
    
    const targetName = targetUser.split('@')[0];
    m.reply(`✅ *Transfer berhasil!*\n\n` +
            `👤 Kepada: ${targetName}\n` +
            `💸 Jumlah: Rp${amount.toLocaleString()}\n` +
            `💵 Sisa uang: Rp${senderData.money.toLocaleString()}`);
}
break;

      // ==================== CRYPTO SYSTEM ====================
      case 'crypto': case 'kripto': {
    const cryptos = loadJSON('./database/crypto.json');
    
    let cryptoList = "💰 *MARKET CRYPTO* 💰\n\n";
    
    Object.entries(cryptos).forEach(([code, crypto]) => {
        const trend = crypto.trend === 'naik' ? '📈' : '📉';
        cryptoList += `${trend} *${crypto.name} (${code})*\n`;
        cryptoList += `   💵 Harga: Rp${crypto.price.toLocaleString()}\n`;
        cryptoList += `   📊 Tren: ${crypto.trend}\n`;
        cryptoList += `   🛒 ${prefix}belicrypto ${code} <jumlah>\n\n`;
    });
    
    cryptoList += `💡 *Command Crypto:*\n` +
                  `• ${prefix}belicrypto <kode> <jumlah>\n` +
                  `• ${prefix}jualcrypto <kode> <jumlah>\n` +
                  `• ${prefix}portofolio\n` +
                  `• ${prefix}grafik <kode>`;
    
    m.reply(cryptoList);
}
break;

case 'belicrypto': {
    const code = args[0]?.toUpperCase();
    const amount = parseInt(args[1]);
    
    if (!code || !amount || amount <= 0) {
        return m.reply(`💰 *BELI CRYPTO* 💰\n\n` +
                      `Format: ${prefix}belicrypto <kode> <jumlah>\n` +
                      `Contoh: ${prefix}belicrypto DRVN 10\n\n` +
                      `💡 Gunakan ${prefix}crypto untuk lihat daftar`);
    }
    
    const cryptos = loadJSON('./database/crypto.json');
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!cryptos[code]) {
        return m.reply(`❌ *Kode crypto tidak ditemukan!*`);
    }
    
    const crypto = cryptos[code];
    const totalCost = crypto.price * amount;
    const userData = users[userId] || { money: 0, crypto: {} };
    
    if (userData.money < totalCost) {
        return m.reply(`❌ *Uang tidak cukup!*\n\n` +
                      `💵 Uang kamu: Rp${userData.money.toLocaleString()}\n` +
                      `💳 Diperlukan: Rp${totalCost.toLocaleString()}`);
    }
    
    userData.money -= totalCost;
    if (!userData.crypto) userData.crypto = {};
    userData.crypto[code] = (userData.crypto[code] || 0) + amount;
    
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Berhasil beli crypto!*\n\n` +
            `💰 ${crypto.name} (${code})\n` +
            `📊 Jumlah: ${amount} coin\n` +
            `💵 Total: Rp${totalCost.toLocaleString()}\n` +
            `💸 Sisa uang: Rp${userData.money.toLocaleString()}`);
}
break;

case 'portofolio': case 'porto': {
    const users = loadJSON('./database/users.json');
    const cryptos = loadJSON('./database/crypto.json');
    const userId = m.sender;
    const userData = users[userId] || { crypto: {} };
    
    if (!userData.crypto || Object.keys(userData.crypto).length === 0) {
        return m.reply(`📊 *Portofolio Crypto Kosong!*\n\n` +
                      `💡 Beli crypto dulu: ${prefix}crypto`);
    }
    
    let portfolio = "📊 *PORTOFOLIO CRYPTO* 📊\n\n";
    let totalValue = 0;
    
    Object.entries(userData.crypto).forEach(([code, amount]) => {
        const crypto = cryptos[code];
        if (crypto) {
            const value = crypto.price * amount;
            totalValue += value;
            portfolio += `💰 *${crypto.name} (${code})*\n`;
            portfolio += `   📈 Jumlah: ${amount} coin\n`;
            portfolio += `   💵 Nilai: Rp${value.toLocaleString()}\n`;
            portfolio += `   🛒 ${prefix}jualcrypto ${code} <jumlah>\n\n`;
        }
    });
    
    portfolio += `💎 *Total Nilai Portofolio:* Rp${totalValue.toLocaleString()}`;
    
    m.reply(portfolio);
}
break;

      // ==================== BUSINESS SYSTEM ====================
      case 'bisnis': case 'usaha': {
    const businesses = loadJSON('./database/businesses.json');
    
    let bizList = "🏢 *DAFTAR BISNIS* 🏢\n\n";
    
    Object.entries(businesses).forEach(([key, biz]) => {
        bizList += `🏪 *${biz.name}*\n`;
        bizList += `   💰 Harga: Rp${biz.price.toLocaleString()}\n`;
        bizList += `   📈 Profit/jam: Rp${biz.profit.toLocaleString()}\n`;
        bizList += `   ⚡ Level: ${biz.level}\n`;
        bizList += `   🛒 ${prefix}bukausaha ${key}\n\n`;
    });
    
    m.reply(bizList);
}
break;

case 'bukausaha': {
    const bizType = args[0]?.toLowerCase();
    if (!bizType || !businesses[bizType]) {
        return m.reply(`🏢 *BUKA USAHA* 🏢\n\n` +
                      `Format: ${prefix}bukausaha <jenis>\n\n` +
                      `💡 Gunakan ${prefix}bisnis untuk lihat daftar`);
    }
    
    const biz = businesses[bizType];
    const users = loadJSON('./database/users.json');
    const userBiz = loadJSON('./database/user_business.json');
    const userId = m.sender;
    const userData = users[userId] || { money: 0 };
    
    if (userData.money < biz.price) {
        return m.reply(`❌ *Uang tidak cukup!*\n\n` +
                      `💵 Uang kamu: Rp${userData.money.toLocaleString()}\n` +
                      `🏢 Diperlukan: Rp${biz.price.toLocaleString()}`);
    }
    
    if (!userBiz[userId]) userBiz[userId] = {};
    if (userBiz[userId][bizType]) {
        return m.reply(`❌ *Kamu sudah punya bisnis ${biz.name}!*`);
    }
    
    userData.money -= biz.price;
    userBiz[userId][bizType] = {
        name: biz.name,
        level: 1,
        profit: biz.profit,
        lastCollection: Date.now()
    };
    
    saveJSON('./database/users.json', users);
    saveJSON('./database/user_business.json', userBiz);
    
    m.reply(`✅ *Berhasil buka usaha!*\n\n` +
            `🏢 ${biz.name}\n` +
            `💰 Harga: Rp${biz.price.toLocaleString()}\n` +
            `📈 Profit/jam: Rp${biz.profit.toLocaleString()}\n` +
            `💵 Sisa uang: Rp${userData.money.toLocaleString()}\n\n` +
            `💡 Gunakan ${prefix}tarikhasil untuk ambil profit`);
}
break;

      // ==================== RPG SYSTEM ====================
      case 'profil': case 'profile': {
    const users = loadJSON('./database/users.json');
    const stats = loadJSON('./database/stats.json');
    const userId = m.sender;
    
    const userData = users[userId] || { money: 0, level: 1, exp: 0, energy: 100 };
    const userStats = stats[userId] || { 
        hp: 100, 
        stamina: 50, 
        attack: 10, 
        defense: 5,
        job: 'pengembara'
    };
    
    const profile = `👤 *PROFIL RPG* 👤\n\n` +
                   `🎯 *${pushName}*\n\n` +
                   `📊 *STATISTIK DASAR:*\n` +
                   `❤️ HP: ${userStats.hp}/100\n` +
                   `⚡ Stamina: ${userStats.stamina}/50\n` +
                   `⚔️ Attack: ${userStats.attack}\n` +
                   `🛡️ Defense: ${userStats.defense}\n` +
                   `💼 Job: ${userStats.job}\n\n` +
                   `💰 *EKONOMI:*\n` +
                   `💵 Uang: Rp${userData.money.toLocaleString()}\n` +
                   `⭐ Level: ${userData.level}\n` +
                   `🔮 EXP: ${userData.exp}/100\n` +
                   `⚡ Energy: ${userData.energy}/100`;
    
    m.reply(profile);
}
break;

case 'latih': case 'train': {
    const users = loadJSON('./database/users.json');
    const stats = loadJSON('./database/stats.json');
    const userId = m.sender;
    
    const userData = users[userId] || { money: 0, level: 1, exp: 0 };
    const userStats = stats[userId] || { stamina: 50 };
    
    if (userStats.stamina < 10) {
        return m.reply(`❌ *Stamina tidak cukup!*\n\n` +
                      `⚡ Stamina: ${userStats.stamina}/50\n` +
                      `💤 Istirahat dulu!`);
    }
    
    const expGain = Math.floor(Math.random() * 15) + 5;
    userData.exp = Math.min(100, (userData.exp || 0) + expGain);
    userStats.stamina = Math.max(0, userStats.stamina - 10);
    
    // Level up check
    if (userData.exp >= 100) {
        userData.level = (userData.level || 1) + 1;
        userData.exp = 0;
        userStats.attack += 2;
        userStats.defense += 1;
        userStats.hp = 100;
        
        m.reply(`🎉 *LEVEL UP!* 🎉\n\n` +
                `⭐ Level ${userData.level}!\n` +
                `⚔️ Attack +2\n` +
                `🛡️ Defense +1\n` +
                `❤️ HP dipulihkan!`);
    } else {
        m.reply(`💪 *Latihan selesai!*\n\n` +
                `⭐ EXP +${expGain}\n` +
                `📊 EXP: ${userData.exp}/100\n` +
                `⚡ Stamina: ${userStats.stamina}/50`);
    }
    
    saveJSON('./database/users.json', users);
    saveJSON('./database/stats.json', stats);
}
break;

      // ==================== EXPLORATION SYSTEM ====================
      case 'jelajah': case 'explore': {
    const locationName = args[0]?.toLowerCase();
    if (!locationName || !locations[locationName]) {
        return m.reply(`🗺️ *DAFTAR LOKASI* 🗺️\n\n` +
                      `${Object.entries(locations).map(([key, loc]) => 
                          `📍 *${loc.name}*\n   🎯 Level: ${loc.level} | ⚡ Energy: ${loc.energyCost}\n   🛒 ${prefix}jelajah ${key}`
                      ).join('\n\n')}`);
    }
    
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    const userData = users[userId] || { energy: 100 };
    const location = locations[locationName];
    
    if (userData.energy < location.energyCost) {
        return m.reply(`❌ *Energy tidak cukup!*\n\n` +
                      `⚡ Diperlukan: ${location.energyCost} energy\n` +
                      `⚡ Energy kamu: ${userData.energy}/100`);
    }
    
    let exploreMsg = await m.reply(`🗺️ *Mulai menjelajahi ${location.name}...*`);
    await sleep(3000);
    
    const results = [];
    const events = ['enemy', 'material', 'trader', 'treasure', 'trap'];
    const event = events[Math.floor(Math.random() * events.length)];
    
    userData.energy = Math.max(0, userData.energy - location.energyCost);
    
    switch (event) {
        case 'enemy':
            const enemies = ['Goblin', 'Bandit', 'Serigala', 'Orc'];
            const enemy = enemies[Math.floor(Math.random() * enemies.length)];
            results.push(`🐺 *Bertemu ${enemy}!*`);
            results.push(`💡 Gunakan ${prefix}lawannpc untuk bertarung`);
            break;
            
        case 'material':
            const materials = ['Kayu Oak', 'Batu Permata', 'Besi Mentah', 'Herbal'];
            const material = materials[Math.floor(Math.random() * materials.length)];
            results.push(`🪵 *Menemukan ${material}!*`);
            // Add to inventory
            const inventory = loadJSON('./database/inventory.json');
            if (!inventory[userId]) inventory[userId] = { items: [] };
            if (!inventory[userId].items) inventory[userId].items = [];
            inventory[userId].items.push(material);
            saveJSON('./database/inventory.json', inventory);
            break;
            
        case 'treasure':
            const treasure = Math.floor(Math.random() * 5000) + 1000;
            userData.money = (userData.money || 0) + treasure;
            results.push(`💎 *Menemukan harta karun!*`);
            results.push(`💰 Dapat: Rp${treasure.toLocaleString()}`);
            break;
            
        case 'trap':
            const damage = Math.floor(Math.random() * 20) + 10;
            const stats = loadJSON('./database/stats.json');
            const userStats = stats[userId] || { hp: 100 };
            userStats.hp = Math.max(0, userStats.hp - damage);
            results.push(`💥 *Terjebak!*`);
            results.push(`❤️ HP -${damage}`);
            saveJSON('./database/stats.json', stats);
            break;
    }
    
    saveJSON('./database/users.json', users);
    
    await conn.sendMessage(m.chat, {
        text: `🗺️ *HASIL PENJELAJAHAN* 🗺️\n\n` +
              `${results.join('\n')}\n\n` +
              `⚡ Energy: ${userData.energy}/100`
    }, { quoted: m });
}
break;

      // ==================== INVENTORY SYSTEM ====================
      case 'inventory': case 'inv': case 'tas': {
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    if (!inventory[userId] || (
        (!inventory[userId].fish || inventory[userId].fish.length === 0) &&
        (!inventory[userId].bait || inventory[userId].bait.length === 0) &&
        (!inventory[userId].animals || inventory[userId].animals.length === 0) &&
        (!inventory[userId].items || inventory[userId].items.length === 0)
    )) {
        return m.reply("📭 *Inventory kosong!*\n\n" +
                      "🎣 Ayo mulai berpetualang!\n" +
                      "• " + prefix + "fish - Memancing\n" +
                      "• " + prefix + "hunt - Berburu\n" +
                      "• " + prefix + "work - Bekerja");
    }
    
    let invList = "🎒 *INVENTORY* 🎒\n━━━━━━━━━━━━━━━━━━\n\n";
    let totalValue = 0;
    
    // Fish
    if (inventory[userId].fish && inventory[userId].fish.length > 0) {
        invList += "🐟 *IKAN:*\n";
        const fishCount = {};
        inventory[userId].fish.forEach(fish => {
            fishCount[fish.nama] = (fishCount[fish.nama] || 0) + 1;
            totalValue += fish.value || fish.harga;
        });
        
        Object.entries(fishCount).forEach(([name, count], index) => {
            invList += `   ${index + 1}. ${name} (${count}x)\n`;
        });
        invList += "\n";
    }
    
    // Animals
    if (inventory[userId].animals && inventory[userId].animals.length > 0) {
        invList += "🐾 *HEWAN BURUAN:*\n";
        const animalCount = {};
        inventory[userId].animals.forEach(animal => {
            animalCount[animal.name] = (animalCount[animal.name] || 0) + 1;
            totalValue += animal.value;
        });
        
        Object.entries(animalCount).forEach(([name, count], index) => {
            invList += `   ${index + 1}. ${name} (${count}x)\n`;
        });
        invList += "\n";
    }
    
    // Bait
    if (inventory[userId].bait && inventory[userId].bait.length > 0) {
        invList += "🪱 *UMPAN:*\n";
        const baitCount = {};
        inventory[userId].bait.forEach(bait => {
            baitCount[bait] = (baitCount[bait] || 0) + 1;
        });
        
        Object.entries(baitCount).forEach(([name, count], index) => {
            const baitName = baitData[name]?.name || name;
            invList += `   ${index + 1}. ${baitName} (${count}x)\n`;
        });
        invList += "\n";
    }
    
    // Items
    if (inventory[userId].items && inventory[userId].items.length > 0) {
        invList += "🎁 *ITEM:*\n";
        const itemCount = {};
        inventory[userId].items.forEach(item => {
            itemCount[item] = (itemCount[item] || 0) + 1;
        });
        
        Object.entries(itemCount).forEach(([name, count], index) => {
            invList += `   ${index + 1}. ${name} (${count}x)\n`;
        });
        invList += "\n";
    }
    
    invList += `💰 *Total Nilai:* Rp${totalValue.toLocaleString()}\n\n`;
    invList += `💡 *Jual semua:* ${prefix}sellall\n`;
    invList += `🎣 *Jual ikan:* ${prefix}sellfish\n`;
    invList += `🐾 *Jual hewan:* ${prefix}sellanimals`;
    
    m.reply(invList);
}
break;

case 'sellall': case 'jualall': {
    const inventory = loadJSON('./database/inventory.json');
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!inventory[userId] || (
        (!inventory[userId].fish || inventory[userId].fish.length === 0) &&
        (!inventory[userId].animals || inventory[userId].animals.length === 0)
    )) {
        return m.reply("❌ *Tidak ada yang bisa dijual!*");
    }
    
    let totalEarned = 0;
    let itemsSold = 0;
    
    // Sell fish
    if (inventory[userId].fish) {
        inventory[userId].fish.forEach(fish => {
            totalEarned += fish.value || fish.harga;
            itemsSold++;
        });
        inventory[userId].fish = [];
    }
    
    // Sell animals
    if (inventory[userId].animals) {
        inventory[userId].animals.forEach(animal => {
            totalEarned += animal.value;
            itemsSold++;
        });
        inventory[userId].animals = [];
    }
    
    // Update user money
    if (!users[userId]) users[userId] = { money: 0 };
    users[userId].money = (users[userId].money || 0) + totalEarned;
    
    saveJSON('./database/inventory.json', inventory);
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Berhasil menjual ${itemsSold} item!*\n\n` +
            `💰 Penghasilan: *Rp${totalEarned.toLocaleString()}*\n` +
            `💵 Uang sekarang: *Rp${users[userId].money.toLocaleString()}*`);
}
break;

      // ==================== UTILITY COMMANDS ====================
      case 'energy': case 'energi': {
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!users[userId]) users[userId] = { money: 0, energy: 100 };
    
    const energy = users[userId].energy || 100;
    const maxEnergy = 100;
    
    const energyBar = '█'.repeat(Math.floor(energy / 10)) + '░'.repeat(10 - Math.floor(energy / 10));
    
    m.reply(`⚡ *ENERGY STATUS* ⚡\n\n` +
            `👤 ${pushName}\n` +
            `🔋 ${energyBar} ${energy}%\n\n` +
            `💤 Energy recover 10% setiap 5 menit\n` +
            `🥤 Beli energy drink: ${prefix}shop`);
}
break;

case 'rest': case 'istirahat': {
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!users[userId]) users[userId] = { money: 0, energy: 100 };
    
    const currentEnergy = users[userId].energy || 0;
    const recoverAmount = Math.min(50, 100 - currentEnergy);
    
    if (recoverAmount <= 0) {
        return m.reply("⚡ *Energy sudah penuh!*");
    }
    
    users[userId].energy = currentEnergy + recoverAmount;
    saveJSON('./database/users.json', users);
    
    m.reply(`💤 *Istirahat sebentar...*\n\n` +
            `⚡ Energy +${recoverAmount}%\n` +
            `🔋 Sekarang: ${users[userId].energy}%`);
}
break;

      // ==================== ADDITIONAL SYSTEMS ====================
      case 'top': case 'leaderboard': {
    const users = loadJSON('./database/users.json');
    
    const leaderboard = Object.entries(users)
        .filter(([_, user]) => user.money > 0)
        .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
        .slice(0, 10);
    
    let topList = "🏆 *LEADERBOARD KEKAYAAN* 🏆\n\n";
    
    leaderboard.forEach(([userId, user], index) => {
        const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▫️";
        const name = userId.split('@')[0];
        topList += `${rank} *${name}*\n`;
        topList += `   💰 Rp${(user.money || 0).toLocaleString()}\n\n`;
    });
    
    m.reply(topList);
}
break;

case 'tarikhasil': {
    const userBiz = loadJSON('./database/user_business.json');
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!userBiz[userId] || Object.keys(userBiz[userId]).length === 0) {
        return m.reply("❌ *Kamu tidak punya bisnis!*\n\n" +
                      "💡 Buka bisnis dulu: " + prefix + "bisnis");
    }
    
    let totalProfit = 0;
    const now = Date.now();
    
    Object.entries(userBiz[userId]).forEach(([bizType, biz]) => {
        const hoursPassed = Math.floor((now - (biz.lastCollection || now)) / (60 * 60 * 1000));
        const profit = hoursPassed * biz.profit;
        totalProfit += profit;
        biz.lastCollection = now;
    });
    
    if (totalProfit <= 0) {
        return m.reply("❌ *Belum ada profit yang bisa ditarik!*\n\n" +
                      "💡 Profit dihitung per jam, tunggu beberapa saat lagi");
    }
    
    users[userId].money = (users[userId].money || 0) + totalProfit;
    
    saveJSON('./database/users.json', users);
    saveJSON('./database/user_business.json', userBiz);
    
    m.reply(`✅ *Berhasil tarik profit!*\n\n` +
            `💰 Total: Rp${totalProfit.toLocaleString()}\n` +
            `💵 Uang sekarang: Rp${users[userId].money.toLocaleString()}`);
}
break;

case 'duel': {
    if (!m.mentionedJid || m.mentionedJid.length === 0) {
        return m.reply(`⚔️ *DUEL SYSTEM* ⚔️\n\n` +
                      `Format: ${prefix}duel @user\n` +
                      `Contoh: ${prefix}duel @${userId}`);
    }
    
    const targetUser = m.mentionedJid[0];
    if (targetUser === m.sender) {
        return m.reply("❌ *Tidak bisa duel diri sendiri!*");
    }
    
    const stats = loadJSON('./database/stats.json');
    const attackerStats = stats[m.sender] || { hp: 100, attack: 10, defense: 5 };
    const defenderStats = stats[targetUser] || { hp: 100, attack: 10, defense: 5 };
    
    // Hitung damage
    const damage = Math.max(1, attackerStats.attack - defenderStats.defense);
    defenderStats.hp = Math.max(0, defenderStats.hp - damage);
    
    let result = `⚔️ *HASIL DUEL* ⚔️\n\n`;
    result += `🗡️ ${pushName} menyerang!\n`;
    result += `💥 Damage: ${damage}\n`;
    result += `❤️ HP ${targetUser.split('@')[0]}: ${defenderStats.hp}/100\n\n`;
    
    if (defenderStats.hp <= 0) {
        result += `🎉 *${pushName} MENANG!*\n`;
        // Berikan reward
        const users = loadJSON('./database/users.json');
        users[m.sender].money = (users[m.sender].money || 0) + 1000;
        users[m.sender].exp = (users[m.sender].exp || 0) + 10;
        saveJSON('./database/users.json', users);
        result += `💰 Reward: Rp1.000 + 10 EXP`;
    } else {
        result += `🛡️ ${targetUser.split('@')[0]} masih bertahan!`;
    }
    
    saveJSON('./database/stats.json', stats);
    m.reply(result);
}
break;

      case "mode": {
        m.reply(`🤖 Bot Mode: ${conn.public ? "Public" : "Self"}`);
      }
      break;

      case 'test': {
  if (!args || args.length === 0) {
    return m.reply(`please fill this\nname:\nhobby:`);
  }

  const text = args.join(' ') || (m.quoted && m.quoted.text) || m.text || '';
  const nameMatch = text.match(/name\s*:\s*([^\n\r]+)/i);
  const hobbyMatch = text.match(/hobby\s*:\s*([^\n\r]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : null;
  const hobby = hobbyMatch ? hobbyMatch[1].trim() : null;

  if (!name || !hobby) {
    return m.reply(`Format incomplete. Example:\nname: Dravin\nhobby: Botting`);
  }

  const tests = loadTests();
  tests[m.sender] = { jid: m.sender, name, hobby, time: new Date().toISOString() };
  saveTests(tests);

  await m.reply(`thank you for testing\n\nname: ${name}\nhobby: ${hobby}`);
}
break;
      
      case "only": {
         let duh = body.slice(body.indexOf(commands) + commands.length).trim() || "return m"
           try {
                    let evaled = await eval(`(async () => { ${duh} })()`)
                    if (typeof evaled !== "string") evaled = util.inspect(evaled)
                    await m.reply(evaled)
                } catch (err) {
                    m.reply(String(err))
                }
                break
            }
      
      case 'hidetag': case 'tagall': {
        if (!isGroup) return m.reply("❌ *This command is for groups only!*");
        let teks = quoted.text ? quoted.text : q ? q : '';
        let mem = [];
        groupMembers.map(i => mem.push(i.id));
        conn.sendMessage(m.chat, { text: teks, mentions: mem }, { quoted: m });
      }
      break;

      case 'runtime': case 'rt': case 'ping': {
const startTime = Date.now();
function formatRuntime(ms) {
let seconds = Math.floor(ms / 1000);
let days = Math.floor(seconds / 86400);
seconds %= 86400;
let hours = Math.floor(seconds / 3600);
seconds %= 3600;
let minutes = Math.floor(seconds / 60);
seconds %= 60;
return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}
let timestamp = speed();
let latensi = speed() - timestamp;
// info VPS
let totalMem = os.totalmem();
let freeMem = os.freemem();
let usedMem = totalMem - freeMem;
let memUsage = (usedMem / totalMem) * 100;
// uptime server
let uptimeServer = formatRuntime(os.uptime() * 1000);
// waktu server sekarang
let serverTime = new Date().toLocaleString("id-ID", {
timeZone: "Asia/Jakarta",
hour12: false
});
let teks = `
🤖 *BOT INFORMATION* 🤖
━━━━━━━━━━━━━━━━━━
- *Bot Name :* ${global.botName || "undefined"}
- *Bot Runtime :* ${runtime(process.uptime())}
- *Response Speed :* ${latensi.toFixed(4)} _Second_ 
- *NodeJS Version :* ${process.version}

🖥️ *SERVER VPS INFORMATION* 🖥️
━━━━━━━━━━━━━━━━━━
- *OS Platform :* ${os.type()} (${os.arch()})
- *Total RAM :* ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB
- *Used :* ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsage.toFixed(2)}%)
- *Free :* ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB
- *Total Disk :* 199.9 GB
- *CPU Core :* ${os.cpus().length} Core
- *Load Avg :* ${(os.loadavg()[0] * 100 / os.cpus().length).toFixed(2)}%
- *VPS Uptime :* ${uptimeServer}
- *Server Time :* ${serverTime}
`;
m.reply(teks.trim());
}
break

            case "get":{
                if (!/^https?:\/\//.test(q)) return reply(`*example:* ${prefix + command} https://example.com`);
                const ajg = await fetch(q);
                await reaction(m.chat, "⚡")
                
                if (ajg.headers.get("content-length") > 100 * 1024 * 1024) {
                    throw `Content-Length: ${ajg.headers.get("content-length")}`;
                }

                const contentType = ajg.headers.get("content-type");
                if (contentType.startsWith("image/")) {
                    return conn.sendMessage(m.chat, {
                        image: { url: q }
                    }, { quoted: m });
                }
        
                if (contentType.startsWith("video/")) {
                    return conn.sendMessage(m.chat, {
                        video: { url: q } 
                    }, { quoted: m });
                }
                
                if (contentType.startsWith("audio/")) {
                    return conn.sendMessage(m.chat, {
                        audio: { url: q },
                        mimetype: 'audio/mpeg', 
                        ptt: true
                    }, { quoted: m });
                }
        
                let alak = await ajg.buffer();
                try {
                    alak = util.format(JSON.parse(alak + ""));
                } catch (e) {
                    alak = alak + "";
                } finally {
                    return reply(alak.slice(0, 65536));
                }
            }
            break

      default:
        // No reply for unknown commands
    }
  } catch (err) {
    m.reply(`❌ *Error occurred:*\n${util.format(err)}`);
  }
};

let file = fileURLToPath(import.meta.url);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.green(` ~> File updated: ${file}`));
    import(`${file}?update=${Date.now()}`);
});
