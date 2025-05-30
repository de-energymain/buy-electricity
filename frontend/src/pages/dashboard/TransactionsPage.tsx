import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
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
  EthernetPort
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

// Token interface
interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  value: number;
  priceChange: number;
}

// Transaction interface
interface Transaction {
  id: string;
  type: "receive" | "send" | "swap" | "stake" | "unstake" | "reward";
  token: string;
  amount: number;
  timestamp: number;
  from?: string;
  to?: string;
  status: "confirmed" | "pending" | "failed";
  fee?: number;
  blockHash?: string;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [typeFilter, setTypeFilter] = useState<string[]>(["all"]);
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const rowsPerPage = 10;

  // Generate mock data
  useEffect(() => {
    //Mock tokens (from wallet page)
    const mockTokens: Token[] = [
      {
        symbol: "NRG",
        name: "Energy Token",
        icon: "✨",
        balance: 613.42,
        value: 1226.84, // $2 per NRG
        priceChange: 4.2
      },
      {
        symbol: "SOL",
        name: "Solana",
        icon: "☀️",
        balance: 2.85,
        value: 371.05, // $130 per SOL
        priceChange: -1.8
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        icon: "💵",
        balance: 150.25,
        value: 150.25, // 1:1 with USD
        priceChange: 0.1
      }
    ];

    // Calculate total balance
    const total = mockTokens.reduce((sum, token) => sum + token.value, 0);
    setTotalBalance(total);
    
    const types: ("receive" | "send" | "swap" | "stake" | "unstake" | "reward")[] = [
      "receive", "send", "swap", "stake", "unstake", "reward"
    ];
    
    const tokens = ["NRG", "SOL", "USDC"];
   // const statuses: ("confirmed" | "pending" | "failed")[] = ["confirmed", "pending", "failed"];
    
    // Generate 50 random transactions
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    const mockTransactions: Transaction[] = Array.from({ length: 50 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const status = i < 40 ? "confirmed" : i < 45 ? "pending" : "failed";
      const daysAgo = Math.floor(Math.random() * 30);
      
      return {
        id: `tx-${(1000 + i).toString()}`,
        type,
        token,
        amount: +(Math.random() * 100).toFixed(2),
        timestamp: now - (daysAgo * day) - Math.floor(Math.random() * day),
        from: type === "receive" ? "Solar Farm Rewards" : undefined,
        to: type === "send" ? "External Wallet" : undefined,
        status,
        fee: +(Math.random() * 0.01).toFixed(4),
        blockHash: status === "confirmed" ? `0x${Math.random().toString(16).substring(2, 14)}` : undefined
      };
    });
    
    // Sort by timestamp (newest first)
    mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

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
        (tx.to && tx.to.toLowerCase().includes(query))
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, typeFilter, timeFilter, transactions]);

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
        return `Reward Payment`;
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

  return (
    <DashboardTemplate title="Transactions" activePage="transactions">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-gray-400">View and manage all your transactions, including rewards.</p>
          </div>         
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-green-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Received</div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <ArrowDown size={20} className="text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">
              +{transactions
                .filter(tx => tx.type === "receive" || tx.type === "reward")
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Tokens Received</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-red-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Sent</div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                <ArrowUp size={20} className="text-red-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              -{transactions
                .filter(tx => tx.type === "send")
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Tokens Sent</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Network Fees</div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                <EthernetPort size={20} className="text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {transactions
                .reduce((sum, tx) => sum + (tx.fee || 0), 0)
                .toFixed(4)}
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
              ${totalBalance.toFixed(2)}
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
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize text-white font-medium">{tx.type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-semibold ${tx.type === "receive" || tx.type === "reward" ? "text-green-500" : "text-white"}`}>
                        {tx.type === "receive" || tx.type === "reward" ? "+" : tx.type === "send" ? "-" : ""}{tx.amount.toFixed(2)} {tx.token}
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
                        onClick={() => window.open(`https://explorer.solana.com/tx/${tx.id}?cluster=devnet`, '_blank')}
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