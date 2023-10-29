const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateAndStoreEmbeddings() {
    try {
        const loader = new PDFLoader("./documents/document.pdf");
        const docs = await loader.load();

        const vectorStore = await HNSWLib.fromDocuments(
            docs,
            new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
        );
        vectorStore.save("embeddings");
        console.log("embeddings created");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// generateAndStoreEmbeddings();
module.exports = { generateAndStoreEmbeddings };
