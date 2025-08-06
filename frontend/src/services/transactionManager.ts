// Create a transaction state management system
interface TransactionState {
  id: string;
  status: 'pending' | 'blockchain_confirmed' | 'database_saved' | 'failed';
  blockchainTxHash?: string;
  databaseId?: string;
  error?: string;
  retryCount: number;
  timestamp: number;
}

class TransactionManager {
  private static transactions = new Map<string, TransactionState>();
  
  static createTransaction(orderDetails: OrderDetails): string {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(id, {
      id,
      status: 'pending',
      retryCount: 0,
      timestamp: Date.now()
    });
    return id;
  }
  
  static async handleBlockchainSuccess(id: string, txHash: string) {
    const tx = this.transactions.get(id);
    if (tx) {
      tx.status = 'blockchain_confirmed';
      tx.blockchainTxHash = txHash;
      
      // Now attempt database save with retry logic
      await this.attemptDatabaseSave(id);
    }
  }
  
  static async attemptDatabaseSave(id: string, maxRetries = 3) {
    const tx = this.transactions.get(id);
    if (!tx || tx.retryCount >= maxRetries) return;
    
    try {
      // Database save logic here
      tx.status = 'database_saved';
    } catch (error) {
      tx.retryCount++;
      tx.error = error.message;
      
      if (tx.retryCount < maxRetries) {
        // Retry after delay
        setTimeout(() => this.attemptDatabaseSave(id), 2000 * tx.retryCount);
      } else {
        tx.status = 'failed';
        // Log for manual recovery
        this.logFailedTransaction(tx);
      }
    }
  }
  
  static logFailedTransaction(tx: TransactionState) {
    // Log to persistent storage for manual recovery
    const failedTx = {
      ...tx,
      needsManualRecovery: true,
      loggedAt: new Date().toISOString()
    };
    
    // Store in localStorage for now, should be sent to backend
    const existing = JSON.parse(localStorage.getItem('failedTransactions') || '[]');
    existing.push(failedTx);
    localStorage.setItem('failedTransactions', JSON.stringify(existing));
  }
}
