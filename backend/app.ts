import express from 'express';
import cors from 'cors';
import connectDB from './utils/db';
import purchaseRoutes from './routes/purchaseRoutes';
//router imports needed

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use('/api', purchaseRoutes);

//Connect to Database
connectDB();

export default app;