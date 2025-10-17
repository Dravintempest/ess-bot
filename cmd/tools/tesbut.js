let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(
      m.chat,
      {
        interactiveMessage: {
          title: "wkwk",
          footer: "KyuuTheGreat",
          thumbnail: "https://github.com/kiuur.png",
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              limited_time_offer: {
                text: "shenń, yes 1437",
                url: "t.me/brando",
                copy_code: "shenń, yes 1437",
                expiration_time: Date.now() * 999
              },
              bottom_sheet: {
                in_thread_buttons_limit: 2,
                divider_indices: [1, 2, 3, 4, 5, 999],
                list_title: "shennminè",
                button_title: "shenń"
              },
              tap_target_configuration: {
                title: "▸ X ◂",
                description: "bomboclard",
                canonical_url: "https://t.me/sh3nnmine",
                domain: "shop.example.com",
                button_index: 0
              }
            }),
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  has_multiple_buttons: true
                })
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({
                  has_multiple_buttons: true
                })
              },
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "shennminè",
                  sections: [
                    {
                      title: "# X - the best",
                      highlight_label: "label",
                      rows: [
                        {
                          title: "@kyuucode",
                          description: "sh3nnmine",
                          id: "row_2"
                        }
                      ]
                    }
                  ],
                  has_multiple_buttons: true
                })
              },
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "shennminè",
                  id: "123456789",
                  copy_code: "https://t.me/sh3nnmine"
                })
              }
            ]
          }
        }
      },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply("❌ Gagal kirim interactive message.");
  }
};

handler.help = ["tesbut"];
handler.tags = ["tools"];
handler.command = ["tesbut"];
handler.limit = 1;

export default handler;
