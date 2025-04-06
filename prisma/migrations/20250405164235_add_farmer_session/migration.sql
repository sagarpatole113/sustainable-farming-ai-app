-- CreateTable
CREATE TABLE "FarmerSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "suggested_crop" TEXT NOT NULL,
    "fertilizer_kg" REAL NOT NULL,
    "pesticide_kg" REAL NOT NULL,
    "estimated_yield_ton" REAL NOT NULL,
    "sustainability_score" REAL NOT NULL,
    "ai_message" TEXT NOT NULL,
    "soil_pH" REAL NOT NULL,
    "soil_moisture" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "rainfall" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
