import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Chip
} from "@nextui-org/react";
import {
  Wallet as WalletIcon,
  Copy,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Clock,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
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
  type: "receive" | "send" | "swap" | "stake";
  token: string;
  amount: number;
  timestamp: number;
  from?: string;
  to?: string;
  status: "confirmed" | "pending" | "failed";
}

const WalletPage: React.FC = () => {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<string>("tokens");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [depositAddress, setDepositAddress] = useState<string>("wallet address will appear here");
  const [activeDeposit, setActiveDeposit] = useState<string>("NRG");

  // Generate mock data
  useEffect(() => {
    // Mock tokens
    const mockTokens: Token[] = [
      {
        symbol: "NRG",
        name: "Energy Token",
        icon: "✨",
        balance: 613.42,
        value: 1226.84,  // $2 per NRG
        priceChange: 4.2
      },
      {
        symbol: "SOL",
        name: "Solana",
        icon: "☀️",
        balance: 2.85,
        value: 371.05,  // $130 per SOL
        priceChange: -1.8
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        icon: "💵",
        balance: 150.25,
        value: 150.25,  // 1:1 with USD
        priceChange: 0.1
      }
    ];
    
    // Calculate total balance
    const total = mockTokens.reduce((sum, token) => sum + token.value, 0);
    
    setTokens(mockTokens);
    setTotalBalance(total);
    
    // Mock transactions
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    const mockTransactions: Transaction[] = [
      {
        id: "tx-001",
        type: "receive",
        token: "NRG",
        amount: 42.5,
        timestamp: now - (1 * day),
        from: "Solar Farm Rewards",
        status: "confirmed"
      },
      {
        id: "tx-002",
        type: "receive",
        token: "NRG",
        amount: 36.8,
        timestamp: now - (2 * day),
        from: "Solar Farm Rewards",
        status: "confirmed"
      },
      {
        id: "tx-003",
        type: "swap",
        token: "NRG",
        amount: 50.0,
        timestamp: now - (3 * day),
        to: "SOL",
        status: "confirmed"
      },
      {
        id: "tx-004",
        type: "send",
        token: "SOL",
        amount: 0.5,
        timestamp: now - (4 * day),
        to: "Market Purchase",
        status: "confirmed"
      },
      {
        id: "tx-005",
        type: "stake",
        token: "NRG",
        amount: 100.0,
        timestamp: now - (5 * day),
        status: "confirmed"
      },
      {
        id: "tx-006",
        type: "receive",
        token: "USDC",
        amount: 150.0,
        timestamp: now - (7 * day),
        from: "External Deposit",
        status: "confirmed"
      },
      {
        id: "tx-007",
        type: "send",
        token: "SOL",
        amount: 0.2,
        timestamp: now - (8 * day),
        to: "Network Fee",
        status: "failed"
      }
    ];
    
    setTransactions(mockTransactions);
  }, []);

  // Handle deposit
  const handleDeposit = (token: string) => {
    setActiveDeposit(token);
    if (publicKey) {
      setDepositAddress(publicKey.toString());
    } else {
      setDepositAddress("Please connect your wallet first");
    }
    onOpen();
  };

  // Format timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You would normally add a toast notification here
    console.log("Copied to clipboard:", text);
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
        return <WalletIcon className="text-purple-500" size={20} />;
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

 return (
    <DashboardTemplate title="Wallet" activePage="wallet">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
            <p className="text-gray-400">Access your wallet to send, receive and stake tokens.</p>
          </div>         
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#2A1A1A] border-gray-800 border mb-8">
          <CardBody className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2 font-medium">Total Balance</div>
                <div className="text-4xl text-white font-bold mb-1">${totalBalance.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Available to trade and stake</div>
              </div>
              <div className="flex gap-3">
                <Button 
                  className="bg-[#E9423A] hover:bg-[#D63529] text-white font-medium px-6 py-2.5 transition-colors"
                  startContent={<ArrowUp size={18} />}
                >
                  Send
                </Button>
                <Button 
                  className="bg-[#2A1A1A] hover:bg-[#3A2A2A] text-white border border-gray-700 font-medium px-6 py-2.5 transition-colors"
                  startContent={<ArrowDown size={18} />}
                  onPress={() => handleDeposit("NRG")}
                >
                  Deposit
                </Button>
                <Button 
                  className="bg-[#2A1A1A] hover:bg-[#3A2A2A] text-white border border-gray-700 font-medium px-6 py-2.5 transition-colors"
                  startContent={<RefreshCw size={18} />}
                >
                  Swap
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Tabs */}
        <div className="mb-8">
          <Tabs 
            aria-label="Wallet Tabs" 
            selectedKey={activeTab}
            onSelectionChange={key => setActiveTab(key as string)}
            color="danger"
            variant="bordered"
            size="lg"
            classNames={{
              base: "w-full",
              tabList: "bg-[#1A1A1A] border border-gray-800 p-1 rounded-xl",
              cursor: "bg-[#E9423A] shadow-lg",
              tab: "text-gray-400 data-[selected=true]:text-white font-medium px-8 py-3",
              panel: "pt-8"
            }}
          >
            <Tab key="tokens" title="Tokens" />
            <Tab key="transactions" title="Transactions" />
            <Tab key="staking" title="Staking" />
          </Tabs>
        </div>
        
        {/* Tokens Tab */}
        {activeTab === "tokens" && (
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-0">
              <Table 
                aria-label="Tokens"
                removeWrapper
                classNames={{
                  base: "bg-transparent",
                  thead: "[&>tr]:first:shadow-none",
                  th: "bg-[#2A1A1A] text-gray-400 text-sm font-semibold py-4 px-6 first:rounded-tl-lg last:rounded-tr-lg",
                  td: "text-white border-t border-gray-800 py-4 px-6",
                  tr: "hover:bg-[#2A1A1A]/50 transition-colors cursor-pointer"
                }}
              >
                <TableHeader>
                  <TableColumn>TOKEN</TableColumn>
                  <TableColumn>BALANCE</TableColumn>
                  <TableColumn>VALUE</TableColumn>
                  <TableColumn>CHANGE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {tokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-12 h-12 flex items-center justify-center mr-4 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] rounded-xl text-xl border border-gray-800">
                            {token.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-base">{token.symbol}</div>
                            <div className="text-sm text-gray-500">{token.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">
                          {token.balance.toFixed(2)} {token.symbol}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-white">
                          ${token.value.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${token.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {token.priceChange > 0 ? "+" : ""}{token.priceChange}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-[#E9423A] hover:bg-[#D63529] text-white font-medium px-4 transition-colors"
                            startContent={<ArrowUp size={14} />}
                          >
                            Send
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-[#2A1A1A] hover:bg-[#3A2A2A] text-white border border-gray-700 font-medium px-4 transition-colors"
                            startContent={<ArrowDown size={14} />}
                            onPress={() => handleDeposit(token.symbol)}
                          >
                            Deposit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
        
        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <Card className="bg-[#1A1A1A] border-gray-800 border">
            <CardBody className="p-0">
              <Table 
                aria-label="Transactions"
                removeWrapper
                classNames={{
                  base: "bg-transparent",
                  thead: "[&>tr]:first:shadow-none",
                  th: "bg-[#2A1A1A] text-gray-400 text-sm font-semibold py-4 px-6 first:rounded-tl-lg last:rounded-tr-lg",
                  td: "text-white border-t border-gray-800 py-4 px-6",
                  tr: "hover:bg-[#2A1A1A]/50 transition-colors"
                }}
              >
                <TableHeader>
                  <TableColumn>TRANSACTION</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center mr-4 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] rounded-xl border border-gray-800">
                            {getTransactionIcon(tx.type, tx.status)}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">
                              {tx.type === "receive" ? `Received from ${tx.from}` :
                              tx.type === "send" ? `Sent to ${tx.to}` :
                              tx.type === "swap" ? `Swapped ${tx.token} to ${tx.to}` :
                              `Staked ${tx.token}`}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              {tx.id.substring(0, 8)}...
                              <Button
                                isIconOnly
                                size="sm"
                                className="bg-transparent hover:bg-gray-800 min-w-0 w-5 h-5 p-0 transition-colors"
                                onPress={() => copyToClipboard(tx.id)}
                              >
                                <Copy size={12} className="text-gray-500 hover:text-gray-300" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize font-medium text-gray-300">{tx.type}</span>
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${tx.type === "receive" ? "text-green-400" : "text-white"}`}>
                          {tx.type === "receive" ? "+" : ""}{tx.amount} {tx.token}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300">{formatDate(tx.timestamp)}</span>
                      </TableCell>
                      <TableCell>{getStatusChip(tx.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
        
        {/* Staking Tab */}
        {activeTab === "staking" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-[#1A1A1A] border-gray-800 border">
              <CardHeader className="border-b border-gray-800 p-6">
                <h3 className="text-xl text-white font-semibold">Active Stakes</h3>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#2A1A1A] to-[#1F1F1F] p-6 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-semibold text-white text-lg">NRG Staking Pool</div>
                        <div className="text-sm text-gray-400">Started 30 days ago</div>
                      </div>
                      <Chip color="success" size="sm" className="font-medium">Active</Chip>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Staked Amount</div>
                        <div className="font-semibold text-white text-lg">100 NRG</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Annual Yield</div>
                        <div className="font-semibold text-green-400 text-lg">12.5%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Rewards Earned</div>
                        <div className="font-semibold text-green-400 text-lg">10.27 NRG</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Unlock Date</div>
                        <div className="font-semibold text-white">June 12, 2025</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button className="flex-1 bg-[#E9423A] hover:bg-[#D63529] text-white font-medium transition-colors">
                        Claim Rewards
                      </Button>
                      <Button className="flex-1 bg-[#3A1A1A] hover:bg-[#4A2A2A] text-white border border-gray-700 font-medium transition-colors">
                        Unstake
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-gray-600 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-[#2A1A1A] rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-800">
                      <Plus size={24} className="text-gray-400" />
                    </div>
                    <div className="text-gray-400 mb-3 font-medium">Stake more tokens to earn rewards</div>
                    <Button className="bg-[#2A1A1A] hover:bg-[#3A2A2A] text-white border border-gray-700 font-medium transition-colors">
                      New Stake
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className="bg-[#1A1A1A] border-gray-800 border">
              <CardHeader className="border-b border-gray-800 p-6">
                <h3 className="text-xl text-white font-semibold">Staking Options</h3>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#2A1A1A] to-[#1F1F1F] p-6 rounded-xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-white text-lg">Flexible Staking</div>
                      <div className="text-green-400 font-bold text-lg">8.5% APY</div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Stake your NRG tokens with no lock-up period. Withdraw anytime.
                    </div>
                    <Button className="w-full bg-[#E9423A] hover:bg-[#D63529] text-white font-medium transition-colors group-hover:scale-[1.02]">
                      Stake Now
                    </Button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#2A1A1A] to-[#1F1F1F] p-6 rounded-xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-white text-lg">30-Day Lock</div>
                      <div className="text-green-400 font-bold text-lg">12.5% APY</div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Lock your NRG tokens for 30 days to earn higher rewards.
                    </div>
                    <Button className="w-full bg-[#E9423A] hover:bg-[#D63529] text-white font-medium transition-colors group-hover:scale-[1.02]">
                      Stake Now
                    </Button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#2A1A1A] to-[#1F1F1F] p-6 rounded-xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-200 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-white text-lg">90-Day Lock</div>
                      <div className="text-green-400 font-bold text-lg">18.0% APY</div>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Lock your NRG tokens for 90 days to maximize your rewards.
                    </div>
                    <Button className="w-full bg-[#E9423A] hover:bg-[#D63529] text-white font-medium transition-colors group-hover:scale-[1.02]">
                      Stake Now
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 border border-yellow-600/30 rounded-xl bg-yellow-900/10">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                        <AlertTriangle className="text-yellow-400" size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-400 mb-1">Important Notice</div>
                        <div className="text-sm text-gray-300 leading-relaxed">
                          Early withdrawal from locked staking will result in a penalty on earned rewards. Please consider your liquidity needs before staking.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
        
        {/* Deposit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" size="md">
          <ModalContent className="bg-[#1A1A1A] border border-gray-800">
            <ModalHeader className="text-white text-xl font-semibold border-b border-gray-800">
              Deposit {activeDeposit}
            </ModalHeader>
            <ModalBody className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#3A1A1A] to-[#2A1A1A] rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3 border border-gray-800">
                  {activeDeposit === "NRG" ? "✨" : activeDeposit === "SOL" ? "☀️" : "💵"}
                </div>
                <div className="text-xl font-semibold text-white">{activeDeposit}</div>
                <div className="text-sm text-gray-400">
                  {activeDeposit === "NRG" ? "Energy Token" : 
                  activeDeposit === "SOL" ? "Solana" : "USD Coin"}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3 font-medium">Your Deposit Address</div>
                <div className="relative">
                  <Input
                    value={depositAddress}
                    readOnly
                    variant="bordered"
                    classNames={{
                      base: "w-full",
                      inputWrapper: "bg-[#2A1A1A] border-gray-700 hover:border-gray-600 pr-20",
                      input: "text-white font-mono text-sm"
                    }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#3A1A1A] hover:bg-[#4A2A2A] border border-gray-700 min-w-0 transition-colors"
                      onPress={() => copyToClipboard(depositAddress)}
                    >
                      <Copy size={14} className="text-gray-400" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-[#3A1A1A] hover:bg-[#4A2A2A] border border-gray-700 min-w-0 transition-colors"
                      onPress={() => window.open(`https://explorer.solana.com/address/${depositAddress}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink size={14} className="text-gray-400" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border border-yellow-600/30 rounded-xl p-4 bg-yellow-900/10">
                <div className="text-sm text-yellow-400 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center mt-0.5">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="leading-relaxed">
                    <span className="font-semibold">Important:</span> Only send {activeDeposit} to this address. Sending any other token may result in permanent loss.
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-800 p-6">
              <Button 
                className="bg-[#E9423A] hover:bg-[#D63529] text-white font-medium px-8 transition-colors"
                onPress={onClose}
              >
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DashboardTemplate>
  );
};

export default WalletPage;