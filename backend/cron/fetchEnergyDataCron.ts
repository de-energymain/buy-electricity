import cron from "node-cron";
import { fetchAndStoreTodayData } from "../services/energyDataService";


export function startEnergyDataCron() {
  cron.schedule("*/15 * * * *", async () => {
    console.log(`[CRON] Fetching data at ${new Date().toISOString()}`);
    try {
      await fetchAndStoreTodayData();
      console.log("[CRON] Data fetched and stored.");
    } catch (error) {
      console.error("[CRON] Failed to fetch data:", error);
    }
  });
}
