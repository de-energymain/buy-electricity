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
      <Card className="bg-[#1A1A1A] border-none mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Total Balance</div>
              <div className="text-3xl text-white font-bold">${totalBalance.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-[#E9423A] text-white"
                startContent={<ArrowUp size={16} />}
              >
                Send
              </Button>
              <Button 
                className="bg-[#2A1A1A] text-white"
                startContent={<ArrowDown size={16} />}
                onPress={() => handleDeposit("NRG")}
              >
                Deposit
              </Button>
              <Button 
                className="bg-[#2A1A1A] text-white"
                startContent={<RefreshCw size={16} />}
              >
                Swap
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Tabs */}
      <Tabs 
        aria-label="Wallet Tabs" 
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as string)}
        color="danger"
        variant="bordered"
        classNames={{
          base: "mb-6",
          tabList: "bg-[#1A1A1A] p-0",
          cursor: "bg-[#E9423A]",
          tab: "text-gray-400 data-[selected=true]:text-white"
        }}
      >
        <Tab key="tokens" title="Tokens" />
        <Tab key="transactions" title="Transactions" />
        <Tab key="staking" title="Staking" />
      </Tabs>
      
      {/* Tokens Tab */}
      {activeTab === "tokens" && (
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody>
            <Table 
              aria-label="Tokens"
              removeWrapper
              classNames={{
              base: "bg-transparent",
              thead: "[&>tr]:first:shadow-none",
              th: "bg-gray-900/50 text-gray-400 text-xs font-medium py-3",
              td: "text-white border-t border-gray-800",
              tr: "hover:bg-gray-900/20 transition-colors"
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
                        <div className="w-10 h-10 flex items-center justify-center mr-3 bg-[#2A1A1A] rounded-full text-xl">
                          {token.icon}
                        </div>
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{token.balance.toFixed(2)} {token.symbol}</TableCell>
                    <TableCell>${token.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={token.priceChange >= 0 ? "text-green-500" : "text-red-500"}>
                        {token.priceChange > 0 ? "+" : ""}{token.priceChange}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-[#2A1A1A] text-white min-w-0 px-3"
                          startContent={<ArrowUp size={14} />}
                        >
                          Send
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#2A1A1A] text-white min-w-0 px-3"
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
        <Card className="bg-[#1A1A1A] border-none">
          <CardBody>
            <Table 
              aria-label="Transactions"
              removeWrapper
              classNames={{
                base: "bg-[#1A1A1A] text-white",
                thead: "bg-[#2A2A2A]",
                th: "text-gray-400 text-xs font-normal py-3",
                td: "text-white border-t border-gray-800"
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
                        <div className="w-8 h-8 flex items-center justify-center mr-3 bg-[#2A1A1A] rounded-full">
                          {getTransactionIcon(tx.type, tx.status)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {tx.type === "receive" ? `Received from ${tx.from}` :
                             tx.type === "send" ? `Sent to ${tx.to}` :
                             tx.type === "swap" ? `Swapped ${tx.token} to ${tx.to}` :
                             `Staked ${tx.token}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tx.id.substring(0, 8)}...
                            <Button
                              isIconOnly
                              size="sm"
                              className="ml-1 bg-transparent min-w-0 w-5 h-5 p-0"
                              onPress={() => copyToClipboard(tx.id)}
                            >
                              <Copy size={12} className="text-gray-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell>
                      <div className={tx.type === "receive" ? "text-green-500" : "text-white"}>
                        {tx.type === "receive" ? "+" : ""}{tx.amount} {tx.token}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(tx.timestamp)}</TableCell>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#1A1A1A] border-none h-min">
            <CardHeader className="border-b border-gray-800">
              <h3 className="text-lg text-white font-medium">Active Stakes</h3>
            </CardHeader>
            <CardBody className="p-6">
              <div className="space-y-6">
                <div className="bg-[#2A1A1A] p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-white">NRG Staking Pool</div>
                      <div className="text-xs text-gray-400">Started 30 days ago</div>
                    </div>
                    <Chip color="success" size="sm">Active</Chip>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Staked Amount</div>
                    <div className="font-medium text-white">100 NRG</div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Annual Yield</div>
                    <div className="font-medium text-green-500">12.5%</div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Rewards Earned</div>
                    <div className="font-medium text-green-500">10.27 NRG</div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Unlock Date</div>
                    <div className="font-medium text-white">June 12, 2025</div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1 bg-[#E9423A] text-white">
                      Claim Rewards
                    </Button>
                    <Button className="flex-1 bg-[#2A2A2A] text-white">
                      Unstake
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-4 text-gray-400 border border-dashed border-gray-700 rounded-lg">
                  <Plus size={24} className="mx-auto mb-2" />
                  <div>Stake more tokens to earn rewards</div>
                  <Button className="mt-2 bg-[#2A2A2A] text-white">
                    New Stake
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-none h-min">
            <CardHeader className="border-b border-gray-800">
              <h3 className="text-lg text-white font-medium">Staking Options</h3>
            </CardHeader>
            <CardBody className="p-6">
              <div className="space-y-4">
                <div className="bg-[#2A1A1A] p-4 rounded-lg hover:bg-[#3A1A1A] cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white">Flexible Staking</div>
                    <div className="text-green-500 font-medium">8.5% APY</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Stake your NRG tokens with no lock-up period. Withdraw anytime.</div>
                  <Button className="w-full bg-[#E9423A] text-white">
                    Stake Now
                  </Button>
                </div>
                
                <div className="bg-[#2A1A1A] p-4 rounded-lg hover:bg-[#3A1A1A] cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white">30-Day Lock</div>
                    <div className="text-green-500 font-medium">12.5% APY</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Lock your NRG tokens for 30 days to earn higher rewards.</div>
                  <Button className="w-full bg-[#E9423A] text-white">
                    Stake Now
                  </Button>
                </div>
                
                <div className="bg-[#2A1A1A] p-4 rounded-lg hover:bg-[#3A1A1A] cursor-pointer transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white">90-Day Lock</div>
                    <div className="text-green-500 font-medium">18.0% APY</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Lock your NRG tokens for 90 days to maximize your rewards.</div>
                  <Button className="w-full bg-[#E9423A] text-white">
                    Stake Now
                  </Button>
                </div>
                
                <div className="mt-4 p-4 border border-dashed border-yellow-600 rounded-lg bg-yellow-900 bg-opacity-20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-yellow-500 mt-0.5" size={18} />
                    <div>
                      <div className="font-medium text-yellow-500">Important Notice</div>
                      <div className="text-sm text-gray-300">Early withdrawal from locked staking will result in a penalty on earned rewards. Please consider your liquidity needs before staking.</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      
      {/* Deposit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent className="bg-[#1A1A1A] text-white">
          <ModalHeader>Deposit {activeDeposit}</ModalHeader>
          <ModalBody>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-[#2A1A1A] rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
                {activeDeposit === "NRG" ? "✨" : activeDeposit === "SOL" ? "☀️" : "💵"}
              </div>
              <div className="text-lg font-medium">{activeDeposit}</div>
              <div className="text-xs text-gray-400">
                {activeDeposit === "NRG" ? "Energy Token" : 
                 activeDeposit === "SOL" ? "Solana" : "USD Coin"}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Your Deposit Address</div>
              <div className="relative">
                <Input
                  value={depositAddress}
                  readOnly
                  variant="bordered"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "bg-[#2A1A1A] border-gray-700",
                    input: "text-white"
                  }}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-transparent min-w-0"
                    onPress={() => copyToClipboard(depositAddress)}
                  >
                    <Copy size={14} className="text-gray-400" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    className="bg-transparent min-w-0"
                    onPress={() => window.open(`https://explorer.solana.com/address/${depositAddress}?cluster=devnet`, '_blank')}
                  >
                    <ExternalLink size={14} className="text-gray-400" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-4">
              <div className="text-sm text-yellow-500 flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5" />
                <div>
                  Only send {activeDeposit} to this address. Sending any other token may result in permanent loss.
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              className="bg-[#E9423A] text-white"
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