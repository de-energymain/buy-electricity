import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination
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
  Wallet
} from "lucide-react";
import DashboardTemplate from "../../components/DashboardTemplate";

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
  const rowsPerPage = 10;

  // Generate mock data
  useEffect(() => {
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
      <Card className="bg-[#1A1A1A] border-none mb-4">
        <CardBody>
          <Table 
            aria-label="Transactions table"
            removeWrapper
            bottomContent={
              pages > 1 ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="danger"
                    page={currentPage}
                    total={pages}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              ) : null
            }
            classNames={{
              base: "bg-transparent",
              thead: "[&>tr]:first:shadow-none",
              th: "bg-gray-900/50 text-gray-400 text-xs font-medium py-3",
              td: "text-white border-t border-gray-800",
              tr: "hover:bg-gray-900/20 transition-colors"
            }}
          >
            <TableHeader>
              <TableColumn>TRANSACTION</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No transactions found">
              {currentItems.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center mr-3 bg-[#2A1A1A] rounded-full">
                        {getTransactionIcon(tx.type, tx.status)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {getTransactionDescription(tx)}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {tx.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell>
                    <div className={tx.type === "receive" || tx.type === "reward" ? "text-green-500" : "text-white"}>
                      {tx.type === "receive" || tx.type === "reward" ? "+" : tx.type === "send" ? "-" : ""}{tx.amount.toFixed(2)} {tx.token}
                    </div>
                    {tx.fee && (
                      <div className="text-xs text-gray-400">
                        Fee: {tx.fee.toFixed(4)} SOL
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(tx.timestamp)}</TableCell>
                  <TableCell>{getStatusChip(tx.status)}</TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#2A1A1A] text-white"
                      onPress={() => window.open(`https://explorer.solana.com/tx/${tx.id}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      
      {/* Total Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Received</div>
            <div className="text-2xl font-bold text-green-500">
              +{transactions
                .filter(tx => tx.type === "receive" || tx.type === "reward")
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)} Tokens
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Sent</div>
            <div className="text-2xl font-bold text-white">
              -{transactions
                .filter(tx => tx.type === "send")
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)} Tokens
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody className="p-4">
            <div className="text-sm text-gray-400 mb-1">Network Fees</div>
            <div className="text-2xl font-bold text-white">
              {transactions
                .reduce((sum, tx) => sum + (tx.fee || 0), 0)
                .toFixed(4)} SOL
            </div>
          </CardBody>
        </Card>
      </div>
      </div>
    </DashboardTemplate>
  );
};

export default TransactionsPage;