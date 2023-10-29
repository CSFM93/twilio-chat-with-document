const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const { generateAndStoreEmbeddings } = require('./embeddingsGenerator');
const { ask } = require('./inference');


function sendMessage(message, from, to) {
    twilioClient.messages
        .create({ body: message, from: from, to: to })
        .then((msg) => console.log(msg.sid));
};

async function saveDocument(mediaURL) {
    try {
        const fetch = (await import('node-fetch')).default;
        const filepath = './documents/document.pdf';
        return new Promise(async (resolve, reject) => {
            await fetch(mediaURL)
                .then((res) => {
                    res.body.pipe(fs.createWriteStream(filepath))
                    res.body.on("end", () => resolve(true));
                }).catch((error) => {
                    console.error(error)
                    resolve(false)
                });
        })
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function handleIncomingMessage(req) {
    const { Body } = req.body;
    let message = ""

    if (Body.toLowerCase().includes("/start")) {
        message = "Please send me the PDF document that you would like to chat with"
        return message
    } else {
        const question = Body;
        message = await ask(question);
        return message
    }
}

app.post('/incomingMessage', async (req, res) => {
    const { To, Body, From } = req.body;
    let message = ""

    if (req.body['MediaUrl0'] === undefined) {
        message = await handleIncomingMessage(req);
        sendMessage(message, To, From)
        return res.status(200)
    } else {
        message = "Please wait, it can take several seconds to process this document";
        sendMessage(message, To, From);

        const wasDocumentSaved = await saveDocument(req.body['MediaUrl0']);
        if (!wasDocumentSaved) {
            message = "Failed to save document";
            sendMessage(message, To, From);
            return res.status(200);
        }

        const wasEmbeddingsGenerated = await generateAndStoreEmbeddings();
        if (!wasEmbeddingsGenerated) {
            message = "Document embeddings were not generated";
            sendMessage(message, To, From);
            return res.status(200);
        }

        message = "Document embeddings were generated and stored, ask anything about the document";
        sendMessage(message, To, From);
        return res.status(200);
    }
});

app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
});
