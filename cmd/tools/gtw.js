import baileys from "@whiskeysockets/baileys";

const {
    generateWAMessageFromContent,
    prepareWAMessageMedia
} = baileys;

let handler = async (m, { conn, user }) => {
    
    let password = 'PasswordContoh123';
    let Randomimagebyvynnox = 'https://files.catbox.moe/254wej.jpg';
    let pan = `-Panerudēta`;

    let msg = generateWAMessageFromContent(
        m.chat,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: pan },
                        carouselMessage: {
                            cards: [
                                {
                                    header: baileys.proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia(
                                            { image: { url: Randomimagebyvynnox } },
                                            { upload: conn.waUploadToServer },
                                        )),
                                        title: ``,
                                        gifPlayback: true,
                                        subtitle: global.ownername,
                                        hasMediaAttachment: false,
                                    }),
                                    body: {
                                        text: `「 *[USER + LOGIN]* 」\n\n*[ ${global.title} ]*\n> • Jangan Spam/Mainin Bot\n> • Jangan Telpon/Call Bot\n> • Langgar Tanggung Konsekuensi`,
                                    },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: 'cta_url',
                                                buttonParamsJson: `{"display_text":"🚀 Login ( ${global.domain} )","url":"${global.domain}","merchant_url":"${global.domain}"}`,
                                            },
                                            {
                                                name: 'cta_copy',
                                                buttonParamsJson: `{"display_text": "✩ 🚀 Copy User","copy_code": "${user.username}"}`,
                                            },
                                        ],
                                    },
                                },
                                {
                                    header: baileys.proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia(
                                            { image: { url: Randomimagebyvynnox } },
                                            { upload: conn.waUploadToServer },
                                        )),
                                        title: ``,
                                        gifPlayback: true,
                                        subtitle: global.ownername,
                                        hasMediaAttachment: false,
                                    }),
                                    body: {
                                        text: `「 *[PW + CH DEV]* 」\n\n*[ ${global.title} ]*\n• Follow Dulu\n• Ch Dev Gw\n• Beli Prem Dll Chat Owner\n• Silahkan Gunakan Dengan Bijak`,
                                    },
                                    nativeFlowMessage: {
                                        buttons: [
                                            {
                                                name: 'cta_url',
                                                buttonParamsJson: `{"display_text":"  🚀  Saluran Dev ( ${global.title} )","url":"${global.chdev}","merchant_url":"${global.chdev}"}`,
                                            },
                                            {
                                                name: 'cta_copy',
                                                buttonParamsJson: `{"display_text": "✩ 🚀 Copy Pw","copy_code": "${password}"}`,
                                            },
                                        ],
                                    },
                                },
                            ],
                            messageVersion: 1,
                        },
                    },
                },
            },
        },
        {},
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.command = ["carousel"];
handler.help = ["carousel"];
handler.tags = ["main"];

export default handler;
