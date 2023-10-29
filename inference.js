const { OpenAI } = require("langchain/llms/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RetrievalQAChain } = require("langchain/chains");
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = new OpenAI({ modelName: "gpt-3.5-turbo" });

async function ask(question) {
    try {
        const vectorStore = await HNSWLib.load(
            "embeddings",
            new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
        );

        const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
        const result = await chain.call({
            query: question,
        });

        console.log(result);
        return result.text;
    } catch (error) {
        console.error(error);
        return "AI model failed to retrieve information";
    }
}

// const question = "What is the prep time for each recipe?";
// ask(question);
module.exports = { ask };
