const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require('./db');
const app = express();
const { loadDataset, recommendCrop } = require('./agents/farmerAdvisorAgent');
const { loadMarketDataset, recommendTopCrops } = require("./agents/marketResearcherAgent");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

loadDataset();
loadMarketDataset();
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.post("/api/farmer-input", (req, res) => {
    const { soil_pH, soil_moisture, temperature, rainfall, crop_preference, budget } = req.body;
  
    db.run(
      `INSERT INTO farmer_inputs (soil_pH, soil_moisture, temperature, rainfall, crop_preference, budget)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [soil_pH, soil_moisture, temperature, rainfall, crop_preference, budget],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Failed to save input" });
        }
        res.json({ success: true, id: this.lastID });
      }
    );
  });

  app.post("/api/farmer-advice", (req, res) => {
    const { soil_pH, soil_moisture, temperature, rainfall } = req.body;
  
    const recommendation = recommendCrop({ soil_pH, soil_moisture, temperature, rainfall });
  
    if (recommendation) {
      res.json(recommendation);
    } else {
      res.status(404).json({ error: "No recommendation found" });
    }
  });

  app.get("/api/market-advice", (req, res) => {
    const recommendations = recommendTopCrops(3);
    res.json({ top_crops: recommendations });
  });
  
  app.post("/api/combined-advice", async (req, res) => {
    const { farmerAdvice, marketCrops } = req.body;
  
    const prompt = `
  You are an agricultural AI advisor.
  
  The farmer provided soil and weather data. Based on analysis, here’s the recommendation:
  - Suggested Crop: ${farmerAdvice.suggested_crop}
  - Fertilizer Required: ${farmerAdvice.fertilizer_kg} kg
  - Pesticide Required: ${farmerAdvice.pesticide_kg} kg
  - Expected Yield: ${farmerAdvice.estimated_yield_ton} tons
  - Sustainability Score: ${farmerAdvice.sustainability_score}
  
  Meanwhile, the market shows profitable crops:
  ${marketCrops.map((c, i) => `${i + 1}. ${c.product} — ₹${c.price} per ton`).join("\n")}
  
  Now provide a short, helpful recommendation to the farmer combining these insights. Suggest trade-offs if necessary.
  `;
  
    try {
      const ollamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "tinyllama",
          prompt,
          stream: false
        })
      });
  
      const data = await ollamaRes.json();
  
      // ✅ Save the entire session in SQLite using Prisma
      await prisma.farmerSession.create({
        data: {
          suggested_crop: farmerAdvice.suggested_crop,
          fertilizer_kg: parseFloat(farmerAdvice.fertilizer_kg),
          pesticide_kg: parseFloat(farmerAdvice.pesticide_kg),
          estimated_yield_ton: parseFloat(farmerAdvice.estimated_yield_ton),
          sustainability_score: parseFloat(farmerAdvice.sustainability_score),
          ai_message: data.response,
          soil_pH: parseFloat(farmerAdvice.soil_pH ?? "0"),
          soil_moisture: parseFloat(farmerAdvice.soil_moisture ?? "0"),
          temperature: parseFloat(farmerAdvice.temperature ?? "0"),
          rainfall: parseFloat(farmerAdvice.rainfall ?? "0"),
          createdAt: new Date()
        }
      });
      
      
  
      // ✅ Send AI message back to the app
      res.json({ message: data.response });
  
    } catch (err) {
      console.error("Ollama error:", err);
      res.status(500).json({ error: "AI generation failed" });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const sessions = await prisma.farmerSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 10
      });
      res.json(sessions);
    } catch (err) {
      console.error("Error fetching history:", err);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });
  
  app.post("/api/chat", async (req, res) => {
    const { question } = req.body;
  
    const prompt = `
  You are an agricultural expert AI. Provide short, clear and practical answers to farmers' questions.
  
  Farmer asked: "${question}"
  Your answer:
    `;
  
    try {
      const ollamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "tinyllama",
          prompt,
          stream: false
        })
      });
  
      const data = await ollamaRes.json();
      res.json({ answer: data.response });
    } catch (err) {
      console.error("Chatbot error:", err);
      res.status(500).json({ error: "AI chat failed" });
    }
  });
  
  

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

