import { Request, Response } from "express";
import Purchase, { IPurchase, IPlantAllocation } from "../models/Purchase";

export const createPurchase = async (req: Request, res: Response) => {
  try {
    console.log('📥 Purchase creation request received:', {
      walletAddress: req.body.walletAddress,
      transactionHash: req.body.transactionHash,
      paymentMethod: req.body.paymentMethod,
      cost: req.body.cost,
      allocationsCount: req.body.plantAllocations?.length || 0
    });

    const purchaseData: IPurchase = req.body;

    // Enhanced validation
    if (!purchaseData.walletAddress) {
      console.error('❌ Missing wallet address');
      res.status(400).json({
        message: "Wallet address is required",
        field: "walletAddress"
      });
      return;
    }

    if (!purchaseData.transactionHash) {
      console.error('❌ Missing transaction hash');
      res.status(400).json({
        message: "Transaction hash is required",
        field: "transactionHash"
      });
      return;
    }

    // Validate that plantAllocations are provided
    if (
      !purchaseData.plantAllocations ||
      purchaseData.plantAllocations.length === 0
    ) {
      console.error('❌ Missing or empty plant allocations:', {
        plantAllocations: purchaseData.plantAllocations
      });
      res.status(400).json({
        message: "Plant allocations are required for purchase creation",
        field: "plantAllocations"
      });
      return;
    }

    // Check for duplicate transaction hash
    const existingPurchase = await Purchase.findOne({
      transactionHash: purchaseData.transactionHash
    });

    if (existingPurchase) {
      console.warn('⚠️  Duplicate transaction hash detected:', {
        transactionHash: purchaseData.transactionHash,
        existingId: existingPurchase._id
      });
      res.status(409).json({
        message: "Transaction already processed",
        existingPurchase: existingPurchase._id,
        field: "transactionHash"
      });
      return;
    }

    // Validate plant allocations structure
    const invalidAllocations = purchaseData.plantAllocations.filter(allocation => 
      !allocation.plantId || 
      !allocation.plantName || 
      typeof allocation.panels !== 'number' || 
      typeof allocation.capacity !== 'number' || 
      typeof allocation.cost !== 'number'
    );

    if (invalidAllocations.length > 0) {
      console.error('❌ Invalid plant allocation structure:', invalidAllocations);
      res.status(400).json({
        message: "Invalid plant allocation structure",
        invalidAllocations,
        field: "plantAllocations"
      });
      return;
    }

    console.log('✅ Validation passed, creating purchase...');
    
    const newPurchase = new Purchase(purchaseData);
    const savedPurchase = await newPurchase.save();
    
    console.log('✅ Purchase created successfully:', {
      id: savedPurchase._id,
      walletAddress: savedPurchase.walletAddress,
      transactionHash: savedPurchase.transactionHash
    });
    
    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: savedPurchase
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('💥 Purchase creation failed:', {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });

    // Handle specific MongoDB errors
    if (err.message.includes('duplicate key') || err.message.includes('E11000')) {
      res.status(409).json({ 
        success: false,
        message: "Transaction already exists in database",
        error: "DUPLICATE_TRANSACTION"
      });
      return;
    }

    if (err.message.includes('validation failed')) {
      res.status(400).json({ 
        success: false,
        message: "Validation error: " + err.message,
        error: "VALIDATION_ERROR"
      });
      return;
    }

    res.status(500).json({ 
      success: false,
      message: "Internal server error during purchase creation",
      error: "SERVER_ERROR"
    });
  }
};

// New endpoint for recovering failed transactions
export const recoverFailedTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionHash, walletAddress } = req.body;

    if (!transactionHash || !walletAddress) {
      res.status(400).json({
        success: false,
        message: "Transaction hash and wallet address are required"
      });
      return;
    }

    // Check if purchase already exists
    const existingPurchase = await Purchase.findOne({ transactionHash });
    if (existingPurchase) {
      res.status(200).json({
        success: true,
        message: "Transaction already exists in database",
        data: existingPurchase
      });
      return;
    }

    // Log the recovery attempt for manual processing
    console.log('🔄 Recovery request for failed transaction:', {
      transactionHash,
      walletAddress,
      timestamp: new Date().toISOString()
    });

    res.status(202).json({
      success: true,
      message: "Recovery request logged for manual processing",
      transactionHash
    });
  } catch (error: unknown) {
    console.error('💥 Recovery request failed:', error);
    res.status(500).json({
      success: false,
      message: "Failed to process recovery request"
    });
  }
};

export const getAllPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find();
    res.status(200).json(purchases);
  } catch (error: unknown) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const deletePurchase = async (req: Request, res: Response) => {
  try {
    const { transactionHash } = req.params;
    const deletePurchase = await Purchase.findOneAndDelete({
      transactionHash: transactionHash,
    });
    if (!deletePurchase) {
      res.status(404).json({ message: "Purchase not found." });
      return;
    }
    res.status(200).json({
      message: "Purchase deletion successful.",
      deletePurchase,
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
      res
        .status(404)
        .json({ message: "No purchases found for this wallet address" });
      return;
    }

    res.status(200).json({
      message: "Purchases retrieved successfully",
      data: purchases,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// New: Get purchases by plant
export const getPurchasesByPlant = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;

    if (!plantId) {
      res.status(400).json({ message: "Plant ID is required" });
      return;
    }

    const purchases = await Purchase.find({
      "plantAllocations.plantId": plantId,
    });

    res.status(200).json({
      message: "Plant purchases retrieved successfully",
      data: purchases,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// New: Get plant capacity allocations
export const getPlantCapacityAllocations = async (
  req: Request,
  res: Response
) => {
  try {
    const { plantId } = req.params;

    if (!plantId) {
      res.status(400).json({ message: "Plant ID is required" });
      return;
    }

    const purchases = await Purchase.find({
      "plantAllocations.plantId": plantId,
    });

    let totalAllocatedPanels = 0;
    let totalAllocatedCapacity = 0;
    let totalAllocatedCost = 0;

    purchases.forEach((purchase) => {
      purchase.plantAllocations.forEach((allocation) => {
        if (allocation.plantId === plantId) {
          totalAllocatedPanels += allocation.panels;
          totalAllocatedCapacity += allocation.capacity;
          totalAllocatedCost += allocation.cost;
        }
      });
    });

    res.status(200).json({
      message: "Plant capacity allocations retrieved successfully",
      data: {
        plantId,
        totalAllocatedPanels,
        totalAllocatedCapacity,
        totalAllocatedCost,
        totalPurchases: purchases.length,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// New: Get user allocations across all plants
export const getUserPlantAllocations = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({ message: "Wallet address is required" });
      return;
    }

    const purchases = await Purchase.find({ walletAddress: walletAddress });

    // Aggregate allocations by plant
    const plantAllocations: {
      [plantId: string]: {
        plantId: string;
        plantName: string;
        panels: number;
        cost: number;
      };
    } = {};

    purchases.forEach((purchase) => {
      purchase.plantAllocations.forEach((allocation) => {
        if (!plantAllocations[allocation.plantId]) {
          plantAllocations[allocation.plantId] = {
            plantId: allocation.plantId,
            plantName: allocation.plantName,
            panels: 0,
            cost: 0,
          };
        }
        plantAllocations[allocation.plantId].panels += allocation.panels;
        plantAllocations[allocation.plantId].cost += allocation.cost;
      });
    });

    res.status(200).json({
      message: "User plant allocations retrieved successfully",
      data: Object.values(plantAllocations),
    });
  } catch (error: unknown) {
    res.status(500).json({ message: (error as Error).message });
  }
};
