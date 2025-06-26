// Update backend/models/Purchase.ts to ensure purchaseDate is included

import mongoose, { Document, Schema } from "mongoose";

// Plant allocation interface for multi-plant purchases
export interface IPlantAllocation {
  plantId: string;
  plantName: string;
  panels: number;
  capacity: number; // kWh allocated from this plant
  cost: number; // Cost for this plant allocation
}

//TS interface
export interface IPurchase extends Document {
  farmName?: string; // Keep for backward compatibility
  location?: string; // Keep for backward compatibility
  walletAddress: string;
  paymentMethod: string;
  tokenAmount: number;
  panelsPurchased: number;
  cost: number;
  capacity: number;
  output: number;
  transactionHash: string;
  purchaseDate: Date;
  plantAllocations: IPlantAllocation[]; // New: Multi-plant allocation data
  createdAt: Date;
  updatedAt: Date;
}

// Plant allocation schema
const PlantAllocationSchema: Schema = new Schema({
  plantId: { type: String, required: true },
  plantName: { type: String, required: true },
  panels: { type: Number, required: true },
  capacity: { type: Number, required: true },
  cost: { type: Number, required: true },
});

//Mongoose schema
const PurchaseSchema: Schema = new Schema(
  {
    farmName: { type: String }, // Optional for backward compatibility
    location: { type: String }, // Optional for backward compatibility
    walletAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    tokenAmount: { type: Number, required: true },
    panelsPurchased: { type: Number, required: true },
    cost: { type: Number, required: true },
    capacity: { type: Number },
    output: { type: Number },
    transactionHash: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, default: Date.now },
    plantAllocations: { type: [PlantAllocationSchema], default: [] }, // New: Multi-plant support
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPurchase>("Purchase", PurchaseSchema);
