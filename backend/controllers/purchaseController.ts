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

export const deletePurchase = async ( req: Request, res: Response ) => {
    try {
        const { transactionHash } = req.params;
        const deletePurchase = await Purchase.findOneAndDelete({
            transactionHash : transactionHash
        });
        if( !deletePurchase ) {
            res.status(404).json( {message : "Purchase not found."});
            return; 
        }
        res.status(200).json({
            message: "Purchase deletion successful.",
            deletePurchase
        });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getPurchasesByWallet = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;
        
        if (!walletAddress) {
            res.status(400).json({ message: "Wallet address is required" });
            return;
        }

        const purchases = await Purchase.find({ walletAddress: walletAddress });
        
        if (!purchases || purchases.length === 0) {
            res.status(404).json({ message: "No purchases found for this wallet address" });
            return;
        }

        res.status(200).json({
            message: "Purchases retrieved successfully",
            data: purchases
        });
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message });
    }
};