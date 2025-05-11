import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Tooltip
} from "@nextui-org/react";
import { 
  BarChart3, 
  Home, 
  PieChart, 
  Settings, 
  HelpCircle, 
  History, 
  Wallet as WalletIcon, 
  ShoppingBag, 
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
  title, 
  activePage 
}) => {
  const navigate = useNavigate();
  const { publicKey, wallet, disconnect } = useWallet();

  const handleLogout = async () => {
    if (disconnect) {
      await disconnect();
    }
    localStorage.removeItem("torusSession");
    navigate("/");
  };

  const handleBuyPanels = () => {
    navigate("/");
  };

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return address.length <= 8 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex w-full h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-[#0F0F0F] flex-col h-full border-r border-gray-800">
        {/* Logo */}
        <div className="p-4 flex justify-center border-b border-gray-800">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logo} alt="Renrg logo" />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">OVERVIEW</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'dashboard' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<Home size={18} />}
                  onPress={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
              </li>
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'analytics' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<BarChart3 size={18} />}
                  onPress={() => navigate("/dashboard/analytics")}
                >
                  Analytics
                </Button>
              </li>
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'panels' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<PieChart size={18} />}
                  onPress={() => navigate("/dashboard/panels")}
                >
                  Panels
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">MANAGEMENT</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'transactions' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<History size={18} />}
                  onPress={() => navigate("/dashboard/transactions")}
                >
                  Transactions
                </Button>
              </li>
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'wallet' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<WalletIcon size={18} />}
                >
                  Wallet
                </Button>
              </li>
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'marketplace' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<ShoppingBag size={18} />}
                  onPress={() => navigate("/dashboard/marketplace")}
                >
                  Marketplace
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-2">ACCOUNT</div>
            <ul className="space-y-1">
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'settings' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<Settings size={18} />}
                  onPress={() => navigate("/dashboard/settings")}
                >
                  Settings
                </Button>
              </li>
              <li>
                <Button 
                  className={`w-full justify-start ${activePage === 'help' ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}
                  startContent={<HelpCircle size={18} />}
                  onPress={() => navigate("/dashboard/help")}
                >
                  Help
                </Button>
              </li>
            </ul>
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#E9423A] flex items-center justify-center mr-2">
                JD
              </div>
              <div>
                <div className="text-sm font-medium">John Doe</div>
                <div className="text-xs text-gray-500">Personal Account</div>
              </div>
              <Button 
                isIconOnly
                className="ml-auto bg-transparent text-gray-400 hover:text-white"
                onPress={handleLogout}
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            
            {/* Wallet & Buy Panels Section */}
            <div className="flex items-center space-x-4">
              {/* Connected Wallet Display */}
              {publicKey && (
                <div className="flex items-center bg-[#1A1A1A] rounded-lg p-2 pr-3">
                  <div className="w-8 h-8 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A] mr-2">
                    <WalletIcon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-400">{wallet?.adapter.name || "Wallet"}</div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono">{truncateAddress(publicKey.toString())}</span>
                      <Tooltip content="View on Explorer">
                        <Button
                          isIconOnly
                          size="sm"
                          className="ml-1 bg-transparent min-w-0 w-5 h-5 p-0"
                          onPress={() => window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, '_blank')}
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
                startContent={<Plus size={18} />}
                onPress={handleBuyPanels}
              >
                Buy Panels
              </Button>
            </div>
          </div>
          
          {/* Page content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardTemplate;