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
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getUserData } from "../services/userApi";
import logo from "../assets/logo.svg";

interface DashboardTemplateProps {
  children: ReactNode;
  title: string;
  activePage:
    | "dashboard"
    | "analytics"
    | "panels"
    | "transactions"
    | "wallet"
    | "marketplace"
    | "settings"
    | "help";
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  activePage,
}) => {
  const navigate = useNavigate();
  const { publicKey, wallet, disconnect } = useWallet();
  const [username, setUsername] = useState<string | null>("User");
  const [web3AuthPublicKey, setWeb3AuthPublicKey] = useState<string | null>(
    null
  );
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

    // Fetch user data from API when component mounts
    fetchUserData();
  }, []);

  // Fetch user data from API
  const fetchUserData = async () => {
    let walletID = null;

    // Try to get wallet ID from connected wallet first
    if (publicKey) {
      walletID = publicKey.toString();
    }
    // Fallback to Web3Auth session
    else {
      const session = localStorage.getItem("web3AuthSession");
      if (session) {
        try {
          const data = JSON.parse(session);
          if (data.publicKey) {
            walletID = data.publicKey;
          }
        } catch (error) {
          console.error("Error parsing web3AuthSession:", error);
        }
      }
    }

    if (!walletID) return;

    try {
      const result = await getUserData(walletID);
      console.log("Fetched user data for header:", result);

      if (result.success && result.user && result.user.userName) {
        setUsername(result.user.userName);
        // Also update localStorage for future use
        localStorage.setItem("username", result.user.userName);
      }
    } catch (error) {
      console.log("User not found in API, keeping default username");
    }
  };

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
        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
          pubKey,
          {
            programId: new PublicKey(
              "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ),
          }
        );

        console.log(
          `Found ${allTokenAccounts.value.length} total token accounts`
        );

        let totalDogaBalance = 0;
        let dogaAccountsFound = 0;

        // Check each token account for DOGA
        for (const account of allTokenAccounts.value) {
          const mintAddress = account.account.data.parsed.info.mint;
          const tokenAmount = account.account.data.parsed.info.tokenAmount;
          const balance =
            parseFloat(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);

          console.log(`Checking token: ${mintAddress}, balance: ${balance}`);
          console.log(
            `Mint comparison: "${mintAddress}" === "GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW" = ${
              mintAddress === "GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW"
            }`
          );

          // Look for DOGA tokens (exact mint match OR contains the mint)
          if (
            mintAddress === "GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW" ||
            mintAddress.includes("GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW")
          ) {
            totalDogaBalance += balance;
            dogaAccountsFound++;
            console.log(
              `✅ Found DOGA account ${dogaAccountsFound}: ${balance} DOGA`
            );
          } else {
            console.log(`❌ Not a DOGA token: ${mintAddress}`);
          }
        }

        console.log(
          `Total DOGA balance: ${totalDogaBalance} from ${dogaAccountsFound} accounts`
        );
        setDogaBalance(totalDogaBalance);
      } catch (tokenError) {
        console.error("Error fetching token balance:", tokenError);
        setDogaBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
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
    return address.length <= 8
      ? address
      : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format large numbers with abbreviations
  const formatBalance = (balance: number): string => {
    if (balance >= 1000000000) {
      return (balance / 1000000000).toFixed(1) + "B";
    } else if (balance >= 1000000) {
      return (balance / 1000000).toFixed(1) + "M";
    } else if (balance >= 10000) {
      return (balance / 1000).toFixed(0) + "K";
    } else if (balance >= 1000) {
      return (balance / 1000).toFixed(1) + "K";
    } else {
      return balance.toFixed(2);
    }
  };

  const getDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return now.toLocaleDateString("en-US", options);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[#0A0A0A] text-white">
      {/* Top header with logo and user info */}
      <header className="w-full bg-[#0F0F0F] px-4 md:px-8 lg:px-32 py-4 md:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div>
            <img
              src={logo}
              alt="NRG logo"
              className="h-12 w-12 md:h-16 md:w-16"
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm md:text-lg font-medium">Hello {username}</h2>
            <p className="text-xs text-gray-400 hidden sm:block">
              Last Updated: {getDate()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Connected Wallet Display with Balances */}
          {(publicKey || web3AuthPublicKey) && (
            <div className="flex items-center bg-[#1A1A1A] rounded-lg p-2 md:p-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-[#2A1A1A] rounded-full flex items-center justify-center text-[#E9423A] mr-2 md:mr-3">
                <WalletIcon size={12} className="md:w-4 md:h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 md:gap-2 mb-1">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {wallet?.adapter.name || "Wallet"}
                  </span>
                  <span className="text-xs font-mono text-white">
                    {publicKey
                      ? truncateAddress(publicKey.toString())
                      : truncateAddress(web3AuthPublicKey || " ")}
                  </span>
                  <Tooltip content="View on Explorer">
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-transparent min-w-0 w-4 h-4 p-0"
                      onPress={() =>
                        window.open(
                          `https://explorer.solana.com/address/${
                            publicKey || web3AuthPublicKey
                          }?cluster=devnet`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink
                        size={8}
                        className="md:w-3 md:h-3 text-gray-400 hover:text-white"
                      />
                    </Button>
                  </Tooltip>
                </div>
                {/* Balance Display */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                  {isLoadingBalances ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    <>
                      <span className="text-blue-400 font-medium">
                        {solBalance !== null
                          ? `${solBalance.toFixed(3)} SOL`
                          : "-- SOL"}
                      </span>
                      <span className="text-green-400 font-medium">
                        {dogaBalance !== null
                          ? `${formatBalance(dogaBalance)} $NRG`
                          : "0.00 $NRG"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Buy Panels Button */}
          <Button
            className="bg-[#E9423A] text-white text-xs md:text-sm px-2 md:px-4"
            startContent={<Plus size={14} className="md:w-4 md:h-4" />}
            onPress={handleBuyPanels}
          >
            <span className="hidden sm:inline">Buy Panels</span>
            <span className="sm:hidden">Buy</span>
          </Button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="w-full bg-[#0F0F0F] border-b border-gray-800 px-4 md:px-8 lg:px-32">
        <div className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            <Button
              className={`px-4 py-2 ${
                activePage === "dashboard"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              className={`hidden px-4 py-2 ${
                activePage === "analytics"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/analytics")}
            >
              Analytics
            </Button>
            <Button
              className={`px-4 py-2 ${
                activePage === "panels"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/panels")}
            >
              Panels
            </Button>
            <Button
              className={`px-4 py-2 ${
                activePage === "transactions"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/transactions")}
            >
              Transactions
            </Button>
            <Button
              className={`hidden px-4 py-2 ${
                activePage === "wallet"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/wallet")}
            >
              Wallet
            </Button>
            <Button
              className={`hidden px-4 py-2 ${
                activePage === "marketplace"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/marketplace")}
            >
              Marketplace
            </Button>
            <Button
              className={`px-4 py-2 ${
                activePage === "settings"
                  ? "text-white border-b-2 border-[#E9423A]"
                  : "text-gray-400 hover:text-white"
              } bg-transparent rounded-none`}
              onPress={() => navigate("/dashboard/settings")}
            >
              Settings
            </Button>
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              isIconOnly
              className="bg-transparent text-gray-400 hover:text-white"
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>

          {/* Desktop Logout Button */}
          <div className="hidden md:block">
            <Button
              className="bg-transparent text-gray-400 hover:text-white flex items-center text-sm"
              onPress={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1A1A1A] border-t border-gray-700">
            <div className="flex flex-col py-2">
              <Button
                className={`justify-start px-4 py-3 ${
                  activePage === "dashboard"
                    ? "text-white bg-[#E9423A]/20 border-l-4 border-[#E9423A]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                } bg-transparent rounded-none`}
                onPress={() => {
                  navigate("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
              >
                Dashboard
              </Button>
              <Button
                className={`justify-start px-4 py-3 ${
                  activePage === "panels"
                    ? "text-white bg-[#E9423A]/20 border-l-4 border-[#E9423A]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                } bg-transparent rounded-none`}
                onPress={() => {
                  navigate("/dashboard/panels");
                  setIsMobileMenuOpen(false);
                }}
              >
                Panels
              </Button>
              <Button
                className={`justify-start px-4 py-3 ${
                  activePage === "transactions"
                    ? "text-white bg-[#E9423A]/20 border-l-4 border-[#E9423A]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                } bg-transparent rounded-none`}
                onPress={() => {
                  navigate("/dashboard/transactions");
                  setIsMobileMenuOpen(false);
                }}
              >
                Transactions
              </Button>
              <Button
                className={`justify-start px-4 py-3 ${
                  activePage === "settings"
                    ? "text-white bg-[#E9423A]/20 border-l-4 border-[#E9423A]"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                } bg-transparent rounded-none`}
                onPress={() => {
                  navigate("/dashboard/settings");
                  setIsMobileMenuOpen(false);
                }}
              >
                Settings
              </Button>
              {/* Mobile Logout Button */}
              <Button
                className="justify-start px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 bg-transparent rounded-none border-t border-gray-700 mt-2"
                onPress={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-[#0A0A0A]">
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
            <Button className="bg-[#E9423A] text-white" onPress={confirmLogout}>
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardTemplate;
