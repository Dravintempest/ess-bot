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

function getRandomFish() {
    const fishData = loadJSON('./database/ikan.json');
    const rarityWeights = {
        'common': 10,
        'rare': 3, 
        'legendary': 1,
        'mythic': 0.5
    };
    
    let totalWeight = 0;
    fishData.forEach(fish => {
        totalWeight += rarityWeights[fish.rarity] || 1;
    });
    
    let random = Math.random() * totalWeight;
    
    for (let fish of fishData) {
        const weight = rarityWeights[fish.rarity] || 1;
        if (random < weight) {
            return {
                ...fish,
                weight: (Math.random() * (fish.berat_max - fish.berat_min) + fish.berat_min).toFixed(2)
            };
        }
        random -= weight;
    }
    return fishData[0];
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
    const cooldownFile = './database/cooldown.json';
    const cooldowns = loadJSON(cooldownFile);
    const userId = m.sender;
    
    if (cooldowns[userId] && Date.now() - cooldowns[userId] < 30000) {
        const remaining = Math.ceil((30000 - (Date.now() - cooldowns[userId])) / 1000);
        return m.reply(`⏰ Cooldown! Wait ${remaining} seconds.`);
    }
    
    cooldowns[userId] = Date.now();
    saveJSON(cooldownFile, cooldowns);
    
    // Fishing animation
    let anim = ['🎣 Fishing...', '🎣 Fishing..', '🎣 Fishing.'];
    for (let i = 0; i < 3; i++) {
        await conn.sendMessage(m.key.remoteJid, { text: anim[i] }, { quoted: m });
        await sleep(1000);
    }
    
    const resultFish = getRandomFish();
    const inventory = loadJSON('./database/inventory.json');
    
    if (!inventory[userId]) inventory[userId] = [];
    inventory[userId].push(resultFish);
    saveJSON('./database/inventory.json', inventory);
    
    // Update user stats
    const users = loadJSON('./database/users.json');
    if (!users[userId]) users[userId] = { money: 0, fishCaught: 0, level: 1, exp: 0 };
    users[userId].fishCaught = (users[userId].fishCaught || 0) + 1;
    users[userId].exp = (users[userId].exp || 0) + 5;
    saveJSON('./database/users.json', users);
    
    m.reply(`🎉 *CONGRATULATIONS! YOU CAUGHT A FISH!* 🎉\n\n🐟 *${resultFish.nama}*\n⚖️ Weight: ${resultFish.weight}kg\n💰 Price: Rp${resultFish.harga.toLocaleString()}\n⭐ Rarity: ${resultFish.rarity}\n📍 ${resultFish.deskripsi}`);
}
break;

case 'fishlist': case 'listfish': {
    const fishData = loadJSON('./database/ikan.json');
    let list = "🐟 *ALL FISH LIST* 🐟\n━━━━━━━━━━━━━━━━━━\n\n";
    
    fishData.forEach(fish => {
        const icon = fish.rarity === 'common' ? '⭐' : fish.rarity === 'rare' ? '🌟' : fish.rarity === 'legendary' ? '💫' : '✨';
        list += `${icon} *${fish.nama}*\n`;
        list += `   💰 Rp${fish.harga.toLocaleString()} | 📍 ${fish.lokasi}\n`;
        list += `   ⚖️ ${fish.berat_min}-${fish.berat_max}kg\n\n`;
    });
    
    m.reply(list.trim());
}
break;

case 'inventory': case 'inv': {
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    if (!inventory[userId] || inventory[userId].length === 0) {
        return m.reply("📭 *Your inventory is empty!*\nGo fishing first (.fishing)");
    }
    
    let list = "🎒 *FISH INVENTORY* 🎒\n━━━━━━━━━━━━━━━━━━\n\n";
    let totalValue = 0;
    let totalFish = inventory[userId].length;
    
    // Count by fish type
    const fishCount = {};
    inventory[userId].forEach(fish => {
        fishCount[fish.nama] = (fishCount[fish.nama] || 0) + 1;
        totalValue += fish.harga;
    });
    
    Object.entries(fishCount).forEach(([name, count], index) => {
        list += `${index + 1}. *${name}* (${count}x)\n`;
    });
    
    list += `\n📊 Total: ${totalFish} fish\n💰 Total Value: *Rp${totalValue.toLocaleString()}*`;
    m.reply(list);
}
break;

case 'sellall': case 'sellfish': {
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    if (!inventory[userId] || inventory[userId].length === 0) {
        return m.reply("❌ *No fish to sell!*");
    }
    
    let totalEarned = 0;
    let itemsSold = inventory[userId].length;
    
    inventory[userId].forEach(fish => {
        totalEarned += fish.harga;
    });
    
    // Update user money
    const users = loadJSON('./database/users.json');
    if (!users[userId]) users[userId] = { money: 0, fishCaught: 0 };
    users[userId].money = (users[userId].money || 0) + totalEarned;
    
    // Clear inventory
    inventory[userId] = [];
    
    saveJSON('./database/inventory.json', inventory);
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Successfully sold ${itemsSold} fish!*\n💰 Earned: *Rp${totalEarned.toLocaleString()}*\n💵 Current money: *Rp${users[userId].money.toLocaleString()}*`);
}
break;

case 'sell': {
    const args = m.text.split(' ');
    if (args.length < 3) return m.reply("❌ *Format:* .sell <fish_name> <amount>\n*Example:* .sell ikan mas 2");
    
    const fishName = args[1].toLowerCase();
    const amount = parseInt(args[2]);
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    if (!inventory[userId]) return m.reply("❌ *Inventory empty!*");
    
    const filteredFish = inventory[userId].filter(fish => 
        fish.nama.toLowerCase().includes(fishName)
    );
    
    if (filteredFish.length === 0) return m.reply("❌ *Fish not found!*");
    
    const toSell = filteredFish.slice(0, amount);
    const totalEarned = toSell.reduce((sum, fish) => sum + fish.harga, 0);
    
    // Remove from inventory
    toSell.forEach(fishToRemove => {
        const index = inventory[userId].findIndex(fish => 
            fish.nama === fishToRemove.nama && fish.weight === fishToRemove.weight
        );
        if (index > -1) inventory[userId].splice(index, 1);
    });
    
    // Update user money
    const users = loadJSON('./database/users.json');
    if (!users[userId]) users[userId] = { money: 0 };
    users[userId].money = (users[userId].money || 0) + totalEarned;
    
    saveJSON('./database/inventory.json', inventory);
    saveJSON('./database/users.json', users);
    
    m.reply(`✅ *Successfully sold ${toSell.length} ${fishName}!*\n💰 Earned: *Rp${totalEarned.toLocaleString()}*`);
}
break;

case 'fishinfo': case 'info': {
    const args = m.text.split(' ');
    if (args.length < 2) return m.reply("❌ *Format:* .fishinfo <fish_name>\n*Example:* .fishinfo ikan mas");
    
    const fishName = args.slice(1).join(' ').toLowerCase();
    const fishData = loadJSON('./database/ikan.json');
    
    const fish = fishData.find(i => 
        i.nama.toLowerCase().includes(fishName)
    );
    
    if (!fish) return m.reply("❌ *Fish not found!*");
    
    const icon = fish.rarity === 'common' ? '⭐' : fish.rarity === 'rare' ? '🌟' : fish.rarity === 'legendary' ? '💫' : '✨';
    const info = `🐟 *${fish.nama.toUpperCase()} INFO* 🐟\n━━━━━━━━━━━━━━━━━━\n\n` +
                `${icon} *${fish.nama}*\n` +
                `💰 Price: Rp${fish.harga.toLocaleString()}\n` +
                `⭐ Rarity: ${fish.rarity}\n` +
                `📍 Location: ${fish.lokasi}\n` +
                `⚖️ Weight: ${fish.berat_min}-${fish.berat_max}kg\n` +
                `📝 ${fish.deskripsi}`;
    
    m.reply(info);
}
break;

case 'fishtop': case 'top': {
    const users = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    
    let leaderboard = [];
    
    Object.entries(users).forEach(([userId, userData]) => {
        const userFish = inventory[userId] || [];
        const totalValue = userFish.reduce((sum, fish) => sum + fish.harga, 0);
        
        leaderboard.push({
            userId,
            totalValue,
            fishCaught: userData.fishCaught || 0,
            money: userData.money || 0
        });
    });
    
    leaderboard.sort((a, b) => b.totalValue - a.totalValue);
    
    let topList = "🏆 *FISHING LEADERBOARD* 🏆\n━━━━━━━━━━━━━━━━━━\n\n";
    
    leaderboard.slice(0, 10).forEach((user, index) => {
        const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `▫️`;
        const name = user.userId.split('@')[0];
        topList += `${rank} *${name}*\n`;
        topList += `   💰 Rp${user.totalValue.toLocaleString()} | 🎣 ${user.fishCaught} fish\n\n`;
    });
    
    m.reply(topList.trim());
}
break;

case 'fishstats': case 'stats': {
    const users = loadJSON('./database/users.json');
    const inventory = loadJSON('./database/inventory.json');
    const userId = m.sender;
    
    const userData = users[userId] || { money: 0, fishCaught: 0, level: 1, exp: 0 };
    const userFish = inventory[userId] || [];
    
    const totalValue = userFish.reduce((sum, fish) => sum + fish.harga, 0);
    const rareFish = userFish.filter(fish => fish.rarity !== 'common').length;
    const commonFish = userFish.filter(fish => fish.rarity === 'common').length;
    
    const stats = `📊 *FISHING STATISTICS* 📊\n━━━━━━━━━━━━━━━━━━\n\n` +
                 `👤 *${pushName}*\n\n` +
                 `💵 Money: Rp${userData.money.toLocaleString()}\n` +
                 `🎣 Total Caught: ${userData.fishCaught} fish\n` +
                 `📦 Inventory: ${userFish.length} fish\n` +
                 `💰 Inventory Value: Rp${totalValue.toLocaleString()}\n` +
                 `⭐ Rare Fish: ${rareFish} fish\n` +
                 `📈 Common Fish: ${commonFish} fish\n` +
                 `🎯 Level: ${userData.level}\n` +
                 `⚡ EXP: ${userData.exp}/100`;
    
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
