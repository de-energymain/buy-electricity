import express from 'express';
import cors from 'cors';
import connectDB from './utils/db';
import { startYieldScheduler } from './services/yieldCalculator';
import { startEnergyDataCron } from "./cron/fetchEnergyDataCron";

//Routes
import energyRoutes from "./routes/energyRoutes";
import purchaseRoutes from './routes/purchaseRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use('/api', purchaseRoutes);
app.use('/api', userRoutes);
app.use("/api/energy", energyRoutes);

//Connect to Database
connectDB().then(() => {
    startYieldScheduler();
    startEnergyDataCron(); 
    console.log("[Server] Schedulers started");
  
}).catch((error: Error) => {
  console.error('Database connection failed:', error.message);
  process.exit(1);
});

export default app;