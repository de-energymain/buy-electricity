import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Tooltip,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@nextui-org/react";
import { 
  Wallet as WalletIcon, 
  LogOut,
  ExternalLink,
  Plus
} from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import logo from "../assets/logo.svg";

interface DashboardTemplateProps {
  children: ReactNode;
  title: string;
  activePage: 'dashboard' | 'analytics' | 'panels' | 'transactions' | 'wallet' | 'marketplace' | 'settings' | 'help';
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ 
  children, 
  activePage 
}) => {
  const navigate = useNavigate();
  const { publicKey, wallet, disconnect } = useWallet();
  const [username, setUsername] = useState<string | null>("User");
  const [web3AuthPublicKey, setWeb3AuthPublicKey] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  
  // Balance state
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [dogaBalance, setDogaBalance] = useState<number | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  
  // Constants
  const connection = new Connection("https://api.devnet.solana.com");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    const storedPublicKey = localStorage.getItem("publicKey");
    if (storedPublicKey) {
      setWeb3AuthPublicKey(storedPublicKey);
    }
  }, []);

  // Fetch wallet balances
  const fetchBalances = async (walletAddress: string) => {
    setIsLoadingBalances(true);
    try {
      const pubKey = new PublicKey(walletAddress);
      
      // Fetch SOL balance
      const solBalanceResult = await connection.getBalance(pubKey);
      setSolBalance(solBalanceResult / 1e9); // Convert lamports to SOL
      
      // Fetch DOGA token balance
      try {
        // Get all token accounts for this wallet
        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        });
        
        console.log(`Found ${allTokenAccounts.value.length} total token accounts`);
        
        let totalDogaBalance = 0;
        let dogaAccountsFound = 0;
        
        // Check each token account for DOGA
        for (const account of allTokenAccounts.value) {
          const mintAddress = account.account.data.parsed.info.mint;
          const tokenAmount = account.account.data.parsed.info.tokenAmount;
          const balance = parseFloat(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
          
          console.log(`Checking token: ${mintAddress}, balance: ${balance}`);
          console.log(`Mint comparison: "${mintAddress}" === "GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW" = ${mintAddress === 'GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW'}`);
          
          // Look for DOGA tokens (exact mint match OR contains the mint)
          if (mintAddress === 'GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW' || 
              mintAddress.includes('GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW')) {
            totalDogaBalance += balance;
            dogaAccountsFound++;
            console.log(`✅ Found DOGA account ${dogaAccountsFound}: ${balance} DOGA`);
          } else {
            console.log(`❌ Not a DOGA token: ${mintAddress}`);
          }
        }
        
        console.log(`Total DOGA balance: ${totalDogaBalance} from ${dogaAccountsFound} accounts`);
        setDogaBalance(totalDogaBalance);
        
      } catch (tokenError) {
        console.error('Error fetching token balance:', tokenError);
        setDogaBalance(0);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setSolBalance(null);
      setDogaBalance(null);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // Fetch balances when wallet changes
  useEffect(() => {
    const walletAddress = publicKey?.toString() || web3AuthPublicKey;
    if (walletAddress) {
      fetchBalances(walletAddress);
      
      // Refresh balances every 30 seconds
      const interval = setInterval(() => {
        fetchBalances(walletAddress);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [publicKey, web3AuthPublicKey]);

   const handleLogout = async () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    if (disconnect) {
      await disconnect();
    }

    localStorage.removeItem("web3AuthSession");
    localStorage.setItem("walletConnected", "false");

    navigate("/");
    setIsLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleBuyPanels = () => {
    navigate("/");
  };

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return address.length <= 8 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format large numbers with abbreviations
  const formatBalance = (balance: number): string => {
    if (balance >= 1000000000) {
      return (balance / 1000000000).toFixed(1) + 'B';
    } else if (balance >= 1000000) {
      return (balance / 1000000).toFixed(1) + 'M';
    } else if (balance >= 10000) {
      return (balance / 1000).toFixed(0) + 'K';
    } else if (balance >= 1000) {
      return (balance / 1000).toFixed(1) + 'K';
    } else {
      return balance.toFixed(2);
    }
  };

  const getDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[#0A0A0A] text-white">
      {/* Top header with logo and user info */}
      <header className="w-full bg-[#0F0F0F] px-32 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <img src={logo} alt="NRG logo" className="h-16 w-16" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-medium">Hello {username}</h2>
            <p className="text-xs text-gray-400">Last Updated: {getDate()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">         
          {/* Connected Wallet Display with Balances */}
          {(publicKey || web3AuthPublicKey) && (
            <div className="flex items-center bg-[#1A1A1A] rounded-lg p-3">
              <div className="w-8 h-8 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A] mr-3">
                <WalletIcon size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{wallet?.adapter.name || "Wallet"}</span>
                  <span className="text-xs font-mono text-white">{publicKey ? truncateAddress(publicKey.toString()) : truncateAddress(web3AuthPublicKey || " ") }</span>
                  <Tooltip content="View on Explorer">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-transparent min-w-0 w-4 h-4 p-0"
                      onPress={() => window.open(`https://explorer.solana.com/address/${publicKey || web3AuthPublicKey}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink size={10} className="text-gray-400 hover:text-white" />
                    </Button>
                  </Tooltip>
                </div>
                {/* Balance Display */}
                <div className="flex items-center gap-3 text-xs">
                  {isLoadingBalances ? (
                    <span className="text-gray-500">Loading balances...</span>
                  ) : (
                    <>
                      <span className="text-blue-400 font-medium">
                        {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : '-- SOL'}
                      </span>
                      <span className="text-green-400 font-medium">
                        {dogaBalance !== null ? `${formatBalance(dogaBalance)} DOGA` : '0.00 DOGA'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}  
          {/* Buy Panels Button */}
          <Button 
            className="bg-[#E9423A] text-white"
            startContent={<Plus size={16} />}
            onPress={handleBuyPanels}
          >
            Buy Panels
          </Button>       
        </div>
      </header>
      
      {/* Navigation Bar */}
      <nav className="w-full bg-[#0F0F0F] border-b border-gray-800 px-32">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <Button 
              className={`px-4 py-2 ${activePage === 'dashboard' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              className={`hidden px-4 py-2 ${activePage === 'analytics' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/analytics")}
            >
              Analytics
            </Button>
            <Button 
              className={`px-4 py-2 ${activePage === 'panels' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/panels")}
            >
              Panels
            </Button>
            <Button 
              className={`px-4 py-2 ${activePage === 'transactions' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/transactions")}
            >
              Transactions
            </Button>
            <Button 
              className={`hidden px-4 py-2 ${activePage === 'wallet' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/wallet")}
            >
              Wallet
            </Button>
            <Button 
              className={`hidden px-4 py-2 ${activePage === 'marketplace' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/marketplace")}
            >
              Marketplace
            </Button>
            <Button 
              className={`px-4 py-2 ${activePage === 'settings' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/settings")}
            >
              Settings
            </Button>
            <Button 
              className={`px-4 py-2 ${activePage === 'help' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/help")}
            >
              Help
            </Button>
          </div>
          <div>
            <Button 
              className="bg-transparent text-gray-400 hover:text-white flex items-center"
              onPress={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          {/* Page content */}
          {children}
        </div>
      </div>   
      {/* Logout Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={cancelLogout}
        className="bg-[#1A1A1A] text-white"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Confirm Logout
          </ModalHeader>
          <ModalBody>
            <p>Are you sure do you want to logout?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="bg-transparent text-gray-400 hover:bg-[#2A1A1A]"
              onPress={cancelLogout}
            >
              No
            </Button>
            <Button
              className="bg-[#E9423A] text-white"
              onPress={confirmLogout}
            >
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>  
    </div>
  );
};

export default DashboardTemplate;