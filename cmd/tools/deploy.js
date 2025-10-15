// deploy.js - Bot WA Deployment dengan CTA Copy & URL + Quick Reply
import fs from "fs-extra";
import axios from "axios";
import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

const DEPLOY_API_URL = "https://www.esscloud.my.id/api";
const URL_HOME = "https://www.esscloud.my.id";

// Handler untuk quick reply
const quickReplyHandlers = {
  // Handler untuk deploy
  '.deploy': async (m, conn) => {
    await handler(m, { conn });
  },
  
  // Handler untuk konfirmasi deploy
  '.confirmdeploy': async (m, conn) => {
    const chatId = m.chat;
    await conn.sendMessage(chatId, {
      text: "✅ Konfirmasi diterima! Melanjutkan deployment..."
    });
    // Simpan state konfirmasi untuk proses deployment
    // (akan dihandle di main handler)
  },
  
  // Handler untuk edit data
  '.changedata': async (m, conn) => {
    const chatId = m.chat;
    await conn.sendMessage(chatId, {
      text: "✏️ Silakan ketik *.deploy* lagi untuk mengisi data baru."
    });
  },
  
  // Handler untuk batalkan
  '.cancel': async (m, conn) => {
    const chatId = m.chat;
    await conn.sendMessage(chatId, {
      text: "❌ Deployment dibatalkan. Ketik *.deploy* jika ingin mencoba lagi."
    });
  },
  
  // Handler untuk cek status
  '.checkstatus': async (m, conn) => {
    const chatId = m.chat;
    const args = m.text.split(' ');
    const sessionId = args[1];
    
    if (sessionId) {
      await conn.sendMessage(chatId, {
        text: `🔍 Mengecek status deployment...\nSession ID: ${sessionId}`
      });
      // Panggil fungsi cek status
      await checkDeploymentStatus(conn, chatId, sessionId);
    } else {
      await conn.sendMessage(chatId, {
        text: "❌ Format: .checkstatus <session_id>"
      });
    }
  },
  
  // Handler untuk list deploy
  '.listdeploy': async (m, conn) => {
    await listDeployments(m, { conn });
  },
  
  // Handler untuk bantuan
  '.help': async (m, conn) => {
    const chatId = m.chat;
    await conn.sendMessage(chatId, {
      text: `🆘 *BANTUAN DEPLOYMENT* \n${'═'.repeat(30)}\n\n` +
            `*.deploy* - Buat website baru\n` +
            `*.listdeploy* - Lihat website Anda\n` +
            `*.checkstatus <id>* - Cek status deploy\n\n` +
            `💡 *Cara Deployment:*\n` +
            `1. Ketik *.deploy*\n` +
            `2. Isi format project & subdomain\n` +
            `3. Konfirmasi deployment\n` +
            `4. Upload file ZIP website\n` +
            `5. Website otomatis live!`
    });
  }
};

let handler = async (m, { conn }) => {
  const chatId = m.chat;
  const userId = m.sender.split('@')[0];
  const isGroup = m.chat.endsWith('@g.us');
  
  // State management untuk tracking proses deployment user
  const userState = {};
  
  try {
    // Jika di grup, kirim pesan awal ke private chat
    if (isGroup) {
      await conn.sendMessage(m.sender, {
        text: `👋 *Halo!* \n\nSaya melihat Anda ingin deploy website di grup. \nUntuk keamanan, kita lanjutkan di chat private ya! \n\nSilakan ketik *${m.text}* lagi di sini.`
      });
      
      await conn.sendMessage(chatId, {
        text: `📩 *Check Private Chat!* \n\n@${userId.split('@')[0]}, saya sudah kirim instruksi deploy ke chat private Anda. \nSilakan cek pesan dari saya.`,
        mentions: [m.sender]
      });
      return;
    }

    // ========== PROSES DEPLOYMENT DI PRIVATE CHAT ==========
    
    // Step 1: Kirim format dengan tombol copy interaktif
    const deployFormat = `📋 *FORMAT DEPLOYMENT* \n${'═'.repeat(30)}\n\n` +
                        `project: Nama Project Anda\n` +
                        `subdomain: subdomain-anda\n\n` +
                        `${'═'.repeat(30)}\n` +
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
      text: `🔄 *LANGKAH SELANJUTNYA* \n${'═'.repeat(30)}\n\n` +
            `1. 📋 Copy format di atas\n` +
            `2. 📝 Edit dengan data project Anda\n` +
            `3. 📤 Kirim format yang sudah diisi di sini\n\n` +
            `⏰ *Timeout: 2 menit*\n\n` +
            `Atau klik "Mulai Deploy" untuk menggunakan format default`
    });

    const formatMsg = await waitForMessage(conn, chatId, 120000);
    if (!formatMsg) {
      await conn.sendMessage(chatId, {
        text: `⏰ *Waktu Habis* \n\nSilakan ketik *${m.text}* lagi untuk memulai ulang.`
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
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                  body: { 
                    text: `❌ *FORMAT TIDAK VALID* \n${'═'.repeat(30)}\n\n` +
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
        text: `❌ *NAMA PROJECT TIDAK VALID* \n\nMinimal 2 karakter. Silakan coba lagi dengan *.deploy*`
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
        text: `❌ *SUBDOMAIN TERLALU PENDEK* \n\nMinimal 3 karakter. Silakan coba lagi dengan *.deploy*`
      });
      return;
    }
    
    if (subdomain.length > 30) {
      await conn.sendMessage(chatId, {
        text: `❌ *SUBDOMAIN TERLALU PANJANG* \n\nMaksimal 30 karakter. Silakan coba lagi dengan *.deploy*`
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
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: {
              body: { 
                text: `📋 *KONFIRMASI DEPLOYMENT* \n${'═'.repeat(30)}\n\n` +
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

    // Simpan data user untuk proses selanjutnya
    userState[userId] = { projectName, subdomain, websiteUrl, step: 'confirmation' };

    const confirmResponse = await waitForMessage(conn, chatId, 60000);
    if (!confirmResponse) {
      await conn.sendMessage(chatId, {
        text: `⏰ *Waktu Konfirmasi Habis* \n\nDeployment dibatalkan.`
      });
      delete userState[userId];
      return;
    }

    // Handle response konfirmasi
    const responseText = extractTextFromMessage(confirmResponse);
    const selectedId = confirmResponse.message?.templateButtonReplyMessage?.selectedId;

    if (selectedId === '.cancel' || responseText.includes('.cancel')) {
      await conn.sendMessage(chatId, {
        text: `❌ *Deployment Dibatalkan* \n\nKapan saja siap deploy, tinggal ketik *.deploy* ya! 😊`
      });
      delete userState[userId];
      return;
    }

    if (selectedId === '.changedata' || responseText.includes('.changedata')) {
      await conn.sendMessage(chatId, {
        text: `🔄 *Mengulang Proses* \n\nSilakan ketik *.deploy* lagi untuk mengisi data baru.`
      });
      delete userState[userId];
      return;
    }

    // Jika konfirmasi deploy
    if (selectedId === '.confirmdeploy' || responseText.includes('.confirmdeploy') || 
        responseText.toLowerCase().includes('ya') || responseText.toLowerCase().includes('deploy')) {
      
      await conn.sendMessage(chatId, {
        text: `⏳ *MEMULAI DEPLOYMENT...* \n${'═'.repeat(30)}\n\n` +
              `📛 ${projectName}\n` +
              `🌐 ${websiteUrl}\n\n` +
              `🔄 Membuat session deployment...`
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

      // Update user state
      userState[userId] = { ...userState[userId], sessionId, step: 'upload' };

      // Step 5: Kirim instruksi upload dengan CTA buttons
      const uploadInstructionMsg = generateWAMessageFromContent(
        chatId,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: {
                body: { 
                  text: `🎉 *SESSION BERHASIL DIBUAT!* \n${'═'.repeat(30)}\n\n` +
                        `📛 *Project:* ${projectName}\n` +
                        `🌐 *Website:* ${websiteUrl}\n` +
                        `📦 *Session ID:* ${sessionId}\n${'═'.repeat(30)}\n\n` +
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

      // Hapus state setelah deployment dimulai
      delete userState[userId];

    } else {
      await conn.sendMessage(chatId, {
        text: `❌ *Respon Tidak Dikenali* \n\nDeployment dibatalkan. Ketik *.deploy* untuk memulai ulang.`
      });
      delete userState[userId];
    }

  } catch (error) {
    console.error("Deploy Error:", error);
    delete userState[userId];
    
    let errorMsg = `❌ *DEPLOYMENT GAGAL* \n${'═'.repeat(30)}\n`;
    
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
                      display_text: "❓ Bantuan", 
                      id: ".help"
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
    const statusResponse = await axios.get(`${DEPLOY_API_URL}/deployment-status/${sessionId}`);
    
    if (statusResponse.data.success) {
      const { status, deployment, message } = statusResponse.data;
      
      if (status === 'success' && deployment) {
        await conn.sendMessage(chatId, {
          text: `✅ *DEPLOYMENT SUCCESS* \n\nWebsite: ${deployment.url}\nStatus: Live 🟢`
        });
      } else if (status === 'failed') {
        await conn.sendMessage(chatId, {
          text: `❌ *DEPLOYMENT FAILED* \n\nError: ${message}`
        });
      } else {
        await conn.sendMessage(chatId, {
          text: `⏳ *DEPLOYMENT IN PROGRESS* \n\nStatus: ${message || 'Processing...'}`
        });
      }
    }
  } catch (error) {
    await conn.sendMessage(chatId, {
      text: `❌ *Gagal cek status* \n\nError: ${error.message}`
    });
  }
}

// Monitor deployment dengan CTA buttons
async function monitorDeployment(conn, chatId, sessionId, userId, projectName, subdomain) {
  let attempts = 0;
  const maxAttempts = 60;
  const websiteUrl = `https://${subdomain}.esscloud.web.id`;

  // Kirim pesan monitoring dengan tombol
  const monitoringMsg = generateWAMessageFromContent(
    chatId,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: { 
              text: `🔍 *MEMANTAU DEPLOYMENT...* \n${'═'.repeat(30)}\n\n` +
                    `📛 ${projectName}\n` +
                    `🌐 ${websiteUrl}\n\n` +
                    `⏳ Status: Menunggu upload file...\n` +
                    `⏰ Estimasi: 1-5 menit\n` +
                    `🔍 Attempt: 1/${maxAttempts}`
            },
            footer: { text: "Ess Cloud Deployment" },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🔄 Refresh Status",
                    id: `.checkstatus ${sessionId}`
                  })
                },
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🌐 Buka Website",
                    url: websiteUrl
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

  await conn.relayMessage(chatId, monitoringMsg.message, { messageId: monitoringMsg.key.id });

  const checkStatus = async () => {
    try {
      attempts++;
      
      const statusResponse = await axios.get(`${DEPLOY_API_URL}/deployment-status/${sessionId}`);
      
      if (statusResponse.data.success) {
        const { status, deployment, message } = statusResponse.data;
        
        if (status === 'success' && deployment) {
          // Deployment success dengan CTA buttons
          const successMsg = generateWAMessageFromContent(
            chatId,
            {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                  },
                  interactiveMessage: {
                    body: { 
                      text: `🎉 *DEPLOYMENT BERHASIL!* \n${'═'.repeat(30)}\n\n` +
                            `📛 *Project:* ${deployment.projectName}\n` +
                            `🌐 *Website:* ${deployment.url}\n` +
                            `📅 *Waktu:* ${new Date(deployment.createdAt).toLocaleString('id-ID')}\n` +
                            `⚡ *Server:* ${deployment.server}\n${'═'.repeat(30)}\n\n` +
                            `✅ *Website Anda sudah LIVE!*\n\n` +
                            `💡 *Tips:*\n` +
                            `• DNS mungkin butuh 2-30 menit untuk propagasi penuh\n` +
                            `• Buka website untuk testing\n` +
                            `• Gunakan *.listdeploy* untuk lihat semua website`
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
          // Deployment failed
          await conn.sendMessage(chatId, {
            text: `❌ *DEPLOYMENT GAGAL* \n${'═'.repeat(30)}\n` +
                  `📛 ${projectName} \n` +
                  `🌐 ${websiteUrl} \n\n` +
                  `💥 Error: ${message || 'Unknown error'} \n\n` +
                  `🔄 Silakan coba lagi dengan *.deploy*`
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
    
    if (attempts >= maxAttempts) {
      const timeoutMsg = generateWAMessageFromContent(
        chatId,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage: {
                body: { 
                  text: `⏰ *Monitoring Timeout* \n${'═'.repeat(30)}\n\n` +
                        `📛 ${projectName}\n` +
                        `🌐 ${websiteUrl}\n\n` +
                        `Deployment masih diproses. Cek website Anda secara manual dalam beberapa menit.\n\n` +
                        `Gunakan *.listdeploy* untuk melihat status deployment.`
                },
                footer: { text: "Ess Cloud Deployment" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "cta_url",
                      buttonParamsJson: JSON.stringify({
                        display_text: "🌐 Buka Website",
                        url: websiteUrl
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
        { quoted: null }
      );

      await conn.relayMessage(chatId, timeoutMsg.message, { messageId: timeoutMsg.key.id });
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

// Export quick reply handlers
handler.quickReplyHandlers = quickReplyHandlers;

// Command handlers
handler.help = ["deploy"];
handler.tags = ["tools", "deployment"];
handler.command = ["deploy", "deploywebsite"];
handler.register = true;

export default handler;
