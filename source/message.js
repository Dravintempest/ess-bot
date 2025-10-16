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

// Load data dari file JSON
const fishingSpots = loadJSON('./database/fishing_spots.json');
const baitData = loadJSON('./database/bait_data.json');
const huntingSpots = loadJSON('./database/hunting_spots.json');
const jobs = loadJSON('./database/jobs.json');
const animals = loadJSON('./database/animals.json');

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
    
    let bar = '='.repeat(filled) + '|' + '='.repeat(empty);
    
    // Place fish in the bar based on position
    let fishBar = bar.split('');
    fishBar[fishPosition] = '🐟';
    bar = fishBar.join('');
    
    return `🎣 *SEDANG MEMANCING* 🎣\n\n` +
           `📍 ${bar}\n\n` +
           `⚡ *Progress:* ${progress}%\n` +
           `🎯 *Posisi Ikan:* ${fishPosition + 1}/${barLength}\n\n` +
           `💡 *Ketik ← atau → untuk menggerakkan kail!*`;
}

function loadTests(){
  try {
    return JSON.parse(fs.readFileSync('./tests.json'));
  } catch(e){
    return {};
  }
}

function saveTests(obj){
  fs.writeFileSync('./tests.json', JSON.stringify(obj, null, 2));
}

// Active fishing sessions
const activeFishing = new Map();
const activeHunting = new Map();

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

      case 'fishing': case 'fish': {
    // Cek apakah user sudah memilih spot
    const userData = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!userData[userId] || !userData[userId].currentSpot) {
        return m.reply(`🎣 *PILIH SPOT MEMANCING* 🎣\n\n` +
                      `📍 *Available Spots:*\n` +
                      `• ${prefix}spots - Lihat semua spot\n` +
                      `• ${prefix}gotospot <nama_spot> - Pergi ke spot\n\n` +
                      `*Contoh:* ${prefix}gotospot sungai`);
    }
    
    // Cek apakah user punya umpan
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
    
    // Mulai sesi fishing
    const spot = userData[userId].currentSpot;
    const bait = inventory[userId].bait[0]; // Gunakan umpan pertama
    
    // Kurangi umpan
    inventory[userId].bait.shift();
    saveJSON('./database/inventory.json', inventory);
    
    // Setup fishing session
    const fishingSession = {
        spot: spot,
        bait: bait,
        progress: 0,
        fishPosition: 10,
        hookPosition: 10,
        messageId: null,
        startTime: Date.now()
    };
    
    // Kirim pesan animasi pertama
    const animMessage = await conn.sendMessage(m.chat, { 
        text: createFishingAnimation(10, 0, 10) 
    }, { quoted: m });
    
    fishingSession.messageId = animMessage.key.id;
    activeFishing.set(userId, fishingSession);
    
    // Start animation loop
    const animateFishing = async () => {
        const session = activeFishing.get(userId);
        if (!session) return;
        
        // Update fish position randomly
        if (Math.random() < 0.3) {
            session.fishPosition = Math.max(0, Math.min(19, session.fishPosition + (Math.random() < 0.5 ? 1 : -1)));
        }
        
        // Update progress jika hook dan fish di posisi sama
        if (session.hookPosition === session.fishPosition) {
            session.progress = Math.min(100, session.progress + 5);
        } else {
            session.progress = Math.max(0, session.progress - 2);
        }
        
        // Update pesan
        try {
            await conn.relayMessage(m.chat, {
                protocolMessage: {
                    key: {
                        remoteJid: m.chat,
                        id: session.messageId,
                        participant: m.sender
                    },
                    type: 14,
                    editedMessage: {
                        conversation: createFishingAnimation(session.hookPosition, session.progress, session.fishPosition)
                    }
                }
            }, {});
        } catch (e) {
            console.log('Error updating message:', e);
        }
        
        // Cek jika fishing selesai
        if (session.progress >= 100) {
            activeFishing.delete(userId);
            
            // Dapatkan ikan
            const caughtFish = getRandomFish(spot, bait);
            const users = loadJSON('./database/users.json');
            const userInventory = loadJSON('./database/inventory.json');
            
            if (!userInventory[userId]) userInventory[userId] = { fish: [], bait: [], animals: [], items: [] };
            if (!userInventory[userId].fish) userInventory[userId].fish = [];
            
            userInventory[userId].fish.push(caughtFish);
            
            // Update user stats
            if (!users[userId]) users[userId] = { money: 0, fishCaught: 0, level: 1, exp: 0, energy: 100 };
            users[userId].fishCaught = (users[userId].fishCaught || 0) + 1;
            users[userId].exp = (users[userId].exp || 0) + 5;
            users[userId].energy = Math.max(0, (users[userId].energy || 100) - 10);
            
            saveJSON('./database/users.json', users);
            saveJSON('./database/inventory.json', userInventory);
            
            // Kirim hasil
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
        
        // Lanjutkan animasi jika belum selesai
        if (activeFishing.has(userId)) {
            setTimeout(animateFishing, 1000);
        }
    };
    
    // Mulai animasi
    setTimeout(animateFishing, 1000);
}
break;

case '←': case '→': {
    // Handle fishing controls
    const userId = m.sender;
    const session = activeFishing.get(userId);
    
    if (!session) return;
    
    if (commands === '←') {
        session.hookPosition = Math.max(0, session.hookPosition - 1);
    } else if (commands === '→') {
        session.hookPosition = Math.min(19, session.hookPosition + 1);
    }
    
    m.reply(`🎣 Hook moved to position ${session.hookPosition + 1}`);
}
break;

case 'spots': {
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
    
    // Cek energy
    if (users[userId].energy < 5) {
        return m.reply(`❌ *Energy habis!*\n\n` +
                      `⚡ Energy kamu: ${users[userId].energy}/100\n` +
                      `💤 Istirahat dulu atau minum energy drink!`);
    }
    
    // Kurangi energy untuk travel
    users[userId].energy = Math.max(0, users[userId].energy - 5);
    
    // Set current spot
    users[userId].currentSpot = spotName;
    saveJSON('./database/users.json', users);
    
    const spot = fishingSpots[spotName];
    
    // Animasi travel
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

case 'shop': {
    const shopItems = loadJSON('./database/shop_items.json');
    
    let shopList = "🛒 *TOKO UMPAN & ITEM* 🛒\n━━━━━━━━━━━━━━━━━━\n\n";
    
    Object.entries(shopItems).forEach(([key, item]) => {
        shopList += `🛍️ *${item.name}*\n`;
        shopList += `   💰 Harga: Rp${item.price.toLocaleString()}\n`;
        shopList += `   📝 ${item.description}\n`;
        shopList += `   🛒 Beli: ${prefix}buy ${key}\n\n`;
    });
    
    shopList += `💵 *Gunakan:* ${prefix}buy <item>\n` +
                `📦 *Cek inventory:* ${prefix}inv`;
    
    m.reply(shopList);
}
break;

case 'buy': {
    const itemName = args[0]?.toLowerCase();
    const shopItems = loadJSON('./database/shop_items.json');
    const users = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    if (!itemName || !shopItems[itemName]) {
        return m.reply(`❌ *Item tidak ditemukan!*\n\n` +
                      `🛒 Gunakan ${prefix}shop untuk melihat daftar item`);
    }
    
    const item = shopItems[itemName];
    const user = users[userId] || { money: 0 };
    
    if (user.money < item.price) {
        return m.reply(`❌ *Uang tidak cukup!*\n\n` +
                      `💵 Harga: Rp${item.price.toLocaleString()}\n` +
                      `💰 Uang kamu: Rp${user.money.toLocaleString()}\n\n` +
                      `💡 Kerja dulu: ${prefix}worklist`);
    }
    
    // Kurangi uang
    user.money -= item.price;
    
    // Tambah ke inventory
    if (!inventory[userId]) inventory[userId] = { fish: [], bait: [], animals: [], items: [] };
    if (!inventory[userId].bait) inventory[userId].bait = [];
    
    inventory[userId].bait.push(itemName);
    
    saveJSON('./database/users.json', users);
    saveJSON('./database/inventory.json', inventory);
    
    m.reply(`✅ *Berhasil membeli ${item.name}!*\n\n` +
            `📦 Ditambahkan ke inventory\n` +
            `💰 Uang tersisa: Rp${user.money.toLocaleString()}\n\n` +
            `🎣 Gunakan: ${prefix}fish`);
}
break;

case 'hunt': case 'berburu': {
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
    
    // Mulai berburu
    let huntMsg = await m.reply(`🎯 *Mulai berburu di ${spot.name}...*`);
    
    await sleep(spot.travelTime);
    
    // Cek keberhasilan
    const success = Math.random() * 100 < spot.successRate;
    const inventory = loadJSON('./database/inventory.json');
    
    if (success) {
        const animal = getRandomAnimal(spotName);
        
        if (!inventory[userId]) inventory[userId] = { fish: [], bait: [], animals: [], items: [] };
        if (!inventory[userId].animals) inventory[userId].animals = [];
        
        inventory[userId].animals.push(animal);
        
        // Update user stats
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
    
    // Mulai kerja
    let workMsg = await m.reply(`💼 *Mulai bekerja sebagai ${job.name}...*`);
    
    await sleep(job.time);
    
    // Dapatkan gaji
    const income = Math.floor(Math.random() * (job.income.max - job.income.min + 1)) + job.income.min;
    
    // Update user data
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

case 'inventory': case 'inv': {
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
    
    invList += `💰 *Total Nilai:* Rp${totalValue.toLocaleString()}\n\n`;
    invList += `💡 *Jual semua:* ${prefix}sellall\n`;
    invList += `🎣 *Jual ikan:* ${prefix}sellfish\n`;
    invList += `🐾 *Jual hewan:* ${prefix}sellanimals`;
    
    m.reply(invList);
}
break;

case 'sellall': {
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

case 'sellfish': {
    const inventory = loadJSON('./database/inventory.json');
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!inventory[userId] || !inventory[userId].fish || inventory[userId].fish.length === 0) {
        return m.reply("❌ *Tidak ada ikan untuk dijual!*");
    }
    
    let totalEarned = 0;
    let fishSold = inventory[userId].fish.length;
    
    inventory[userId].fish.forEach(fish => {
        totalEarned += fish.value || fish.harga;
    });
    
    // Update user money
    if (!users[userId]) users[userId] = { money: 0 };
    users[userId].money = (users[userId].money || 0) + totalEarned;
    
    // Clear fish inventory
    inventory[userId].fish = [];
    
    saveJSON('./database/inventory.json', inventory);
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Berhasil menjual ${fishSold} ikan!*\n\n` +
            `💰 Penghasilan: *Rp${totalEarned.toLocaleString()}*\n` +
            `💵 Uang sekarang: *Rp${users[userId].money.toLocaleString()}*`);
}
break;

case 'sellanimals': {
    const inventory = loadJSON('./database/inventory.json');
    const users = loadJSON('./database/users.json');
    const userId = m.sender;
    
    if (!inventory[userId] || !inventory[userId].animals || inventory[userId].animals.length === 0) {
        return m.reply("❌ *Tidak ada hewan untuk dijual!*");
    }
    
    let totalEarned = 0;
    let animalsSold = inventory[userId].animals.length;
    
    inventory[userId].animals.forEach(animal => {
        totalEarned += animal.value;
    });
    
    // Update user money
    if (!users[userId]) users[userId] = { money: 0 };
    users[userId].money = (users[userId].money || 0) + totalEarned;
    
    // Clear animals inventory
    inventory[userId].animals = [];
    
    saveJSON('./database/inventory.json', inventory);
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Berhasil menjual ${animalsSold} hewan!*\n\n` +
            `💰 Penghasilan: *Rp${totalEarned.toLocaleString()}*\n` +
            `💵 Uang sekarang: *Rp${users[userId].money.toLocaleString()}*`);
}
break;

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

case 'profile': case 'stats': {
    const users = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    const userData = users[userId] || { money: 0, fishCaught: 0, animalsCaught: 0, workCount: 0, level: 1, exp: 0, energy: 100 };
    const userInventory = inventory[userId] || { fish: [], bait: [], animals: [], items: [] };
    
    const totalFish = userInventory.fish ? userInventory.fish.length : 0;
    const totalAnimals = userInventory.animals ? userInventory.animals.length : 0;
    const totalBait = userInventory.bait ? userInventory.bait.length : 0;
    
    const fishValue = userInventory.fish ? userInventory.fish.reduce((sum, fish) => sum + (fish.value || fish.harga), 0) : 0;
    const animalsValue = userInventory.animals ? userInventory.animals.reduce((sum, animal) => sum + animal.value, 0) : 0;
    const totalValue = fishValue + animalsValue;
    
    const stats = `📊 *PROFILE & STATISTICS* 📊\n━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                 `👤 *${pushName}*\n\n` +
                 `💵 Uang: Rp${userData.money.toLocaleString()}\n` +
                 `⚡ Energy: ${userData.energy || 100}/100\n` +
                 `🎯 Level: ${userData.level || 1}\n` +
                 `⭐ EXP: ${userData.exp || 0}/100\n\n` +
                 `🎣 *Fishing:* ${userData.fishCaught || 0} ikan\n` +
                 `🎯 *Hunting:* ${userData.animalsCaught || 0} hewan\n` +
                 `💼 *Work:* ${userData.workCount || 0} kali\n\n` +
                 `📦 *Inventory:*\n` +
                 `   🐟 Ikan: ${totalFish} (Rp${fishValue.toLocaleString()})\n` +
                 `   🐾 Hewan: ${totalAnimals} (Rp${animalsValue.toLocaleString()})\n` +
                 `   🪱 Umpan: ${totalBait}\n\n` +
                 `💰 Total Nilai: Rp${totalValue.toLocaleString()}`;
    
    m.reply(stats);
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
    console.log(chalk.red(` ~> File updated: ${file}`));
    import(`${file}?update=${Date.now()}`);
});
