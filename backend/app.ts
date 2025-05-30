import express from 'express';
import cors from 'cors';
import connectDB from './utils/db';

//Routes
import purchaseRoutes from './routes/purchaseRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Routes
app.use('/api', purchaseRoutes);
app.use('/api', userRoutes);

//Connect to Database
connectDB();

export default app;