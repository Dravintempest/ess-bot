const handler = async (m, { conn }) => {
  await conn.sendMessage(
    m.chat,
    {
      productMessage: {
        title: "tes",
        description: "penis",
        thumbnail: "https://files.catbox.moe/jlkib4.png",
        productId: "123456789",
        retailerId: "TOKOKU",
        url: "https://files.catbox.moe/jlkib4.png",
        body: "penis",
        footer: "wabot",
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "K",
              url: "https://google.com",
            }),
          },
        ],
      },
    },
    { quoted: m }
  );
};

handler.help = ["testing"];
handler.tags = ["tools"];
handler.command = ["testing"];
handler.limit = 1;

export default handler;
