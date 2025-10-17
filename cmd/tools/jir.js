import baileys from "@whiskeysockets/baileys";
const { proto } = baileys;

const handler = async (m, { conn }) => {
  const target = m.chat;

  await conn.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: "TsM Snøwi",
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    icon: "REVIEW",
                    flow_cta: "\0",
                    flow_message_version: "3",
                  }),
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    icon: "PROMOTION",
                    flow_cta: "\0",
                    flow_message_version: "3",
                  }),
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    icon: "DOCUMENT",
                    flow_cta: "\0",
                    flow_message_version: "3",
                  }),
                },
                {
                  name: "galaxy_message",
                  buttonParamsJson: JSON.stringify({
                    icon: "DEFAULT",
                    flow_cta: "\0",
                    flow_message_version: "3",
                  }),
                },
              ],
              messageParamsJson: "",
            },
          },
        },
      },
    },
    {}
  );
};

handler.help = ["testt"];
handler.tags = ["owner"];
handler.command = ["testt"];

export default handler;
