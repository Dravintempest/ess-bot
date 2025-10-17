const handler = async (m, { conn, args }) => {
  if (args.length < 3)
    return m.reply(`❌ Format salah!\n\nContoh:\n.reactch https://whatsapp.com/channel/0029VbApgwQGU3BJWSbXUF0R 175 🤣`);

  const [link, messageId, emoji] = args;

  if (!link.includes("https://whatsapp.com/channel/"))
    return m.reply("❌ Link saluran tidak valid!");

  try {
    // ambil ID channel dari link
    const result = link.split("https://whatsapp.com/channel/")[1];

    // ambil metadata buat dapetin id newsletter beneran
    const res = await conn.newsletterMetadata("invite", result);
    const channelId = `${res.id}@newsletter`;

    await conn.newsletterReactMessage(channelId, messageId, emoji);

    m.reply(`✅ Berhasil react ${emoji} ke pesan ${messageId}\n📡 Saluran: ${res.name}`);
  } catch (err) {
    console.error(err);
    m.reply(`❌ Gagal react ke saluran.\n\n${err.message}`);
  }
};

handler.help = ["reactch <link_channel> <id_pesan> <emoji>"];
handler.tags = ["tools"];
handler.command = ["reactch"];
handler.limit = 1;

export default handler;
