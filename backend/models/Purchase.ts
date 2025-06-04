// Update backend/models/Purchase.ts to ensure purchaseDate is included

import mongoose, {Document, Schema} from 'mongoose';

//TS interface
export interface IPurchase extends Document {
    farmName: string;
    location: string;
    walletAddress: string;
    paymentMethod: string;
    tokenAmount: number;
    panelsPurchased: number;
    cost: number;
    capacity: number;
    output: number;
    transactionHash: string;
    purchaseDate: Date;  // Make sure this is included
    createdAt: Date;
    updatedAt: Date;
}

//Mongoose schema
const PurchaseSchema: Schema = new Schema({
    farmName: { type: String, required: true },
    location: { type: String, required: true },
    walletAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    tokenAmount: { type: Number, required: true },
    panelsPurchased: {type: Number, required: true },
    cost: { type: Number, required: true },
    capacity: { type: Number },
    output: { type: Number },
    transactionHash: { type: String, required: true , unique: true },
    purchaseDate: { type: Date, default: Date.now },  // Add default if not provided
 }, {
    timestamps: true,
});

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);