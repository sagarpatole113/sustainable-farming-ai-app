import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from "react-native";

export default function App() {
  const [form, setForm] = useState({
    soil_pH: "",
    soil_moisture: "",
    temperature: "",
    rainfall: "",
    crop_preference: "",
    budget: ""
  });

  const [advice, setAdvice] = useState<any>(null);
  const [marketCrops, setMarketCrops] = useState<any[]>([]);
  const [combinedMessage, setCombinedMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);



  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      // Step 1: Fetch farmer advice
      const farmerRes = await fetch("http://localhost:3001/api/farmer-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soil_pH: parseFloat(form.soil_pH),
          soil_moisture: parseFloat(form.soil_moisture),
          temperature: parseFloat(form.temperature),
          rainfall: parseFloat(form.rainfall)
        })
      });
  
      const farmerData = await farmerRes.json();
  
      // Step 2: Fetch market crops
      const marketRes = await fetch("http://localhost:3001/api/market-advice");
      const marketData = await marketRes.json();
      const crops = marketData.top_crops || [];
  
      // Step 3: Fetch combined advice using both
      const combinedRes = await fetch("http://localhost:3001/api/combined-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerAdvice: farmerData,
          marketCrops: crops
        })
      });
  
      const combinedData = await combinedRes.json();
  
      // ✅ Step 4: Only update UI after all data is ready
      setAdvice(farmerData);
      setMarketCrops(crops);
      setCombinedMessage(combinedData.message);
  
      await fetchHistory();
      setLoading(false);
    } catch (error) {
      console.error("Error fetching complete advice flow:", error);
    }
  };  
  
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/history");
      const data = await res.json();
      setHistory(data); // <-- we'll define setHistory next
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>🌾 Sustainable Farming Advisor</Text>

      {["soil_pH", "soil_moisture", "temperature", "rainfall", "crop_preference", "budget"].map((field) => (
        <TextInput
          key={field}
          placeholder={field.replace("_", " ")}
          keyboardType="numeric"
          style={styles.input}
          onChangeText={(text) => handleChange(field, text)}
          value={(form as any)[field]}
        />
      ))}

      <Button title="Get Advice" onPress={submitForm} />

      {loading && (
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16 }}>⏳ Generating AI-powered advice...</Text>
      </View>
       )}
      {!loading && advice && (
        <View style={styles.result}>
          <Text style={styles.heading}>🌾 Sustainable Advice</Text>
          <Text>🌱 Recommended Crop: {advice.suggested_crop}</Text>
          <Text>💧 Fertilizer: {advice.fertilizer_kg} kg</Text>
          <Text>🐛 Pesticide: {advice.pesticide_kg} kg</Text>
          <Text>📈 Yield: {advice.estimated_yield_ton} ton</Text>
          <Text>♻️ Sustainability: {advice.sustainability_score}</Text>
        </View>
      )}

      {!loading && marketCrops.length > 0 && (
        <View style={styles.result}>
          <Text style={styles.heading}>📊 Profitable Market Crops:</Text>
          {marketCrops.map((crop, index) => (
            <Text key={index}>
              🌾 {crop.product} — ₹{parseFloat(crop.price).toFixed(2)} per ton
            </Text>
          ))}
        </View>
      )}

      {!loading && combinedMessage && (
        <View style={styles.result}>
          <Text style={styles.heading}>🧠 AI Suggestion:</Text>
          <Text>{combinedMessage}</Text>
        </View>
      )}

{!loading && history.length > 0 && (
  <View style={styles.result}>
    <Text style={styles.heading}>📜 Previous Sessions</Text>
    {history.map((item, index) => (
      <View key={index} style={{ marginBottom: 10 }}>
        <Text>🕒 {new Date(item.createdAt).toLocaleString()}</Text>
        <Text>🌾 Crop: {item.suggested_crop}</Text>
        <Text>🧠 Advice: {item.ai_message.substring(0, 150)}...</Text>
      </View>
    ))}
  </View>
)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 50 },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#e0ffe0",
    borderRadius: 5
  }
});
