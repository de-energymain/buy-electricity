// Backend endpoints for foolproof transaction management
import { Request, Response } from "express";
import Purchase from "../models/Purchase";

// Pending transaction model
interface PendingTransactionRecord {
  transactionId: string;
  blockchainTxHash: string;
  walletAddress: string;
  status: 'pending_verification' | 'verified' | 'manual_review';
  timestamp: number;
  verificationAttempts: number;
  lastAttempt?: number;
  metadata?: any;
}

// In-memory store for pending transactions (use Redis in production)
const pendingTransactions = new Map<string, PendingTransactionRecord>();

// Store pending transaction for verification
export const storePendingTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId, blockchainTxHash, walletAddress, status, timestamp } = req.body;

    if (!transactionId || !blockchainTxHash || !walletAddress) {
      res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
      return;
    }

    // Check if we already have this transaction
    const existingPurchase = await Purchase.findOne({ transactionHash: blockchainTxHash });
    if (existingPurchase) {
      res.status(200).json({
        success: true,
        message: "Transaction already exists in database",
        alreadyProcessed: true
      });
      return;
    }

    // Store pending transaction
    pendingTransactions.set(transactionId, {
      transactionId,
      blockchainTxHash,
      walletAddress,
      status: status || 'pending_verification',
      timestamp: timestamp || Date.now(),
      verificationAttempts: 0
    });

    console.log(`📝 Stored pending transaction ${transactionId} for verification`);

    res.status(202).json({
      success: true,
      message: "Transaction queued for verification",
      transactionId
    });
  } catch (error: any) {
    console.error('Failed to store pending transaction:', error);
    res.status(500).json({
      success: false,
      message: "Failed to store pending transaction"
    });
  }
};

// Manual review endpoint for failed transactions
export const submitForManualReview = async (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      blockchainTxHash,
      walletAddress,
      orderDetails,
      error,
      attempts,
      timestamp,
      urgency
    } = req.body;

    // Log to database for admin review
    console.log('🔍 MANUAL REVIEW REQUIRED:', {
      transactionId,
      blockchainTxHash,
      walletAddress,
      error,
      attempts,
      timestamp: new Date(timestamp).toISOString(),
      urgency,
      orderDetails: {
        panels: orderDetails?.panels,
        cost: orderDetails?.cost,
        plantAllocations: orderDetails?.plantAllocations?.length
      }
    });

    // In production, save to a separate ManualReview collection
    // For now, just log and acknowledge
    res.status(200).json({
      success: true,
      message: "Transaction submitted for manual review",
      reviewId: `review_${Date.now()}`,
      expectedResolution: "24 hours"
    });
  } catch (error: any) {
    console.error('Failed to submit for manual review:', error);
    res.status(500).json({
      success: false,
      message: "Failed to submit for manual review"
    });
  }
};

// Enhanced purchase creation with better validation
export const createPurchaseWithVerification = async (req: Request, res: Response) => {
  try {
    const purchaseData = req.body;
    const { transactionHash, walletAddress, verificationData } = purchaseData;

    console.log('🔄 Processing purchase with verification:', {
      transactionHash,
      walletAddress,
      panels: purchaseData.panelsPurchased,
      cost: purchaseData.cost,
      verified: verificationData?.verifiedOnBlockchain,
      attempts: verificationData?.attempts
    });

    // Enhanced validation
    if (!transactionHash || !walletAddress) {
      res.status(400).json({
        success: false,
        message: "Transaction hash and wallet address are required"
      });
      return;
    }

    if (!purchaseData.plantAllocations || purchaseData.plantAllocations.length === 0) {
      res.status(400).json({
        success: false,
        message: "Plant allocations are required"
      });
      return;
    }

    // Check for duplicates
    const existingPurchase = await Purchase.findOne({ transactionHash });
    if (existingPurchase) {
      console.log('ℹ️  Purchase already exists:', transactionHash);
      res.status(200).json({
        success: true,
        message: "Purchase already exists",
        data: existingPurchase,
        duplicate: true
      });
      return;
    }

    // Create purchase with verification metadata
    const enhancedPurchaseData = {
      ...purchaseData,
      verificationStatus: verificationData?.verifiedOnBlockchain ? 'verified' : 'unverified',
      processingAttempts: verificationData?.attempts || 1,
      verifiedAt: verificationData?.verifiedOnBlockchain ? new Date() : undefined
    };

    const newPurchase = new Purchase(enhancedPurchaseData);
    const savedPurchase = await newPurchase.save();

    console.log('✅ Purchase saved successfully:', {
      id: savedPurchase._id,
      transactionHash,
      walletAddress,
      cost: savedPurchase.cost
    });

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: savedPurchase
    });

  } catch (error: any) {
    console.error('💥 Purchase creation failed:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "Duplicate transaction hash",
        code: 'DUPLICATE_TRANSACTION'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create purchase",
      code: 'SAVE_FAILED'
    });
  }
};

// Get transaction status
export const getTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { transactionHash } = req.params;

    // Check database first
    const purchase = await Purchase.findOne({ transactionHash });
    if (purchase) {
      res.json({
        success: true,
        status: 'completed',
        data: purchase
      });
      return;
    }

    // Check pending transactions
    const pending = Array.from(pendingTransactions.values())
      .find(tx => tx.blockchainTxHash === transactionHash);

    if (pending) {
      res.json({
        success: true,
        status: pending.status,
        data: pending
      });
      return;
    }

    res.status(404).json({
      success: false,
      status: 'not_found',
      message: "Transaction not found"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get transaction status"
    });
  }
};
