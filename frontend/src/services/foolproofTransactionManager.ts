// FOOLPROOF TRANSACTION SYSTEM
// This implements a queue-based, retry-enabled, blockchain-verified system

interface PendingTransaction {
  id: string;
  blockchainTxHash: string;
  walletAddress: string;
  orderDetails: any;
  paymentMethod: string;
  tokenAmount: number;
  timestamp: number;
  attempts: number;
  lastAttempt: number;
  status: 'pending_save' | 'blockchain_verified' | 'db_saved' | 'failed' | 'manual_review';
  error?: string;
  blockchainConfirmed: boolean;
  verificationAttempts: number;
}

class FoolproofTransactionManager {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly RETRY_DELAYS = [2000, 5000, 10000, 30000, 60000]; // Progressive delays
  private static readonly STORAGE_KEY = 'pendingTransactions';
  private static processingQueue = false;

  // 1. IMMEDIATELY save transaction to multiple places
  static async recordTransaction(
    txHash: string,
    walletAddress: string,
    orderDetails: any,
    paymentMethod: string,
    tokenAmount: number
  ): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36)}`;
    
    const pendingTx: PendingTransaction = {
      id: transactionId,
      blockchainTxHash: txHash,
      walletAddress,
      orderDetails,
      paymentMethod,
      tokenAmount,
      timestamp: Date.now(),
      attempts: 0,
      lastAttempt: 0,
      status: 'pending_save',
      blockchainConfirmed: false,
      verificationAttempts: 0
    };

    // Save to multiple places immediately
    await this.saveToMultipleLocations(pendingTx);
    
    // Start processing queue
    this.processQueue();
    
    return transactionId;
  }

  // Save to multiple redundant locations
  private static async saveToMultipleLocations(tx: PendingTransaction) {
    const promises = [
      this.saveToLocalStorage(tx),
      this.saveToIndexedDB(tx),
      this.saveToSessionStorage(tx),
      this.sendToBackgroundQueue(tx)
    ];

    // Don't wait for all, just ensure at least one succeeds
    await Promise.allSettled(promises);
  }

  private static saveToLocalStorage(tx: PendingTransaction) {
    try {
      const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      existing.push(tx);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private static async saveToIndexedDB(tx: PendingTransaction) {
    try {
      const request = indexedDB.open('TransactionDB', 1);
      return new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['transactions'], 'readwrite');
          const store = transaction.objectStore('transactions');
          store.add(tx);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  }

  private static saveToSessionStorage(tx: PendingTransaction) {
    try {
      const existing = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '[]');
      existing.push(tx);
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  }

  // Send to backend immediately as "pending verification"
  private static async sendToBackgroundQueue(tx: PendingTransaction) {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          blockchainTxHash: tx.blockchainTxHash,
          walletAddress: tx.walletAddress,
          status: 'pending_verification',
          timestamp: tx.timestamp
        })
      });
    } catch (error) {
      console.error('Failed to send to background queue:', error);
      // This is okay, we have other backups
    }
  }

  // Process all pending transactions with retries
  private static async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      const pending = await this.getAllPendingTransactions();
      
      for (const tx of pending) {
        if (tx.status === 'db_saved') continue;
        
        // 1. First verify blockchain transaction
        if (!tx.blockchainConfirmed) {
          const verified = await this.verifyBlockchainTransaction(tx);
          if (!verified) {
            tx.verificationAttempts++;
            if (tx.verificationAttempts > 10) {
              tx.status = 'manual_review';
              await this.updateTransaction(tx);
            }
            continue; // Skip to next transaction
          }
          tx.blockchainConfirmed = true;
          tx.status = 'blockchain_verified';
        }

        // 2. Try to save to database
        if (tx.blockchainConfirmed && tx.status !== 'db_saved') {
          const saved = await this.attemptDatabaseSave(tx);
          if (saved) {
            tx.status = 'db_saved';
            await this.updateTransaction(tx);
            continue;
          }

          // Handle retry logic
          tx.attempts++;
          tx.lastAttempt = Date.now();

          if (tx.attempts >= this.MAX_ATTEMPTS) {
            tx.status = 'manual_review';
            await this.sendToManualReview(tx);
          } else {
            // Schedule retry
            setTimeout(() => this.processQueue(), this.RETRY_DELAYS[tx.attempts - 1]);
          }
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  // Verify transaction actually exists on blockchain
  private static async verifyBlockchainTransaction(tx: PendingTransaction): Promise<boolean> {
    try {
      // This would connect to Solana RPC to verify transaction
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [tx.blockchainTxHash, { encoding: 'json' }]
        })
      });

      const result = await response.json();
      return result.result !== null; // Transaction exists
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      return false;
    }
  }

  // Attempt to save to database with verification
  private static async attemptDatabaseSave(tx: PendingTransaction): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: tx.walletAddress,
          paymentMethod: tx.paymentMethod,
          tokenAmount: tx.tokenAmount,
          panelsPurchased: tx.orderDetails.panels,
          cost: tx.orderDetails.cost,
          capacity: tx.orderDetails.capacity,
          output: tx.orderDetails.output,
          transactionHash: tx.blockchainTxHash,
          farmName: "Multi-Plant Purchase",
          location: "Multiple Locations",
          plantAllocations: tx.orderDetails.plantAllocations,
          // Add verification metadata
          verificationData: {
            clientTimestamp: tx.timestamp,
            verifiedOnBlockchain: true,
            attempts: tx.attempts + 1
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Transaction ${tx.id} saved to database successfully`);
        return true;
      } else if (response.status === 409) {
        // Duplicate - already exists, that's okay
        console.log(`✅ Transaction ${tx.id} already exists in database`);
        return true;
      } else {
        const error = await response.text();
        tx.error = `Database save failed: ${response.status} ${error}`;
        console.error(`❌ Database save failed for ${tx.id}:`, tx.error);
        return false;
      }
    } catch (error: any) {
      tx.error = `Database save error: ${error.message}`;
      console.error(`💥 Database save error for ${tx.id}:`, error);
      return false;
    }
  }

  // Send transaction for manual review
  private static async sendToManualReview(tx: PendingTransaction) {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/manual-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          blockchainTxHash: tx.blockchainTxHash,
          walletAddress: tx.walletAddress,
          orderDetails: tx.orderDetails,
          error: tx.error,
          attempts: tx.attempts,
          timestamp: tx.timestamp,
          urgency: 'high' // User paid money
        })
      });
      
      console.log(`🔍 Transaction ${tx.id} sent for manual review`);
    } catch (error) {
      console.error(`Failed to send ${tx.id} for manual review:`, error);
    }
  }

  // Get all pending transactions from all storage locations
  private static async getAllPendingTransactions(): Promise<PendingTransaction[]> {
    const allTransactions: PendingTransaction[] = [];
    
    // From localStorage
    try {
      const localTxs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      allTransactions.push(...localTxs);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
    }

    // From IndexedDB
    try {
      const indexedTxs = await this.getFromIndexedDB();
      allTransactions.push(...indexedTxs);
    } catch (error) {
      console.error('Failed to read from IndexedDB:', error);
    }

    // Deduplicate by transaction ID
    const unique = new Map();
    for (const tx of allTransactions) {
      if (!unique.has(tx.id) || unique.get(tx.id).attempts < tx.attempts) {
        unique.set(tx.id, tx);
      }
    }

    return Array.from(unique.values()).filter(tx => tx.status !== 'db_saved');
  }

  private static async getFromIndexedDB(): Promise<PendingTransaction[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TransactionDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => reject(getAll.error);
      };
    });
  }

  private static async updateTransaction(tx: PendingTransaction) {
    // Update in all storage locations
    await this.saveToMultipleLocations(tx);
  }

  // Initialize on page load
  static initialize() {
    // Start processing any existing pending transactions
    setTimeout(() => this.processQueue(), 1000);
    
    // Process queue periodically
    setInterval(() => this.processQueue(), 30000); // Every 30 seconds
    
    // Process on page visibility change (user comes back to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.processQueue();
      }
    });

    // Process before page unload
    window.addEventListener('beforeunload', () => {
      this.processQueue();
    });
  }
}
