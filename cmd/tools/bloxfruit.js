import axios from "axios";
import baileys from "@whiskeysockets/baileys";
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = baileys;

const handler = async (m, { conn }) => {
  try {
    // ambil data dari API Rijalganzz pakai axios
    const { data } = await axios.get("https://rijalganzz.web.id/search/bloxfruit", {
      headers: {
        "User-Agent": "Mozilla/5.0 (DravinBot)",
        "Accept": "application/json"
      }
    });

    if (!data.status) return m.reply("❌ Gagal ambil data dari API.");

    // ambil list buah
    const fruits = data.data.slice(0, 8);
    const cards = [];

    for (const fruit of fruits) {
      const img = fruit.thumb || "https://files.catbox.moe/jlkib4.png";

      // generate satu kartu per buah
      const media = await prepareWAMessageMedia(
        { image: { url: img } },
        { upload: conn.waUploadToServer }
      );

      cards.push({
        header: proto.Message.InteractiveMessage.Header.create({
          ...media,
          title: fruit.name,
          subtitle: fruit.type,
          hasMediaAttachment: true,
        }),
        body: { text: `💸 Harga Dollar: *${fruit.priceDolar}*\n💰 Harga R$: *${fruit.priceR}*` },
        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "📋 Copy Nama",
                copy_code: fruit.name,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "🌐 Website",
                url: "https://rijalganzz.web.id",
                merchant_url: "https://rijalganzz.web.id",
              }),
            },
          ],
        },
      });
    }

    // kirim carousel ke chat
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: "🍇 *BloxFruit Stock Hari Ini*" },
              carouselMessage: { cards, messageVersion: 1 },
            },
          },
        },
      },
      {}
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.command = ["bloxfruit"];
handler.help = ["bloxfruit"];
handler.tags = ["info"];

export default handler;
