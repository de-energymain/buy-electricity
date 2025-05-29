import { Request, Response } from 'express';
import Purchase, { IPurchase } from '../models/Purchase';

export const createPurchase = async ( req: Request, res: Response ) => {
    try {
        const purchaseData : IPurchase = req.body;
        const newPurchase= new Purchase(purchaseData);
        const savedPurchase = await newPurchase.save();
        res.status(201).json(savedPurchase);
    } catch (error : unknown) {
        res.status(400).json({ message: (error as Error).message });  //type assertion 
    }
};

export const getAllPurchases = async ( req: Request, res: Response ) => {
    try {
        const purchases = await Purchase.find();
        res.status(200).json(purchases);
    } catch (error : unknown) {
        res.status(400).json({ message: (error as Error).message });
    }
};
