import mongoose, { Document, Schema } from 'mongoose';

export interface EnergyReading extends Document {
  date_time: Date;
  energyMeterId: string;
  plantId: string;
  roofId: string;
  value: number;
  tillLifeTIme: number;
  created_date: Date;
  updated_date: Date;
}

const EnergyReadingSchema = new Schema<EnergyReading>({
  date_time: { type: Date, required: true, unique: true },
  energyMeterId: { type: String, required: true },
  plantId: { type: String, required: true },
  roofId: { type: String, required: true },
  value: { type: Number, required: true },
  tillLifeTIme: { type: Number, required: true },
  created_date: { type: Date, required: true },
  updated_date: { type: Date, required: true }
});

export default mongoose.model<EnergyReading>('EnergyReading', EnergyReadingSchema);
