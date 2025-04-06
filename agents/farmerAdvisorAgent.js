const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let advisorData = [];

function loadDataset() {
  advisorData = []; // Clear before loading

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "../datasets/farmer_advisor_dataset.csv"))
      .pipe(csv())
      .on("data", (row) => advisorData.push(row))
      .on("end", () => {
        console.log("Farmer dataset loaded ✅");
        resolve(advisorData);
      })
      .on("error", reject);
  });
}

function recommendCrop({ soil_pH, soil_moisture, temperature, rainfall }) {
  // Find the most similar row (naive approach)
  let bestMatch = null;
  let minDiff = Infinity;

  for (const row of advisorData) {
    const diff =
      Math.abs(row.Soil_pH - soil_pH) +
      Math.abs(row.Soil_Moisture - soil_moisture) +
      Math.abs(row.Temperature_C - temperature) +
      Math.abs(row.Rainfall_mm - rainfall);

    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = row;
    }
  }

  if (bestMatch) {
    return {
      suggested_crop: bestMatch.Crop_Type,
      fertilizer_kg: bestMatch.Fertilizer_Usage_kg,
      pesticide_kg: bestMatch.Pesticide_Usage_kg,
      estimated_yield_ton: bestMatch.Crop_Yield_ton,
      sustainability_score: bestMatch.Sustainability_Score
    };
  }

  return null;
}

module.exports = {
  loadDataset,
  recommendCrop
};
