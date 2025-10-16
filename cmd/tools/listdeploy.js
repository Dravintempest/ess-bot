// listdeploy.js - Handler untuk command .listdeploy
import fs from "fs-extra";
import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

const DEPLOY_DATA_FILE = './database/deploy.json';

// Config untuk externalAdReply
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

// Load data dari file
function loadDeployData() {
  try {
    if (fs.existsSync(DEPLOY_DATA_FILE)) {
      return fs.readJsonSync(DEPLOY_DATA_FILE);
    }
  } catch (error) {
    console.error('Error loading deploy data:', error);
  }
  return { users: {}, deployments: {}, sessions: {} };
}

// Get deployments by user
function getUserDeployments(userId) {
  const data = loadDeployData();
  return data.users[userId]?.deployments || [];
}

let handler = async (m, { conn }) => {
  const chatId = m.chat;
  const userId = m.sender.split('@')[0];
  const isGroup = m.chat.endsWith('@g.us');
  
  try {
    // Jika di grup, kirim ke private chat
    if (isGroup) {
      await conn.sendMessage(m.sender, {
        text: `📋 Mengambil daftar deployment Anda...`,
        contextInfo: contextInfoConfig
      });
      
      await conn.sendMessage(chatId, {
        text: `📩 @${userId}, saya kirim daftar deployment ke private chat Anda.`,
        mentions: [m.sender],
        contextInfo: contextInfoConfig
      });
      return;
    }

    await conn.sendMessage(chatId, {
      text: "📋 Mengambil daftar deployment Anda...",
      contextInfo: contextInfoConfig
    });
    
    const deployments = getUserDeployments(userId);
    
    if (deployments.length > 0) {
      let message = `📦 *DAFTAR WEBSITE ANDA* \n${'═'.repeat(20)}\n\n`;
      
      deployments.forEach((deploy, index) => {
        const date = new Date(deploy.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
        });
        
        const statusIcon = deploy.status === 'success' ? '✅' : 
                          deploy.status === 'failed' ? '❌' : '⏳';
        
        message += `*${index + 1}. ${deploy.projectName}*\n`;
        message += `🌐 ${deploy.url || `https://${deploy.subdomain}.esscloud.web.id`}\n`;
        message += `📅 ${date}\n`;
        message += `⚡ Status: ${statusIcon} ${deploy.status}\n`;
        message += `${'─'.repeat(20)}\n\n`;
      });
      
      message += `📊 Total: ${deployments.length} Website\n`;
      message += `🚀 Gunakan *.deploy* untuk buat website baru`;

      // Kirim dengan tombol interaktif
      const listMessage = generateWAMessageFromContent(
        chatId,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                ...contextInfoConfig,
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: {
                body: { text: message },
                footer: { text: "Ess Cloud Deployment" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🚀 Buat Website Baru",
                        id: ".deploy"
                      })
                    },
                    {
                      name: "cta_copy", 
                      buttonParamsJson: JSON.stringify({
                        display_text: "📋 Copy List",
                        copy_code: message
                      })
                    }
                  ]
                }
              }
            }
          }
        },
        { quoted: m }
      );

      await conn.relayMessage(chatId, listMessage.message, { messageId: listMessage.key.id });
      
    } else {
      const emptyMessage = generateWAMessageFromContent(
        chatId,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                ...contextInfoConfig,
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: {
                body: { 
                  text: `📭 *BELUM ADA WEBSITE* \n${'═'.repeat(20)}\n\n` +
                        `Anda belum memiliki website.\n` +
                        `Yuk buat website pertama Anda!\n\n` +
                        `Ketik *.deploy* untuk memulai! 🚀`
                },
                footer: { text: "Ess Cloud Deployment" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🚀 Buat Website",
                        id: ".deploy"
                      })
                    }
                  ]
                }
              }
            }
          }
        },
        { quoted: m }
      );

      await conn.relayMessage(chatId, emptyMessage.message, { messageId: emptyMessage.key.id });
    }
  } catch (error) {
    console.error("ListDeploy Error:", error);
    
    const errorMessage = generateWAMessageFromContent(
      chatId,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              ...contextInfoConfig,
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: {
              body: { 
                text: `❌ *Gagal Mengambil Data* \n\n` +
                      `Pastikan Anda sudah pernah deploy website.\n` +
                      `Gunakan *.deploy* untuk buat website pertama!`
              },
              footer: { text: "Ess Cloud Deployment" },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🚀 Buat Website",
                      id: ".deploy"
                    })
                  }
                ]
              }
            }
          }
        }
      },
      { quoted: m }
    );

    await conn.relayMessage(chatId, errorMessage.message, { messageId: errorMessage.key.id });
  }
}

// Command handlers
handler.help = ["listdeploy"];
handler.tags = ["tools", "deployment"];
handler.command = ["listdeploy", "listwebsite", "websitesaya"];
handler.register = true;

export default handler;
