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
  const [username, setUsername] = useState<string | null>("John Doe");
  const [web3AuthPublicKey, setWeb3AuthPublicKey] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

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
          {/* Connected Wallet Display */}
          {(publicKey || web3AuthPublicKey) && (
            <div className="flex items-center bg-[#1A1A1A] rounded-lg p-2 pr-3">
              <div className="w-6 h-6 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A] mr-2">
                <WalletIcon size={14} />
              </div>
              <div className="flex flex-col">
                <div className="text-xs text-gray-400">{wallet?.adapter.name || "Wallet"}</div>
                <div className="flex items-center">
                  <span className="text-xs font-mono">{publicKey ? truncateAddress(publicKey.toString()) : truncateAddress(web3AuthPublicKey || " ") }</span>
                  <Tooltip content="View on Explorer">
                    <Button
                      isIconOnly
                      size="sm"
                      className="ml-1 bg-transparent min-w-0 w-5 h-5 p-0"
                      onPress={() => window.open(`https://explorer.solana.com/address/${publicKey || web3AuthPublicKey}?cluster=devnet`, '_blank')}
                    >
                      <ExternalLink size={12} className="text-gray-400" />
                    </Button>
                  </Tooltip>
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
              className={`px-4 py-2 ${activePage === 'analytics' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
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
              className={`px-4 py-2 ${activePage === 'wallet' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/wallet")}
            >
              Wallet
            </Button>
            <Button 
              className={`px-4 py-2 ${activePage === 'marketplace' ? 'text-white border-b-2 border-[#E9423A]' : 'text-gray-400 hover:text-white'} bg-transparent rounded-none`}
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
      
      {/* Page Header with Title 
      <div className="bg-[#0A0A0A] px-36 mx-10 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        </div>
      </div>
      */}
      
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