import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@nextui-org/react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  ShoppingCart,
  RefreshCw
} from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import DashboardTemplate from "../../components/DashboardTemplate";

// Simplified transaction interface focusing on the 3 types we care about
interface Transaction {
  id: string;
  type: "purchase" | "yield" | "transfer";
  token: string;
  amount: number;
  timestamp: number;
  from?: string;
  to?: string;
  status: "confirmed" | "pending" | "failed";
  signature?: string;
  farmName?: string;
  panels?: number;
  direction?: "in" | "out"; // For transfers
}

interface UserPanelData {
  generatedYield: number;
  purchasedPanels: number;
  purchasedCost: number;
}

const TransactionsPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [walletID, setWalletID] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [typeFilter, setTypeFilter] = useState<string[]>(["all"]);
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [setUserPanelData] = useState<UserPanelData>({ 
    generatedYield: 0, 
    purchasedPanels: 0, 
    purchasedCost: 0 
  });
  
  // Smart loading states
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [blockchainProgress, setBlockchainProgress] = useState({ current: 0, total: 0 });
  const [hasStartedBlockchainScan, setHasStartedBlockchainScan] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const rowsPerPage = 10;
  const DOLLAR_TO_NRG_RATE = 0.03;
  
  // Solana connection
  const connection = new Connection("https://api.devnet.solana.com");

  // Extract wallet ID immediately
  useEffect(() => {
    const session = localStorage.getItem("web3AuthSession");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.publicKey) {
          setWalletID(data.publicKey);
        }
      } catch (e) {
        console.error("Error parsing Web3Auth session", e);
      }
    }
    if (connected && publicKey) {
      setWalletID(publicKey.toString());
    }
  }, [connected, publicKey]);

  // STEP 1: Fast fetch of purchase data (instant loading)
  const fetchPurchaseData = async (walletAddress: string): Promise<{ transactions: Transaction[], earliestDate: number | null }> => {
    try {
      const response = await fetch(`https://buy-electricity-production.up.railway.app/api/purchases/wallet/${walletAddress}`);
      if (response.ok) {
        const result = await response.json();
        const purchases = result.data || [];
        
        let earliestDate: number | null = null;
        
        const purchaseTransactions = purchases.map((purchase: any) => {
          const timestamp = new Date(purchase.purchaseDate || purchase.createdAt).getTime();
          if (!earliestDate || timestamp < earliestDate) {
            earliestDate = timestamp;
          }
          
          return {
            id: purchase.transactionHash,
            type: "purchase" as const,
            token: purchase.paymentMethod,
            amount: purchase.tokenAmount,
            timestamp,
            to: "Solar Panel Purchase",
            status: "confirmed" as const,
            signature: purchase.transactionHash,
            farmName: purchase.farmName,
            panels: purchase.panelsPurchased,
          };
        });
        
        return { transactions: purchaseTransactions, earliestDate };
      }
      return { transactions: [], earliestDate: null };
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      return { transactions: [], earliestDate: null };
    }
  };

  // Fetch user data for calculations
  const fetchUserData = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://buy-electricity-production.up.railway.app/api/users/${walletAddress}`);
      if (response.ok) {
        const userData = await response.json();
        const panelData = {
          generatedYield: userData.user.panelDetails.generatedYield,
          purchasedPanels: userData.user.panelDetails.purchasedPanels,
          purchasedCost: userData.user.panelDetails.purchasedCost
        };
        setUserPanelData(panelData);
        return panelData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // STEP 2: Smart blockchain scanning based on purchase dates
  const scanBlockchainForYieldAndTransfers = async (walletAddress: string, earliestPurchaseDate: number | null) => {
    if (!earliestPurchaseDate) {
      console.log('No purchases found, skipping blockchain scan');
      return { yieldTransactions: [], transferTransactions: [] };
    }

    setIsLoadingBlockchain(true);
    setHasStartedBlockchainScan(true);
    
    try {
      const pubKey = new PublicKey(walletAddress);
      
      // Calculate how far back to scan (from earliest purchase to now)
      const scanStartDate = new Date(earliestPurchaseDate);
      const daysSincePurchase = Math.ceil((Date.now() - earliestPurchaseDate) / (1000 * 60 * 60 * 24));
      
      // Limit scan based on purchase history (more efficient)
      const maxSignatures = Math.min(Math.max(daysSincePurchase * 2, 50), 200); // 2 transactions per day max
      
      console.log(`Scanning ${maxSignatures} transactions since ${scanStartDate.toDateString()}`);
      
      // Get transaction signatures with a reasonable limit
      const signatures = await connection.getSignaturesForAddress(pubKey, { 
        limit: maxSignatures,
        before: undefined // Start from most recent
      });
      
      // Filter signatures to only those after earliest purchase
      const relevantSignatures = signatures.filter(sig => 
        (sig.blockTime || 0) * 1000 >= earliestPurchaseDate
      );
      
      setBlockchainProgress({ current: 0, total: relevantSignatures.length });
      
      const yieldTransactions: Transaction[] = [];
      const transferTransactions: Transaction[] = [];
      
      // Process signatures in smaller batches for better UX
      const batchSize = 5;
      for (let i = 0; i < relevantSignatures.length; i += batchSize) {
        const batch = relevantSignatures.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (sigInfo, batchIndex) => {
          try {
            const transaction = await connection.getParsedTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0
            });
            
            if (transaction && transaction.meta && !transaction.meta.err) {
              // Check for yield transactions
              const yieldAmount = await analyzeTransactionForYield(transaction, walletAddress);
              if (yieldAmount) {
                yieldTransactions.push({
                  id: sigInfo.signature,
                  type: "yield",
                  token: "NRG",
                  amount: yieldAmount,
                  timestamp: (sigInfo.blockTime || 0) * 1000,
                  from: "Solar Yield",
                  status: "confirmed",
                  signature: sigInfo.signature,
                });
              }
              
              // Check for NRG transfers
              const transferInfo = await analyzeTransactionForTransfer(transaction, walletAddress);
              if (transferInfo) {
                transferTransactions.push({
                  id: sigInfo.signature,
                  type: "transfer",
                  token: "NRG",
                  amount: transferInfo.amount,
                  timestamp: (sigInfo.blockTime || 0) * 1000,
                  from: transferInfo.direction === "in" ? transferInfo.counterparty : walletAddress,
                  to: transferInfo.direction === "out" ? transferInfo.counterparty : walletAddress,
                  direction: transferInfo.direction,
                  status: "confirmed",
                  signature: sigInfo.signature,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to parse transaction ${sigInfo.signature}:`, error);
          }
          
          // Update progress
          setBlockchainProgress(prev => ({ ...prev, current: i + batchIndex + 1 }));
        }));
        
        // Update UI with current results during scanning
        if (yieldTransactions.length > 0 || transferTransactions.length > 0) {
          setTransactions(prevTx => {
            const newTransactions = [...prevTx, ...yieldTransactions, ...transferTransactions]
              .sort((a, b) => b.timestamp - a.timestamp);
            return newTransactions;
          });
        }
        
        // Small delay to prevent rate limiting and allow UI updates
        if (i + batchSize < relevantSignatures.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return { yieldTransactions, transferTransactions };
    } catch (error) {
      console.error('Error scanning blockchain:', error);
      return { yieldTransactions: [], transferTransactions: [] };
    } finally {
      setIsLoadingBlockchain(false);
    }
  };

  // Analyze transaction to determine if it's a yield payment
  const analyzeTransactionForYield = async (
    transaction: ParsedTransactionWithMeta, 
    walletAddress: string
  ): Promise<number | null> => {
    if (!transaction.meta?.postBalances || !transaction.meta?.preBalances) {
      return null;
    }

    // Look for SOL balance changes that could be yield payments
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
      key => key.pubkey.toString() === walletAddress
    );

    if (accountIndex !== -1) {
      const preBalance = transaction.meta.preBalances[accountIndex];
      const postBalance = transaction.meta.postBalances[accountIndex];
      const balanceChange = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

      // If there's a small positive balance change (likely yield)
      // Yield payments are typically small, regular amounts
      if (balanceChange > 0 && balanceChange < 0.1 && balanceChange > 0.001) {
        // Convert to NRG equivalent for display
        const nrgEquivalent = (balanceChange * 20) / DOLLAR_TO_NRG_RATE; // Assuming 1 SOL = $20
        return nrgEquivalent;
      }
    }

    return null;
  };

  // Analyze transaction for token transfers
  const analyzeTransactionForTransfer = async (
    _transaction: ParsedTransactionWithMeta, 
    _walletAddress: string
  ): Promise<{ amount: number; direction: "in" | "out"; counterparty: string } | null> => {
    // This would analyze SPL token transfers for NRG tokens
    // For now, return null since we need the actual NRG token mint address
    // In production, you would:
    // 1. Get the NRG token mint address
    // 2. Look through transaction.meta.preTokenBalances and postTokenBalances
    // 3. Find changes in NRG token balance for the user's wallet
    return null;
  };

  // MAIN LOADING STRATEGY: Purchases first, then blockchain
  const loadAllTransactions = async (refresh = false) => {
    if (!walletID) return;
    
    if (refresh) {
      setIsRefreshing(true);
      setTransactions([]);
      setFilteredTransactions([]);
    }
    
    try {
      // STEP 1: Load purchases immediately (fast API call)
      setIsLoadingPurchases(true);
      const { transactions: purchaseTransactions, earliestDate } = await fetchPurchaseData(walletID);
      
      // Show purchases immediately
      setTransactions(purchaseTransactions.sort((a, b) => b.timestamp - a.timestamp));
      setFilteredTransactions(purchaseTransactions.sort((a, b) => b.timestamp - a.timestamp));
      setIsLoadingPurchases(false);
      
      // STEP 2: Load user data in parallel
      await fetchUserData(walletID);
      
      // STEP 3: Start blockchain scanning based on purchase dates
      if (earliestDate) {
        const { yieldTransactions, transferTransactions } = await scanBlockchainForYieldAndTransfers(walletID, earliestDate);
        
        // Combine all transactions and sort by timestamp (latest first)
        const allTransactions = [...purchaseTransactions, ...yieldTransactions, ...transferTransactions]
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
      }
      
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoadingPurchases(false);
      setIsLoadingBlockchain(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (walletID) {
      loadAllTransactions();
    }
  }, [walletID]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(query) ||
        tx.token.toLowerCase().includes(query) ||
        (tx.from && tx.from.toLowerCase().includes(query)) ||
        (tx.to && tx.to.toLowerCase().includes(query)) ||
        (tx.farmName && tx.farmName.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (!statusFilter.includes("all")) {
      filtered = filtered.filter(tx => statusFilter.includes(tx.status));
    }
    
    // Apply type filter  
    if (!typeFilter.includes("all")) {
      filtered = filtered.filter(tx => typeFilter.includes(tx.type));
    }
    
    // Apply time filter
    if (timeFilter !== "all") {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      
      switch (timeFilter) {
        case "today":
          filtered = filtered.filter(tx => (now - tx.timestamp) < day);
          break;
        case "week":
          filtered = filtered.filter(tx => (now - tx.timestamp) < (7 * day));
          break;
        case "month":
          filtered = filtered.filter(tx => (now - tx.timestamp) < (30 * day));
          break;
      }
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, timeFilter, transactions]);

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const purchases = transactions.filter(tx => tx.type === "purchase");
    const yields = transactions.filter(tx => tx.type === "yield");
    const transfers = transactions.filter(tx => tx.type === "transfer");
    
    const totalSpent = purchases.reduce((sum, tx) => {
      const rate = tx.token === "SOL" ? 20 : tx.token === "USDC" ? 1 : DOLLAR_TO_NRG_RATE;
      return sum + (tx.amount * rate);
    }, 0);
    
    const totalYield = yields.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransfers = transfers.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalSpent,
      totalYield,
      totalTransfers
    };
  };

  const summaryStats = calculateSummaryStats();

  // Format timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Transaction icon
  const getTransactionIcon = (type: string, status: string) => {
    if (status === "failed") return <XCircle className="text-red-500" size={20} />;
    if (status === "pending") return <Clock className="text-yellow-500" size={20} />;
    
    switch (type) {
      case "purchase":
        return <ShoppingCart className="text-blue-500" size={20} />;
      case "yield":
        return <ArrowDown className="text-green-500" size={20} />;
      case "transfer":
        return <ArrowUp className="text-purple-500" size={20} />;
      default:
        return <CheckCircle className="text-green-500" size={20} />;
    }
  };

  // Transaction status chip
  const getStatusChip = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Chip color="success" size="sm">Confirmed</Chip>;
      case "pending":
        return <Chip color="warning" size="sm">Pending</Chip>;
      case "failed":
        return <Chip color="danger" size="sm">Failed</Chip>;
      default:
        return <Chip size="sm">Unknown</Chip>;
    }
  };

  // Transaction description
  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case "purchase":
        return `Solar Panel Purchase${tx.farmName ? ` - ${tx.farmName}` : ''}`;
      case "yield":
        return "Daily Yield Payment";
      case "transfer":
        return tx.direction === "in" ? `Received NRG from ${tx.from || 'Unknown'}` : `Sent NRG to ${tx.to || 'Unknown'}`;
      default:
        return tx.type;
    }
  };

  // Calculate pages
  const pages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const currentItems = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <DashboardTemplate title="Transactions" activePage="transactions">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-gray-400">View your purchases, yield payments, and NRG transfers.</p>
          </div>
          <Button
            isIconOnly
            className="bg-[#E9423A] text-white"
            onPress={() => loadAllTransactions(true)}
            isDisabled={isRefreshing}
          >
            {isRefreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
          </Button>
        </div>

        {/* Summary Cards - Only 3 cards now */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Spent</div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <ShoppingCart size={20} className="text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-500 mb-2">
              ${summaryStats.totalSpent.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Panel Purchases</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-green-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Yield</div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <ArrowDown size={20} className="text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">
              {isLoadingBlockchain ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-lg">Scanning...</span>
                </div>
              ) : (
                `${summaryStats.totalYield.toFixed(2)} NRG`
              )}
            </div>
            <div className="text-sm text-gray-400">
              {isLoadingBlockchain ? `${blockchainProgress.current}/${blockchainProgress.total} checked` : "Daily Rewards"}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">NRG Transfers</div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                <ArrowUp size={20} className="text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {isLoadingBlockchain ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-lg">Scanning...</span>
                </div>
              ) : (
                summaryStats.totalTransfers.toFixed(2)
              )}
            </div>
            <div className="text-sm text-gray-400">Total Transferred</div>
          </div>
        </div>

        {/* Blockchain Scanning Progress */}
        {isLoadingBlockchain && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <div className="flex-1">
                <div className="text-blue-400 text-sm font-medium">
                  Scanning blockchain for yield transactions...
                </div>
                <div className="text-blue-300 text-xs mt-1">
                  Progress: {blockchainProgress.current} / {blockchainProgress.total} transactions checked
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search transactions..."
            startContent={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-xs"
            classNames={{
              base: "bg-[#1A1A1A]",
              inputWrapper: "bg-[#1A1A1A] border-1 border-gray-700 hover:border-white focus-within:border-[#E9423A]",
              input: "text-white placeholder:text-gray-400"
            }}
          />
          
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                  startContent={<Filter size={16} />}
                >
                  Status: {statusFilter.includes("all") ? "All" : statusFilter.join(", ")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Status Filter"
                closeOnSelect={false}
                selectedKeys={new Set(statusFilter)}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  const selectedKeys = Array.from(keys as Set<string>);
                  if (selectedKeys.includes("all")) {
                    setStatusFilter(["all"]);
                  } else {
                    setStatusFilter(selectedKeys);
                  }
                }}
                className="bg-[#1A1A1A] text-white border border-gray-700"
              >
                <DropdownItem key="all">All</DropdownItem>
                <DropdownItem key="confirmed">Confirmed</DropdownItem>
                <DropdownItem key="pending">Pending</DropdownItem>
                <DropdownItem key="failed">Failed</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                  startContent={<Filter size={16} />}
                >
                  Type: {typeFilter.includes("all") ? "All" : typeFilter.join(", ")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Type Filter"
                closeOnSelect={false}
                selectedKeys={new Set(typeFilter)}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  const selectedKeys = Array.from(keys as Set<string>);
                  if (selectedKeys.includes("all")) {
                    setTypeFilter(["all"]);
                  } else {
                    setTypeFilter(selectedKeys);
                  }
                }}
                className="bg-[#1A1A1A] text-white border border-gray-700"
              >
                <DropdownItem key="all">All</DropdownItem>
                <DropdownItem key="purchase">Purchases</DropdownItem>
                <DropdownItem key="yield">Yield</DropdownItem>
                <DropdownItem key="transfer">NRG Transfers</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  className="bg-[#1A1A1A] text-white border-1 border-gray-700"
                  startContent={<Calendar size={16} />}
                >
                  Time: {timeFilter === "all" ? "All Time" : 
                         timeFilter === "today" ? "Today" : 
                         timeFilter === "week" ? "This Week" : "This Month"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Time Filter"
                selectedKeys={new Set([timeFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  if (selected) setTimeFilter(selected.toString());
                }}
                className="bg-[#1A1A1A] text-white border border-gray-700"
              >
                <DropdownItem key="all">All Time</DropdownItem>
                <DropdownItem key="today">Today</DropdownItem>
                <DropdownItem key="week">This Week</DropdownItem>
                <DropdownItem key="month">This Month</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            
            <Button
              className="bg-[#1A1A1A] text-white border-1 border-gray-700"
              startContent={<Download size={16} />}
            >
              Export
            </Button>
          </div>
        </div>
        
        {/* Loading State for Initial Purchases Load */}
        {isLoadingPurchases ? (
          <div className="bg-[#1A1A1A] border border-gray-700 rounded-2xl p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Spinner size="lg" color="danger" className="mb-4" />
                <div className="text-xl mb-2 text-white">Loading purchases...</div>
                <div className="text-sm text-gray-400">This will only take a moment</div>
              </div>
            </div>
          </div>
        ) : (
          /* Transactions Table */
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Transaction</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? currentItems.map((tx, index) => (
                    <tr key={index} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 flex items-center justify-center mr-4 bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] rounded-xl border border-gray-600/30">
                            {getTransactionIcon(tx.type, tx.status)}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {getTransactionDescription(tx)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {tx.id.substring(0, 12)}...
                            </div>
                            {tx.panels && (
                              <div className="text-xs text-blue-400 mt-1">
                                {tx.panels} panels
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="capitalize text-white font-medium">{tx.type}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`font-semibold ${tx.type === "yield" ? "text-green-500" : tx.type === "transfer" && tx.direction === "in" ? "text-green-500" : "text-white"}`}>
                          {tx.type === "yield" ? "+" : tx.type === "transfer" && tx.direction === "out" ? "-" : ""}{tx.amount.toFixed(2)} {tx.token}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white text-sm">{formatDate(tx.timestamp)}</td>
                      <td className="py-4 px-6">{getStatusChip(tx.status)}</td>
                      <td className="py-4 px-6">
                        {tx.signature && (
                          <button
                            onClick={() => {
                              const explorerUrl = `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`;
                              window.open(explorerUrl, '_blank');
                            }}
                            className="w-10 h-10 bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] hover:from-gray-600 hover:to-gray-500 rounded-lg flex items-center justify-center text-white transition-all border border-gray-600/30 hover:border-gray-500/50"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 px-6 text-center text-gray-400">
                        {isLoadingPurchases ? (
                          <div className="flex items-center justify-center gap-2">
                            <Spinner size="sm" />
                            <span>Loading transactions...</span>
                          </div>
                        ) : (
                          "No transactions found matching your criteria"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>         

            {pages > 1 && (
              <div className="flex justify-center items-center py-6 border-t border-gray-700/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg bg-gray-800/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#E9423A] text-white'
                            : 'bg-gray-800/50 text-white hover:bg-gray-700/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(pages, currentPage + 1))}
                    disabled={currentPage === pages}
                    className="px-3 py-2 rounded-lg bg-gray-800/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Status Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div>
            {filteredTransactions.length > 0 && `Showing ${filteredTransactions.length} of ${transactions.length} transactions`}
            {isLoadingBlockchain && (
              <span className="text-blue-400">
                {" • "}Scanning blockchain for yield payments since your first purchase...
              </span>
            )}
            {hasStartedBlockchainScan && !isLoadingBlockchain && (
              <span className="text-green-400">
                {" • "}Blockchain scan complete
              </span>
            )}
          </div>
        </div>
      </div>
    </DashboardTemplate>
  );
};

export default TransactionsPage;