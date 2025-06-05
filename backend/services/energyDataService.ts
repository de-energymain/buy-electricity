import axios from "axios";
import EnergyReading from "../models/EnergyReading";

const API_URL =
  "https://de-express-backend.onrender.com/api/energyMeterQuarterHourly/todaysData";
const plantId = process.env.PLANT_ID;

export async function fetchAndStoreTodayData() {
    console.log("Starting to fetch today's energy data...");
  console.log("Fetching today's energy data for plantId:", plantId);
  const { data } = await axios.get(`${API_URL}?plantId=${plantId}`);
  console.log("Fetched data:", data);
  const operations = data.map((entry: any) => ({
    updateOne: {
      filter: { date_time: new Date(entry.date_time) },
      update: { $setOnInsert: entry },
      upsert: true,
    },
  }));
  if (operations.length > 0) {
    await EnergyReading.bulkWrite(operations);
  }
}
