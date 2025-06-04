import mongoose, { Document, Schema } from "mongoose";

//TS interface
export interface IUser extends Document {
    loginMethod: string,
    userEmail: string,
    userName: string,
    wallet: string,
    walletID: string,
    panelDetails : {
        purchasedPanels : number,
        purchasedCost: number,
        generaterdYield: number
    }
    createdAt: Date,
    updatedAt: Date,
}

//Mongoose schema
const UserSchema : Schema = new Schema({
    loginMethod: { type: String, required: true},
    userEmail: { 
        type: String,
        match: [/.+\@.+\..+/, 'E-mail address is invalid.']
    },
    userName: { type: String},
    wallet: { type: String },
    walletID: { type: String, unique: true},
    panelDetails: {
        purchasedPanels: { type: Number, default : 0 },
        purchasedCost: { type: Number, default : 0 },
        generatedYield: { type: Number, default : 0 },
    }
}, {
    timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
