const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-pro as it's the standard stable model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function callGemini(userMessage) {
    try {
        console.log("Calling Gemini with:", userMessage);

        // Extract message text
        let messageText = userMessage;
        if (Array.isArray(userMessage)) {
            const lastUserMsg = userMessage.filter(m => m.role === "user").pop();
            messageText = lastUserMsg?.content || "Hello";
        }

        const prompt = `You are Welloh, an expert nutritionist and compassionate diet coach. 
        Your goal is to help users achieve their health goals through balanced nutrition.
        
        Strictly follow these rules:
        1. If asked for a diet plan, provide a structured plan (Breakfast, Lunch, Dinner, Snack).
        2. Keep Vegetarian requests strictly vegetarian (No eggs, No meat).
        3. If the user mentions "Paneer", include it!
        4. Focus on Indian context if the query implies Indian food.
        5. Keep responses concise, encouraging, and easy to read.

        User Question: ${messageText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I'm having trouble connecting to my AI brain. Please try again! (Gemini Error)";
    }
}

router.post("/chat", async (req, res) => {
    const userMessage = req.body.userMessage;
    // Log message to seeing incoming requests
    console.log("Chat Request Received");

    try {
        const response = await callGemini(userMessage);
        res.json(response);
    } catch (error) {
        console.error("Error details:", error);
        res.json("Connection error. Please try again.");
    }
});

router.post("/init", async (req, res) => {
    const userData = req.body.userData || "No user data available";
    const system_prompt = `You are Welloh, my personal nutrition assistant. Here is my profile: ${userData}`;
    const welcome = "Hello! I'm Welloh powered by Gemini AI. I can create personalized diet plans for you. What are your health goals today?";

    res.json([{ role: "system", content: system_prompt }, { role: "assistant", content: welcome }]);
});

module.exports = router;
