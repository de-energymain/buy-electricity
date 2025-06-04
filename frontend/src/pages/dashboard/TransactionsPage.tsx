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
  RefreshCw,
  Calendar,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Wallet,
  EthernetPort,
  ShoppingCart
} from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import DashboardTemplate from "../../components/DashboardTemplate";

// Purchase interface from your API
interface PurchaseData {
  _id: string;
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
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced transaction interface
interface Transaction {
  id: string;
  type: "purchase" | "yield" | "send" | "receive" | "swap" | "stake" | "unstake" | "reward";
  token: string;
  amount: number;
  timestamp: number;
  from?: string;
  to?: string;
  status: "confirmed" | "pending" | "failed";
  fee?: number;
  blockHash?: string;
  signature?: string;
  // Additional fields for purchase transactions
  farmName?: string;
  panels?: number;
  source: "api" | "chain"; // To distinguish data sources
}

interface WalletBalance {
  sol: number;
  nrg: number; // This would need to be calculated from your yield system
  usdc: number;
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
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ sol: 0, nrg: 0, usdc: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [userPanelData, setUserPanelData] = useState({ generatedYield: 0 });
  
  const rowsPerPage = 10;
  
  // Solana connection
  const connection = new Connection("https://api.devnet.solana.com");
  
  // Constants
  const DOLLAR_TO_NRG_RATE = 0.03; // $0.03 per NRG token

  // Extract wallet ID from wallet or Web3Auth
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

  // Fetch purchase data from your API
  const fetchPurchaseData = async (walletAddress: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`http://localhost:5000/api/purchases/wallet/${walletAddress}`);
      if (response.ok) {
        const result = await response.json();
        const purchases: PurchaseData[] = result.data || [];
        
        // Convert purchases to transactions
        return purchases.map(purchase => ({
          id: purchase.transactionHash,
          type: "purchase" as const,
          token: purchase.paymentMethod,
          amount: purchase.tokenAmount,
          timestamp: new Date(purchase.purchaseDate || purchase.createdAt).getTime(),
          to: "Solar Panel Purchase",
          status: "confirmed" as const,
          signature: purchase.transactionHash,
          farmName: purchase.farmName,
          panels: purchase.panelsPurchased,
          source: "api" as const
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      return [];
    }
  };

  // Fetch user data for yield calculations
  const fetchUserData = async (walletAddress: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${walletAddress}`);
      if (response.ok) {
        const userData = await response.json();
        setUserPanelData({
          generatedYield: userData.user.panelDetails.generatedYield
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Scan blockchain for yield transactions
  const scanWalletTransactions = async (walletAddress: string): Promise<Transaction[]> => {
    try {
      const pubKey = new PublicKey(walletAddress);
      
      // Get transaction signatures (limited to recent ones due to API limits)
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 50 });
      
      const chainTransactions: Transaction[] = [];
      
      // Process each signature to get transaction details
      for (const sigInfo of signatures) {
        try {
          const transaction = await connection.getParsedTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (transaction && transaction.meta && !transaction.meta.err) {
            // Analyze transaction to determine if it's a yield payment
            const isYieldTransaction = await analyzeTransactionForYield(transaction, walletAddress);
            
            if (isYieldTransaction) {
              chainTransactions.push({
                id: sigInfo.signature,
                type: "yield",
                token: "NRG", // Assuming yield is paid in NRG
                amount: isYieldTransaction.amount,
                timestamp: (sigInfo.blockTime || 0) * 1000,
                from: "Yield Distribution",
                status: "confirmed",
                signature: sigInfo.signature,
                source: "chain"
              });
            }
          }
        } catch (error) {
          // Skip failed transaction parsing
          console.warn(`Failed to parse transaction ${sigInfo.signature}:`, error);
        }
      }
      
      return chainTransactions;
    } catch (error) {
      console.error('Error scanning wallet transactions:', error);
      return [];
    }
  };

  // Analyze transaction to determine if it's a yield payment
  const analyzeTransactionForYield = async (
    transaction: ParsedTransactionWithMeta, 
    walletAddress: string
  ): Promise<{ amount: number } | null> => {
    if (!transaction.meta?.postBalances || !transaction.meta?.preBalances) {
      return null;
    }

    // Look for SOL balance changes (assuming yield is paid in SOL for now)
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
      key => key.pubkey.toString() === walletAddress
    );

    if (accountIndex !== -1) {
      const preBalance = transaction.meta.preBalances[accountIndex];
      const postBalance = transaction.meta.postBalances[accountIndex];
      const balanceChange = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

      // If there's a positive balance change and it's a small amount (likely yield)
      if (balanceChange > 0 && balanceChange < 1) {
        // Convert SOL to NRG equivalent for display
        const nrgEquivalent = balanceChange / DOLLAR_TO_NRG_RATE;
        return { amount: nrgEquivalent };
      }
    }

    return null;
  };

  // Fetch wallet balance
  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      const pubKey = new PublicKey(walletAddress);
      const solBalance = await connection.getBalance(pubKey);
      
      // Calculate NRG balance from user yield data
      const nrgBalance = userPanelData.generatedYield / DOLLAR_TO_NRG_RATE;
      
      setWalletBalance({
        sol: solBalance / 1e9, // Convert lamports to SOL
        nrg: nrgBalance,
        usdc: 0 // Would need token account parsing for USDC
      });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Main data fetching function
  const fetchAllTransactions = async () => {
    if (!walletID) return;
    
    setIsLoading(true);
    try {
      // Fetch data in parallel
      const [purchaseTransactions, chainTransactions] = await Promise.all([
        fetchPurchaseData(walletID),
        scanWalletTransactions(walletID)
      ]);
      
      // Also fetch user data for yield calculations
      await fetchUserData(walletID);
      
      // Combine and sort by timestamp
      const allTransactions = [...purchaseTransactions, ...chainTransactions]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      // Fetch wallet balance
      await fetchWalletBalance(walletID);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (walletID) {
      fetchAllTransactions();
    }
  }, [walletID]);

  // Update balance when user data changes
  useEffect(() => {
    if (walletID && userPanelData.generatedYield > 0) {
      fetchWalletBalance(walletID);
    }
  }, [userPanelData, walletID]);

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
    const totalReceived = transactions
      .filter(tx => tx.type === "purchase" || tx.type === "yield")
      .reduce((sum, tx) => sum + (tx.amount * (tx.token === "SOL" ? 20 : tx.token === "USDC" ? 1 : 0.03)), 0);
    
    const totalSent = transactions
      .filter(tx => tx.type === "send")
      .reduce((sum, tx) => sum + (tx.amount * (tx.token === "SOL" ? 20 : tx.token === "USDC" ? 1 : 0.03)), 0);
    
    const totalFees = transactions
      .reduce((sum, tx) => sum + (tx.fee || 0), 0);
    
    const totalBalance = (walletBalance.sol * 20) + walletBalance.nrg * 0.03 + walletBalance.usdc;

    return {
      totalReceived,
      totalSent,
      totalFees,
      totalBalance
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
      case "receive":
        return <ArrowDown className="text-green-500" size={20} />;
      case "send":
        return <ArrowUp className="text-red-500" size={20} />;
      case "swap":
        return <RefreshCw className="text-blue-500" size={20} />;
      case "stake":
        return <Wallet className="text-purple-500" size={20} />;
      case "unstake":
        return <Wallet className="text-orange-500" size={20} />;
      case "reward":
        return <CheckCircle className="text-green-500" size={20} />;
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
        return "Yield Payment";
      case "receive":
        return `Received from ${tx.from || 'Unknown'}`;
      case "send":
        return `Sent to ${tx.to || 'Unknown'}`;
      case "swap":
        return `Swapped ${tx.token}`;
      case "stake":
        return `Staked ${tx.token}`;
      case "unstake":
        return `Unstaked ${tx.token}`;
      case "reward":
        return "Reward Payment";
      default:
        return tx.type;
    }
  };

  // Calculate pages
  const pages = Math.ceil(filteredTransactions.length / rowsPerPage);
  
  // Get current page items
  const currentItems = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (isLoading) {
    return (
      <DashboardTemplate title="Transactions" activePage="transactions">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" color="danger" className="mb-4" />
            <div className="text-xl mb-2 text-white">Loading transactions...</div>
            <div className="text-sm text-gray-400">Fetching purchase history and blockchain data</div>
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate title="Transactions" activePage="transactions">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-gray-400">View and manage all your transactions, including purchases and rewards.</p>
          </div>
          <Button
            className="bg-[#E9423A] text-white"
            startContent={<RefreshCw size={16} />}
            onPress={fetchAllTransactions}
          >
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-green-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Spent</div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <ShoppingCart size={20} className="text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">
              ${summaryStats.totalReceived.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Panel Purchases</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Yield Earned</div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <ArrowDown size={20} className="text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {walletBalance.nrg.toFixed(2)} NRG
            </div>
            <div className="text-sm text-gray-400">Total Rewards</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Network Fees</div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                <EthernetPort size={20} className="text-yellow-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {summaryStats.totalFees.toFixed(4)}
            </div>
            <div className="text-sm text-gray-400">SOL Fees</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Balance</div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                <Wallet size={20} className="text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              ${summaryStats.totalBalance.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Available Balance</div>
          </div>
        </div>

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
                <DropdownItem key="purchase">Purchase</DropdownItem>
                <DropdownItem key="yield">Yield</DropdownItem>
                <DropdownItem key="receive">Receive</DropdownItem>
                <DropdownItem key="send">Send</DropdownItem>
                <DropdownItem key="swap">Swap</DropdownItem>
                <DropdownItem key="stake">Stake</DropdownItem>
                <DropdownItem key="unstake">Unstake</DropdownItem>
                <DropdownItem key="reward">Reward</DropdownItem>
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
        
        {/* Transactions Table */}
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
                {currentItems.map((tx, index) => (
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
                      {tx.source === "chain" && (
                        <div className="text-xs text-green-400">Blockchain</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-semibold ${tx.type === "yield" || tx.type === "receive" ? "text-green-500" : "text-white"}`}>
                        {tx.type === "yield" || tx.type === "receive" ? "+" : tx.type === "send" ? "-" : ""}{tx.amount.toFixed(2)} {tx.token}
                      </div>
                      {tx.fee && (
                        <div className="text-xs text-gray-400 mt-1">
                          Fee: {tx.fee.toFixed(4)} SOL
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-white text-sm">{formatDate(tx.timestamp)}</td>
                    <td className="py-4 px-6">{getStatusChip(tx.status)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          const explorerUrl = tx.source === "chain" 
                            ? `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`
                            : `https://explorer.solana.com/tx/${tx.id}?cluster=devnet`;
                          window.open(explorerUrl, '_blank');
                        }}
                        className="w-10 h-10 bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] hover:from-gray-600 hover:to-gray-500 rounded-lg flex items-center justify-center text-white transition-all border border-gray-600/30 hover:border-gray-500/50"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
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
      </div>
    </DashboardTemplate>
  );
};

export default TransactionsPage;