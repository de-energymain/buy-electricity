import express, { Response,Request } from "express";
import EnergyReading from "../models/EnergyReading";

const router = express.Router();
const plantId = process.env.PLANT_ID;

router.get("/latest", async (req: Request, res: Response): Promise<void> => {
  if (!plantId)  res.status(400).json({ error: "plantId is required" });

  try {
    const latestData = await EnergyReading.find({ plantId })
      .sort({ date_time: -1 })
      .limit(8)
      .lean();

    res.json(latestData.reverse()); // Oldest first for chart
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
