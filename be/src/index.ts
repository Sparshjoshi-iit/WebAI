import express from "express";
import cors from "cors";
import GroqSDK from "groq-sdk";
import dotenv from "dotenv";
import { BASE_PROMPT, getSystemPrompt } from "./prompts.js";
import { basePrompt as reactBasePrompt } from "./defaults/react.js";
import { basePrompt as nodeBasePrompt } from "./defaults/node.js";

dotenv.config();

// 1. Initialize Groq Client
const Groq = (GroqSDK as any).default || GroqSDK;
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

//create the http server
const app = express();
app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    
    const response = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: "You must respond with ONLY one word: either 'react' or 'node'. No other text, no explanation, no markdown. Just the single word 'react' or 'node'."
            },
            {
                role: 'user',
                content: `Classify this project type (respond with ONLY 'react' or 'node'): ${prompt}`
            }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 10,
        temperature: 0.1      
    })

    const answer = response.choices[0]?.message?.content?.trim().toLowerCase(); // react or node
    console.log("Model response:", answer); // Debug log
    
    // Check if answer contains 'react' or 'node'
    if (answer?.includes("react")) {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }

    if (answer?.includes("node")) {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }

    res.status(403).json({message: "You cant access this", receivedAnswer: answer})
    return;

})

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    
    console.log("Received messages:", messages?.length, "messages");
    
    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "messages must be an array" });
    }
    
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt()
                },
                ...messages
            ],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 8000,
            temperature: 0.3      
        });

        console.log("Response received, length:", response.choices[0]?.message?.content?.length);

        res.json({
            response: response.choices[0]?.message?.content
        });
    } catch (error) {
        console.error("Groq API error:", error);
        res.status(500).json({ 
            error: "Failed to generate code",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
})

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});