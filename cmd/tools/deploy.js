// deploy.js - Bot WA Deployment dengan CTA Copy & URL + Quick Reply
import fs from "fs-extra";
import axios from "axios";
import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

const DEPLOY_API_URL = "https://www.esscloud.my.id/api";
const URL_HOME = "https://www.esscloud.my.id";
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

// Save data ke file
function saveDeployData(data) {
  try {
    fs.writeJsonSync(DEPLOY_DATA_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error saving deploy data:', error);
    return false;
  }
}

// Simpan deployment ke database lokal
function saveDeployment(userId, deploymentData) {
  const data = loadDeployData();
  
  if (!data.users[userId]) {
    data.users[userId] = {
      userId: userId,
      deployments: [],
      createdAt: new Date().toISOString()
    };
  }
  
  // Tambah deployment baru
  const deployment = {
    id: deploymentData.sessionId || `deploy-${Date.now()}`,
    projectName: deploymentData.projectName,
    subdomain: deploymentData.subdomain,
    url: deploymentData.url,
    sessionId: deploymentData.sessionId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.users[userId].deployments.push(deployment);
  
  // Simpan juga di deployments global
  data.deployments[deployment.id] = deployment;
  
  // Simpan session
  if (deploymentData.sessionId) {
    data.sessions[deploymentData.sessionId] = {
      userId: userId,
      deploymentId: deployment.id,
      createdAt: new Date().toISOString()
    };
  }
  
  return saveDeployData(data);
}

// Update status deployment
function updateDeploymentStatus(sessionId, status, deploymentData = {}) {
  const data = loadDeployData();
  
  const session = data.sessions[sessionId];
  if (!session) return false;
  
  const deployment = data.deployments[session.deploymentId];
  if (!deployment) return false;
  
  deployment.status = status;
  deployment.updatedAt = new Date().toISOString();
  
  // Update data tambahan jika ada
  if (deploymentData.url) deployment.url = deploymentData.url;
  if (deploymentData.server) deployment.server = deploymentData.server;
  
  return saveDeployData(data);
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
    // Jika di grup, kirim pesan awal ke private chat
    if (isGroup) {
      await conn.sendMessage(m.sender, {
        text: `👋 *Halo!* \n\nSaya melihat Anda ingin deploy website di grup. \nUntuk keamanan, kita lanjutkan di chat private ya! \n\nSilakan ketik *${m.text}* lagi di sini.`,
        contextInfo: {
          ...contextInfoConfig,
          mentionedJid: [m.sender]
        }
      });
      
      await conn.sendMessage(chatId, {
        text: `📩 *Check Private Chat!* \n\n@${userId}, saya sudah kirim instruksi deploy ke chat private Anda. \nSilakan cek pesan dari saya.`,
        mentions: [m.sender],
        contextInfo: {
          ...contextInfoConfig,
          mentionedJid: [m.sender]
        }
      });
      return;
    }

    // ========== PROSES DEPLOYMENT DI PRIVATE CHAT ==========
    
    // Step 1: Kirim format dengan tombol copy interaktif
    const deployFormat = `📋 *FORMAT DEPLOYMENT* \n${'═'.repeat(20)}\n\n` +
                        `project: Nama Project Anda\n` +
                        `subdomain: subdomain-anda\n\n` +
                        `${'═'.repeat(20)}\n` +
                        `📝 *Contoh Pengisian:*\n` +
                        `project: My Portfolio Website\n` +
                        `subdomain: myportfolio123\n\n` +
                        `💡 *Tips Subdomain:*\n` +
                        `• Huruf kecil & angka saja\n` +
                        `• Bisa pakai dash (-)\n` +
                        `• Min 3 karakter`;

    const formatText = `project: Nama Project Anda\nsubdomain: subdomain-anda`;

    // Kirim pesan interaktif dengan CTA Copy
    const formatMessage = generateWAMessageFromContent(
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
              body: { text: deployFormat },
              footer: { text: "Ess Cloud Deployment" },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 Copy Format",
                      copy_code: formatText
                    })
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🚀 Mulai Deploy",
                      id: ".deploy_start"
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

    await conn.relayMessage(chatId, formatMessage.message, { messageId: formatMessage.key.id });

    // Step 2: Tunggu user mengisi format
    await conn.sendMessage(chatId, {
      text: `🔄 *LANGKAH SELANJUTNYA* \n${'═'.repeat(20)}\n\n` +
            `1. 📋 Copy format di atas\n` +
            `2. 📝 Edit dengan data project Anda\n` +
            `3. 📤 Kirim format yang sudah diisi di sini\n\n` +
            `⏰ *Timeout: 2 menit*\n\n` +
            `Atau klik "Mulai Deploy" untuk menggunakan format default`,
      contextInfo: contextInfoConfig
    });

    const formatMsg = await waitForMessage(conn, chatId, 120000);
    if (!formatMsg) {
      await conn.sendMessage(chatId, {
        text: `⏰ *Waktu Habis* \n\nSilakan ketik *${m.text}* lagi untuk memulai ulang.`,
        contextInfo: contextInfoConfig
      });
      return;
    }

    let projectName, subdomain;

    // Cek jika user klik quick reply "Mulai Deploy"
    if (formatMsg.message?.templateButtonReplyMessage?.selectedId === '.deploy_start') {
      projectName = "My Website";
      subdomain = `website-${Date.now().toString().slice(-6)}`;
    } else {
      // Extract data dari format text
      const messageText = extractTextFromMessage(formatMsg);
      const projectMatch = messageText.match(/project:\s*(.+)/i);
      const subdomainMatch = messageText.match(/subdomain:\s*(.+)/i);

      if (!projectMatch || !subdomainMatch) {
        const errorMsg = generateWAMessageFromContent(
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
                    text: `❌ *FORMAT TIDAK VALID* \n${'═'.repeat(20)}\n\n` +
                          `Pastikan format sesuai contoh:\n\n` +
                          `project: Nama Project Anda\n` +
                          `subdomain: subdomain-anda\n\n` +
                          `🔄 Silakan coba lagi`
                  },
                  footer: { text: "Ess Cloud Deployment" },
                  nativeFlowMessage: {
                    buttons: [
                      {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                          display_text: "🔄 Coba Lagi",
                          id: ".deploy"
                        })
                      },
                      {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                          display_text: "📋 Copy Format",
                          copy_code: formatText
                        })
                      },
                      {
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                          display_text: "🚀 Deploy",
                          id: ".deploy_start"
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

        await conn.relayMessage(chatId, errorMsg.message, { messageId: errorMsg.key.id });
        return;
      }

      projectName = projectMatch[1].trim();
      subdomain = subdomainMatch[1].trim();
    }

    // Validasi project name
    if (!projectName || projectName.length < 2) {
      await conn.sendMessage(chatId, {
        text: `❌ *NAMA PROJECT TIDAK VALID* \n\nMinimal 2 karakter. Silakan coba lagi dengan *.deploy*`,
        contextInfo: contextInfoConfig
      });
      return;
    }

    // Clean dan validasi subdomain
    subdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (subdomain.length < 3) {
      await conn.sendMessage(chatId, {
        text: `❌ *SUBDOMAIN TERLALU PENDEK* \n\nMinimal 3 karakter. Silakan coba lagi dengan *.deploy*`,
        contextInfo: contextInfoConfig
      });
      return;
    }
    
    if (subdomain.length > 30) {
      await conn.sendMessage(chatId, {
        text: `❌ *SUBDOMAIN TERLALU PANJANG* \n\nMaksimal 30 karakter. Silakan coba lagi dengan *.deploy*`,
        contextInfo: contextInfoConfig
      });
      return;
    }

    const websiteUrl = `https://${subdomain}.esscloud.web.id`;

    // Step 3: Konfirmasi dengan CTA buttons
    const confirmMsg = generateWAMessageFromContent(
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
                text: `📋 *KONFIRMASI DEPLOYMENT* \n${'═'.repeat(20)}\n\n` +
                      `📛 *Project:* ${projectName}\n` +
                      `🌐 *Subdomain:* ${subdomain}\n` +
                      `🔗 *Website:* ${websiteUrl}\n\n` +
                      `💰 *Gratis Selamanya!*\n` +
                      `⚡ *Server Cepat & Handal*\n` +
                      `📦 *Auto Deployment*`
              },
              footer: { text: "Ess Cloud Deployment" },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "✅ Ya, Deploy Sekarang",
                      id: ".confirmdeploy"
                    })
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "✏️ Edit Data",
                      id: ".changedata"
                    })
                  },
                  {
                    name: "quick_reply", 
                    buttonParamsJson: JSON.stringify({
                      display_text: "❌ Batalkan",
                      id: ".cancel"
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

    await conn.relayMessage(chatId, confirmMsg.message, { messageId: confirmMsg.key.id });

    const confirmResponse = await waitForMessage(conn, chatId, 60000);
    if (!confirmResponse) {
      await conn.sendMessage(chatId, {
        text: `⏰ *Waktu Konfirmasi Habis* \n\nDeployment dibatalkan.`,
        contextInfo: contextInfoConfig
      });
      return;
    }

    // Handle response konfirmasi
    const responseText = extractTextFromMessage(confirmResponse);
    const selectedId = confirmResponse.message?.templateButtonReplyMessage?.selectedId;

    if (selectedId === '.cancel' || responseText.includes('.cancel')) {
      await conn.sendMessage(chatId, {
        text: `❌ *Deployment Dibatalkan* \n\nKapan saja siap deploy, tinggal ketik *.deploy* ya! 😊`,
        contextInfo: contextInfoConfig
      });
      return;
    }

    if (selectedId === '.changedata' || responseText.includes('.changedata')) {
      const retryMsg = generateWAMessageFromContent(
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
                  text: `🔄 *Mengulang Proses* \n\nSilakan ketik *.deploy* lagi untuk mengisi data baru.`
                },
                footer: { text: "Ess Cloud Deployment" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🚀 Deploy Sekarang",
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
      await conn.relayMessage(chatId, retryMsg.message, { messageId: retryMsg.key.id });
      return;
    }

    // Jika konfirmasi deploy
    if (selectedId === '.confirmdeploy' || responseText.includes('.confirmdeploy') || 
        responseText.toLowerCase().includes('ya') || responseText.toLowerCase().includes('deploy')) {
      
      await conn.sendMessage(chatId, {
        text: `⏳ *MEMULAI DEPLOYMENT...* \n${'═'.repeat(20)}\n\n` +
              `📛 ${projectName}\n` +
              `🌐 ${websiteUrl}\n\n` +
              `🔄 Membuat session deployment...`,
        contextInfo: contextInfoConfig
      });

      // Create session di backend
      const sessionResponse = await axios.post(`${DEPLOY_API_URL}/create-session`, {
        userId: userId,
        subdomain: subdomain,
        projectName: projectName
      });

      if (!sessionResponse.data.success) {
        throw new Error(sessionResponse.data.error);
      }

      const { sessionId, uploadUrl } = sessionResponse.data;
      const fullUploadUrl = `${URL_HOME}${uploadUrl}`;

      // Simpan deployment ke database lokal
      saveDeployment(userId, {
        sessionId: sessionId,
        projectName: projectName,
        subdomain: subdomain,
        url: websiteUrl
      });

      // Step 5: Kirim instruksi upload dengan CTA buttons
      const uploadInstructionMsg = generateWAMessageFromContent(
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
                  text: `🎉 *SESSION BERHASIL DIBUAT!* \n${'═'.repeat(20)}\n\n` +
                        `📛 *Project:* ${projectName}\n` +
                        `🌐 *Website:* ${websiteUrl}\n` +
                        `📦 *Session ID:* ${sessionId}\n${'═'.repeat(20)}\n\n` +
                        `📎 *LINK UPLOAD:*\n${fullUploadUrl}\n\n` +
                        `📋 *Langkah Selanjutnya:*\n` +
                        `1. 📂 Buka link upload di atas\n` +
                        `2. ⬆️ Upload file ZIP project Anda\n` +
                        `3. ⏳ Tunggu proses deployment\n` +
                        `4. ✅ Website otomatis live!\n\n` +
                        `🔔 Saya akan beri tahu otomatis ketika deployment selesai!`
                },
                footer: { text: "Ess Cloud Deployment" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "cta_copy",
                      buttonParamsJson: JSON.stringify({
                        display_text: "📋 Copy Upload Link", 
                        copy_code: fullUploadUrl
                      })
                    },
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🌐 Buka Upload Page",
                        url: fullUploadUrl
                      })
                    },
                    {
                      name: "quick_reply",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🔍 Cek Status",
                        id: `.checkstatus ${sessionId}`
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

      await conn.relayMessage(chatId, uploadInstructionMsg.message, { messageId: uploadInstructionMsg.key.id });

      // Step 6: Monitor deployment
      await monitorDeployment(conn, chatId, sessionId, userId, projectName, subdomain);

    } else {
      await conn.sendMessage(chatId, {
        text: `❌ *Respon Tidak Dikenali* \n\nDeployment dibatalkan. Ketik *.deploy* untuk memulai ulang.`,
        contextInfo: contextInfoConfig
      });
    }

  } catch (error) {
    console.error("Deploy Error:", error);
    
    let errorMsg = `❌ *DEPLOYMENT GAGAL* \n${'═'.repeat(20)}\n`;
    
    if (error.message.includes('subdomain')) {
      errorMsg += `🌐 *Error Subdomain:* ${error.message} \n\n`;
      errorMsg += `💡 *Solusi:* \n• Gunakan subdomain lain\n• Hanya huruf kecil, angka, dash\n• Minimal 3 karakter`;
    }
    else if (error.message.includes('waktu habis')) {
      errorMsg += `⏰ *Waktu Habis* \n\nSilakan ketik *.deploy* lagi.`;
    }
    else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      errorMsg += `🌐 *Koneksi Error* \n\nServer sedang maintenance. Coba lagi nanti.`;
    }
    else {
      errorMsg += `📦 *Error:* ${error.message}`;
    }
    
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
              body: { text: errorMsg },
              footer: { text: "Ess Cloud Deployment" },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🔄 Coba Lagi",
                      id: ".deploy"
                    })
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 List Website", 
                      id: ".listdeploy"
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
};

// Fungsi untuk cek status deployment
async function checkDeploymentStatus(conn, chatId, sessionId) {
  try {
    await conn.sendMessage(chatId, {
      text: `🔍 *Mengecek Status Deployment...*\nSession ID: ${sessionId}`,
      contextInfo: contextInfoConfig
    });

    const statusResponse = await axios.get(`${DEPLOY_API_URL}/deployment-status/${sessionId}`);
    
    if (statusResponse.data.success) {
      const { status, deployment, message } = statusResponse.data;
      
      if (status === 'success' && deployment) {
        // Update status di database lokal
        updateDeploymentStatus(sessionId, 'success', deployment);
        
        const successMsg = generateWAMessageFromContent(
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
                    text: `✅ *DEPLOYMENT SUCCESS* \n\n` +
                          `📛 Project: ${deployment.projectName}\n` +
                          `🌐 Website: ${deployment.url}\n` +
                          `📅 Waktu: ${new Date(deployment.createdAt).toLocaleString('id-ID')}\n` +
                          `⚡ Status: Live 🟢`
                  },
                  footer: { text: "Ess Cloud Deployment" },
                  nativeFlowMessage: {
                    buttons: [
                      {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                          display_text: "🌐 Buka Website",
                          url: deployment.url
                        })
                      },
                      {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                          display_text: "📋 Copy URL",
                          copy_code: deployment.url
                        })
                      }
                    ]
                  }
                }
              }
            }
          },
          { quoted: null }
        );
        await conn.relayMessage(chatId, successMsg.message, { messageId: successMsg.key.id });
      } else if (status === 'failed') {
        updateDeploymentStatus(sessionId, 'failed');
        await conn.sendMessage(chatId, {
          text: `❌ *DEPLOYMENT FAILED* \n\nError: ${message}`,
          contextInfo: contextInfoConfig
        });
      } else {
        await conn.sendMessage(chatId, {
          text: `⏳ *DEPLOYMENT IN PROGRESS* \n\nStatus: ${message || 'Processing...'}\n\nGunakan *.checkstatus ${sessionId}* untuk refresh`,
          contextInfo: contextInfoConfig
        });
      }
    }
  } catch (error) {
    await conn.sendMessage(chatId, {
      text: `❌ *Gagal cek status* \n\nError: ${error.message}`,
      contextInfo: contextInfoConfig
    });
  }
}

// Monitor deployment dengan edit pesan
async function monitorDeployment(conn, chatId, sessionId, userId, projectName, subdomain) {
  let attempts = 0;
  const maxAttempts = 60;
  const websiteUrl = `https://${subdomain}.esscloud.web.id`;

  // Kirim pesan monitoring pertama dan simpan ID-nya
  const monitoringMsg = await conn.sendMessage(chatId, {
    text: `🔍 *MEMANTAU DEPLOYMENT...* \n${'═'.repeat(20)}\n\n` +
          `📛 ${projectName}\n` +
          `🌐 ${websiteUrl}\n\n` +
          `⏳ Status: Menunggu upload file...\n` +
          `⏰ Estimasi: 1-5 menit\n` +
          `🔍 Attempt: 1/${maxAttempts}`,
    contextInfo: contextInfoConfig
  });

  const messageId = monitoringMsg.key.id;

  const updateMessage = async (newText) => {
    try {
      await conn.sendMessage(chatId, {
        text: newText,
        edit: messageId,
        contextInfo: contextInfoConfig
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const checkStatus = async () => {
    try {
      attempts++;
      
      const statusResponse = await axios.get(`${DEPLOY_API_URL}/deployment-status/${sessionId}`);
      
      if (statusResponse.data.success) {
        const { status, deployment, message } = statusResponse.data;
        
        if (status === 'success' && deployment) {
          // Update status di database lokal
          updateDeploymentStatus(sessionId, 'success', deployment);
          
          // Edit pesan terakhir dengan hasil success
          const successText = `🎉 *DEPLOYMENT BERHASIL!* \n${'═'.repeat(20)}\n\n` +
                            `📛 *Project:* ${deployment.projectName}\n` +
                            `🌐 *Website:* ${deployment.url}\n` +
                            `📅 *Waktu:* ${new Date(deployment.createdAt).toLocaleString('id-ID')}\n` +
                            `⚡ *Server:* ${deployment.server}\n${'═'.repeat(20)}\n\n` +
                            `✅ *Website Anda sudah LIVE!*\n\n` +
                            `💡 *Tips:*\n` +
                            `• DNS mungkin butuh 2-30 menit untuk propagasi penuh\n` +
                            `• Buka website untuk testing\n` +
                            `• Gunakan *.listdeploy* untuk lihat semua website`;
          
          await updateMessage(successText);
          
          // Kirim pesan baru dengan tombol interaktif
          const successMsg = generateWAMessageFromContent(
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
                    body: { text: successText },
                    footer: { text: "Ess Cloud Deployment" },
                    nativeFlowMessage: {
                      buttons: [
                        {
                          name: "cta_url",
                          buttonParamsJson: JSON.stringify({
                            display_text: "🌐 Buka Website",
                            url: deployment.url
                          })
                        },
                        {
                          name: "cta_copy",
                          buttonParamsJson: JSON.stringify({
                            display_text: "📋 Copy URL Website",
                            copy_code: deployment.url
                          })
                        },
                        {
                          name: "quick_reply",
                          buttonParamsJson: JSON.stringify({
                            display_text: "📋 List Website Saya",
                            id: ".listdeploy"
                          })
                        }
                      ]
                    }
                  }
                }
              }
            },
            { quoted: null }
          );

          await conn.relayMessage(chatId, successMsg.message, { messageId: successMsg.key.id });
          return true;
        }
        else if (status === 'failed') {
          updateDeploymentStatus(sessionId, 'failed');
          
          const failedText = `❌ *DEPLOYMENT GAGAL* \n${'═'.repeat(20)}\n` +
                           `📛 ${projectName} \n` +
                           `🌐 ${websiteUrl} \n\n` +
                           `💥 Error: ${message || 'Unknown error'} \n\n` +
                           `🔄 Silakan coba lagi dengan *.deploy*`;
          
          await updateMessage(failedText);
          return true;
        }
        
        // Update pesan dengan status terbaru
        const currentStatus = message || 'Processing...';
        const progressText = `🔍 *MEMANTAU DEPLOYMENT...* \n${'═'.repeat(20)}\n\n` +
                           `📛 ${projectName}\n` +
                           `🌐 ${websiteUrl}\n\n` +
                           `⏳ Status: ${currentStatus}\n` +
                           `⏰ Estimasi: 1-5 menit\n` +
                           `🔍 Attempt: ${attempts}/${maxAttempts}`;
        
        await updateMessage(progressText);
        
      }
    } catch (error) {
      console.error('Status check error:', error);
      
      // Update pesan dengan error
      const errorText = `🔍 *MEMANTAU DEPLOYMENT...* \n${'═'.repeat(20)}\n\n` +
                       `📛 ${projectName}\n` +
                       `🌐 ${websiteUrl}\n\n` +
                       `❌ Error: Gagal cek status\n` +
                       `⏰ Estimasi: 1-5 menit\n` +
                       `🔍 Attempt: ${attempts}/${maxAttempts}`;
      
      await updateMessage(errorText);
    }
    
    if (attempts >= maxAttempts) {
      const timeoutText = `⏰ *Monitoring Timeout* \n${'═'.repeat(20)}\n\n` +
                         `📛 ${projectName}\n` +
                         `🌐 ${websiteUrl}\n\n` +
                         `Deployment masih diproses. Cek website Anda secara manual dalam beberapa menit.\n\n` +
                         `Gunakan *.checkstatus ${sessionId}* untuk cek status terbaru.`;
      
      await updateMessage(timeoutText);
      return true;
    }
    
    return false;
  };
  
  // Check every 5 seconds
  const interval = setInterval(async () => {
    const done = await checkStatus();
    if (done) {
      clearInterval(interval);
    }
  }, 5000);
}

// Helper functions
async function waitForMessage(conn, jid, timeout = 60000) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      conn.ev.off("messages.upsert", listener);
      resolve(null);
    }, timeout);
    
    const listener = async (chatUpdate) => {
      try {
        const msg = chatUpdate.messages?.[0];
        if (!msg || !msg.key) return;
        if (msg.key.remoteJid !== jid || msg.key.fromMe) return;
        
        const hasText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        const hasButton = msg.message?.templateButtonReplyMessage;
        if (hasText || hasButton) {
          clearTimeout(timeoutId);
          conn.ev.off("messages.upsert", listener);
          resolve(msg);
        }
      } catch (error) {
        console.error('Error in waitForMessage:', error);
      }
    };
    
    conn.ev.on("messages.upsert", listener);
  });
}

function extractTextFromMessage(msg) {
  return (
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    ""
  );
}

// Quick reply handlers
const quickReplyHandlers = {
  '.deploy': handler,
  '.confirmdeploy': async (m, conn) => {
    await conn.sendMessage(m.chat, { 
      text: "✅ Konfirmasi diterima! Melanjutkan deployment...",
      contextInfo: contextInfoConfig
    });
  },
  '.changedata': async (m, conn) => {
    await conn.sendMessage(m.chat, { 
      text: "✏️ Ketik .deploy untuk mengisi data baru",
      contextInfo: contextInfoConfig
    });
  },
  '.cancel': async (m, conn) => {
    await conn.sendMessage(m.chat, { 
      text: "❌ Deployment dibatalkan",
      contextInfo: contextInfoConfig
    });
  },
  '.checkstatus': async (m, conn) => {
    const sessionId = m.text.split(' ')[1];
    if (sessionId) {
      await checkDeploymentStatus(conn, m.chat, sessionId);
    } else {
      await conn.sendMessage(m.chat, { 
        text: "❌ Format: .checkstatus <session_id>",
        contextInfo: contextInfoConfig
      });
    }
  }
};

// Export quick reply handlers
handler.quickReplyHandlers = quickReplyHandlers;

// Command handlers
handler.help = ["deploy"];
handler.tags = ["tools", "deployment"];
handler.command = ["deploy", "deploywebsite"];
handler.register = true;

export default handler;
