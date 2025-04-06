const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let marketData = [];

function loadMarketDataset() {
  marketData = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "../datasets/market_researcher_dataset.csv"))
      .pipe(csv())
      .on("data", (row) => marketData.push(row))
      .on("end", () => {
        console.log("Market dataset loaded ✅");
        resolve(marketData);
      })
      .on("error", reject);
  });
}

function recommendTopCrops(limit = 3) {
  // Score crops by: (Demand_Index - Supply_Index) * Economic_Indicator * Weather_Impact_Score
  const scored = marketData.map((row) => {
    const score =
      (parseFloat(row.Demand_Index) - parseFloat(row.Supply_Index)) *
      parseFloat(row.Economic_Indicator) *
      parseFloat(row.Weather_Impact_Score || 1);

    return { product: row.Product, price: row.Market_Price_per_ton, score };
  });

  // Sort by score descending
  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.slice(0, limit);
}

module.exports = {
  loadMarketDataset,
  recommendTopCrops
};
