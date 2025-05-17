import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Spinner
} from "@nextui-org/react";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  FormContainer,
  cardClasses
} from "../../shared/styles";

// Import wallet connection libraries
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';

// Import crypto icons from assets
import nrgIcon from "../../assets/crypto/nrg-icon.svg";
import solIcon from "../../assets/crypto/sol-icon.svg";
import usdcIcon from "../../assets/crypto/usdc-icon.svg";

// Payment method types
type PaymentMethod = "NRG" | "SOL" | "USDC";

interface OrderDetails {
  farm: string;
  location: string;
  panels: number;
  capacity: number;
  output: number;
  cost: number;
}

interface Toast {
  id: number;
  title: string;
  description: string;
  type: string;
  duration: number;
}

interface Web3AuthWalletInfo {
  provider: string;
  publicKey: string | null;
  email: string | null;
}

interface ExchangeRates {
  sol: number;
  usdc: number;
}

export default function PaymentMethodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connection } = useConnection();
  const { publicKey, connected, disconnect, signTransaction, select, wallet, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [web3AuthWalletInfo, setWeb3AuthWalletInfo] = useState<Web3AuthWalletInfo | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastKey, setToastKey] = useState(0);

  // Order details
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    farm: "Jaipur Solar Farm",
    location: "Jaipur, Rajasthan, India",
    panels: 29,
    capacity: 13.05,
    output: 0,
    cost: 15225.00
  });

  // Payment selection
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("SOL");
  const [tokenAmount, setTokenAmount] = useState(0.05);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(13);
  const [lockSeconds, setLockSeconds] = useState(22);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  //Exchange rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ sol: 20, usdc: 1 });
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const panels = queryParams.get('panels');
  const cost = queryParams.get('cost');
  const capacity = queryParams.get('capacity');

  // Construct the redirect URL with only the necessary parameters
  const redirectSearchParams = new URLSearchParams();
  if (panels) {
    redirectSearchParams.append('panels', panels);
  }
  if (cost) {
    redirectSearchParams.append('cost', cost);
  }
  if (capacity) {
    redirectSearchParams.append('capacity', capacity);
  }

  // Helper function to extract Web3Auth wallet info
  const getWeb3AuthWalletInfo = (): Web3AuthWalletInfo | null => {
    try {
      const session = localStorage.getItem("web3AuthSession");
      if (session) {
        const data = JSON.parse(session);
        return {
          provider: "Google",
          publicKey: data.publicKey || null,
          email: data.userInfo?.email || null
        };
      }
      return null;
    } catch (e) {
      console.error("Error reading Web3Auth session", e);
      return null;
    }
  };

  // Show a debug dialog for Web3Auth session
  // const debugWeb3Auth = (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation();
  //   const session = localStorage.getItem("web3AuthSession");
  //   try {
  //     if (session) {
  //       const data = JSON.parse(session);
  //       console.log("Web3Auth Session Data:", data);

  //       // Show private key info (format, type, length)
  //       if (data.privateKey) {
  //         const privateKeyType = typeof data.privateKey;
  //         const privateKeyLength = 
  //           privateKeyType === 'string' 
  //             ? data.privateKey.length 
  //             : Array.isArray(data.privateKey) 
  //               ? data.privateKey.length 
  //               : Object.keys(data.privateKey).length;

  //         console.log("Private Key Type:", privateKeyType);
  //         console.log("Private Key Length:", privateKeyLength);

  //         // If it's an object, show a sample of the values
  //         if (privateKeyType === 'object' && !Array.isArray(data.privateKey)) {
  //           const keys = Object.keys(data.privateKey);
  //           const sampleKeys = keys.slice(0, 5);
  //           console.log("First 5 keys:", sampleKeys);
  //           const sampleValues = sampleKeys.map(k => data.privateKey[k]);
  //           console.log("First 5 values:", sampleValues);
  //         }
  //       } else {
  //         console.log("No privateKey in session data");
  //       }

  //       // Show a toast with basic info
  //       showToast(
  //         "Web3Auth Session Info", 
  //         `User: ${data.userInfo?.email || 'Unknown'}\nPublic Key: ${data.publicKey ? truncateAddress(data.publicKey) : 'None'}\nPrivate Key: ${data.privateKey ? 'Present' : 'Missing'}`, 
  //         "primary", 
  //         5000
  //       );
  //     } else {
  //       console.log("No Web3Auth session found");
  //       showToast("No Session", "No Web3Auth session found", "danger", 3000);
  //     }
  //   } catch (e) {
  //     console.error("Error parsing session:", e);
  //     showToast("Error", `Failed to parse session: ${e instanceof Error ? e.message : String(e)}`, "danger", 3000);
  //   }
  // };

  // Check authentication status when component mounts and when wallet connection changes
  useEffect(() => {
    const checkAuth = (): void => {
      // If wallet is connected, user is authenticated via wallet
      if (connected) {
        setIsAuthenticated(true);
        setWeb3AuthWalletInfo(null);
        return;
      }

      // Check for Web3Auth session
      const web3AuthInfo = getWeb3AuthWalletInfo();
      if (web3AuthInfo) {
        setIsAuthenticated(true);
        setWeb3AuthWalletInfo(web3AuthInfo);
        return;
      }

      setIsAuthenticated(false);
      setWeb3AuthWalletInfo(null);
    };

    checkAuth();
  }, [connected]);

  //Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setIsLoadingRates(true);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd'
        );
        const data = await response.json();
        setExchangeRates({
          sol: data.solana.usd,
          usdc: data['usd-coin'].usd
        });
        //console.log("Conversion rates", data);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        showToast('Error', 'Failed to fetch exchange rates. Using default rates.', 'danger', 3000);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);  

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!publicKey) return;

      try {
        let balance = 0;

        if( selectedPayment === 'SOL' ) {
          balance = await connection.getBalance(publicKey);
          balance /= LAMPORTS_PER_SOL;
        }
        //NRG and USDC need to be added!
        setWalletBalance(balance);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    };

    fetchWalletBalance();
  }, [publicKey, selectedPayment, connection]);

  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newOrderDetails = { ...orderDetails };

    if (params.has("panels")) {
      const panelsValue = params.get("panels");
      newOrderDetails.panels = panelsValue ? parseInt(panelsValue) : orderDetails.panels;
    }

    if (params.has("capacity")) {
      const capacityValue = params.get("capacity");
      newOrderDetails.capacity = capacityValue ? parseFloat(capacityValue) : orderDetails.capacity;
    }

    if (params.has("cost")) {
      const costValue = params.get("cost");
      newOrderDetails.cost = costValue ? parseFloat(costValue) : orderDetails.cost;
    }

    if (params.has("farm")) {
      newOrderDetails.farm = params.get("farm") || orderDetails.farm;
    }

    if (params.has("location")) {
      newOrderDetails.location = params.get("location") || orderDetails.location;
    }

    if (params.has("output")) {
      const outputValue = params.get("output");
      newOrderDetails.output = outputValue ? parseInt(outputValue) : orderDetails.output;
    }

    setOrderDetails(newOrderDetails);
    console.log("New order Details:", newOrderDetails)
  }, [location.search]);

  // Update token amount based on current cost
  useEffect(() => {
    if (selectedPayment === "SOL") {
      // Use a reasonable SOL to USD conversion rate (example: 1 SOL = $20)
      setTokenAmount(orderDetails.cost / exchangeRates.sol);
    } else if (selectedPayment === "USDC") {
      // USDC is pegged to USD (1:1)
      setTokenAmount(orderDetails.cost);
    } else {
      // NRG token conversion
      setTokenAmount(orderDetails.cost * 10);
    }
  }, [selectedPayment, orderDetails.cost]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (lockSeconds > 0) {
        setLockSeconds(s => s - 1);
      } else if (lockMinutes > 0) {
        setLockMinutes(m => m - 1);
        setLockSeconds(59);
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockMinutes, lockSeconds, exchangeRates, isLoadingRates]);

  // Toast helper
  const showToast = (title: string, description: string, type = "success", duration = 3000) => {
    const newToast = { id: toastKey, title, description, type, duration };
    setToasts(prev => [...prev, newToast]);
    setToastKey(prev => prev + 1);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== newToast.id)), duration);
  };

  useEffect(() => {
    if (connected && publicKey && wallet) {
      showToast("Wallet Connected", `Connected to ${wallet.adapter.name}`, "success");
    }
  }, [connected, publicKey, wallet]);

  const handleSelectPayment = (method: PaymentMethod) => setSelectedPayment(method);
  const handleSelectWallet = () => wallets.length > 0 && select?.(wallets[0].adapter.name);

  const handleChangeWallet = async () => {
    await disconnect?.();
    setVisible(true);
  };

  const truncateAddress = (address: string) =>
    address.length <= 8 ? address : `${address.slice(0, 4)}...${address.slice(-4)}`;

  // Handle action based on authentication state
  const handlePaymentAction = () => {
    // If using Solana wallet or Web3Auth
    if (connected || web3AuthWalletInfo) {
      handleProceedToPayment();
    }
    // No authentication
    else {
      handleSelectWallet();
    }
  };

  const handleProceedToPayment = async () => {
    setIsProcessingPayment(true);
    const processingId = toastKey;
    showToast("Processing Payment", `Sending ${tokenAmount.toFixed(2)} ${selectedPayment}...`, "primary", 100000);

    try {
      // Handle payment via Solana wallet adapter
      if (connected && publicKey && signTransaction) {
        const lamports = Math.floor(tokenAmount * LAMPORTS_PER_SOL);
        const recipient = new PublicKey("7C4jsPZpht1JaRJB7u8QdXhfY2pFdh6fT2xatJhvLpzz");
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipient, lamports })
        );
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        const signedTx = await signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        // Complete transaction
        setToasts(prev => prev.filter(t => t.id !== processingId));
        showToast("Payment Successful", "Your transaction was completed successfully", "success", 3000);
        navigate("/payment-success", {
          state: {
            ...orderDetails,
            paymentMethod: selectedPayment,
            tokenAmount,
            wallet: wallet?.adapter.name ?? "Unknown",
            signature
          }
        });
      }
      // Handle payment via Web3Auth/Google login
      else if (web3AuthWalletInfo && web3AuthWalletInfo.publicKey) {
        try {
          // Get the session data which should contain the private key
          const sessionStr = localStorage.getItem("web3AuthSession");
          if (!sessionStr) {
            throw new Error("Web3Auth session not found");
          }

          const sessionData = JSON.parse(sessionStr);

          // Check if privateKey is available
          if (!sessionData.privateKey) {
            throw new Error("Private key not available in session");
          }

          // Debug the private key format
          console.log("Private key type:", typeof sessionData.privateKey);
          console.log("Private key length:",
            typeof sessionData.privateKey === 'string'
              ? sessionData.privateKey.length
              : Array.isArray(sessionData.privateKey)
                ? sessionData.privateKey.length
                : Object.keys(sessionData.privateKey).length);

          // Handle different private key formats
          let privateKeyBytes;

          if (typeof sessionData.privateKey === 'string') {
            // If it's a base58 encoded string
            if (sessionData.privateKey.length === 88) {
              // Decode base58 string to bytes - you might need bs58 library for this
              // privateKeyBytes = bs58.decode(sessionData.privateKey);
              throw new Error("Base58 decoding requires bs58 library");
            }
            // If it's a hex string
            else if (sessionData.privateKey.length === 128 || sessionData.privateKey.length === 64) {
              privateKeyBytes = new Uint8Array(sessionData.privateKey.length / 2);
              for (let i = 0; i < sessionData.privateKey.length; i += 2) {
                privateKeyBytes[i / 2] = parseInt(sessionData.privateKey.substr(i, 2), 16);
              }
            }
            // Attempt to parse as JSON if it's a stringified array
            else {
              try {
                const parsed = JSON.parse(sessionData.privateKey);
                privateKeyBytes = new Uint8Array(parsed);
              } catch (e) {
                throw new Error(`Unable to parse privateKey format: ${e.message}`);
              }
            }
          }
          // If it's already an array
          else if (Array.isArray(sessionData.privateKey)) {
            privateKeyBytes = new Uint8Array(sessionData.privateKey);
          }
          // If it's an object with numeric keys (like what JSON.stringify does to Uint8Array)
          else if (typeof sessionData.privateKey === 'object') {
            privateKeyBytes = new Uint8Array(Object.values(sessionData.privateKey));
          }
          else {
            throw new Error("Unsupported privateKey format");
          }

          // Ensure the private key is the correct size for Solana (64 bytes)
          if (privateKeyBytes.length !== 64) {
            console.error("Invalid private key length:", privateKeyBytes.length);
            throw new Error(`Bad secret key size: expected 64 bytes, got ${privateKeyBytes.length}`);
          }

          // Create keypair from the processed private key
          try {
            const keyPair = Keypair.fromSecretKey(privateKeyBytes);
            console.log("Successfully created keypair from private key");
            console.log("Public key from keypair:", keyPair.publicKey.toString());

            // Verify the keypair's public key matches what we expect
            if (keyPair.publicKey.toString() !== web3AuthWalletInfo.publicKey) {
              console.warn(
                "Warning: public key from keypair doesn't match stored public key.",
                "Expected:", web3AuthWalletInfo.publicKey,
                "Got:", keyPair.publicKey.toString()
              );
            }

            // Create and sign the transaction using the private key
            const recipientPublicKey = new PublicKey("7C4jsPZpht1JaRJB7u8QdXhfY2pFdh6fT2xatJhvLpzz");
            const senderPublicKey = keyPair.publicKey;
            const lamports = Math.floor(tokenAmount * LAMPORTS_PER_SOL);

            // Create a transaction
            const tx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: senderPublicKey,
                toPubkey: recipientPublicKey,
                lamports
              })
            );

            // Get recent blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = senderPublicKey;

            // Sign transaction using the keypair
            tx.sign(keyPair);

            // Send the signed transaction
            const signature = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(signature, 'confirmed');

            // Complete transaction
            setToasts(prev => prev.filter(t => t.id !== processingId));
            showToast("Payment Successful", "Your transaction was completed successfully", "success", 3000);
            navigate("/payment-success", {
              state: {
                ...orderDetails,
                paymentMethod: selectedPayment,
                tokenAmount,
                wallet: "Google Web3Auth",
                signature
              }
            });
          } catch (error) {
            console.error("Error creating keypair or signing transaction:", error);
            throw error;
          }
        } catch (error: any) {
          console.error("Web3Auth transaction error:", error);
          throw new Error(`Web3Auth transaction failed: ${error.message}`);
        }
      } else {
        throw new Error("No wallet connected");
      }
    } catch (error: any) {
      console.error(error);
      setToasts(prev => prev.filter(t => t.id !== processingId));
      showToast("Payment Failed", error.message || "Transaction failed", "danger", 5000);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => navigate(-1);

  // Handler for login/dashboard button click
  // const handleAuthButtonClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
  //   e.preventDefault();
  //   navigate(isAuthenticated ? "/dashboard" : "/login");
  // };

  const handleLoginButtonClick = () => {
    console.log("Is authenticed?", isAuthenticated);
    if (!isAuthenticated) {
      //navigate(`/login?redirect=/payment?${redirectSearchParams.toString()}`);
      const redirectUrl = `/payment?panels=${panels}&cost=${cost}&capacity=${capacity}`;
      const encodedRedirect = encodeURIComponent(redirectUrl);
      navigate(`/login?redirect=${encodedRedirect}`);
    }

  }

  return (
    <FormContainer>
      <div className="w-full max-w-[420px] mx-auto relative z-10 h-full flex flex-col">
        {/* Navigation Bar with Back button and Login/Dashboard link side by side */}
        <div className="flex justify-between items-center mb-4">
          <Button
            className="bg-transparent text-white px-0 min-w-0 h-8 justify-start"
            onPress={handleBack}
            startContent={<ArrowLeft size={20} />}
            disabled={isProcessingPayment}
          >
            Back
          </Button>

          {/* Conditional Login/Dashboard link aligned to the right 
          <a 
            href={isAuthenticated ? "/dashboard" : "/login"}
            onClick={handleAuthButtonClick}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </a>
          */}
        </div>

        <Card className={`${cardClasses} w-full overflow-hidden`}>
          <div className="p-4 bg-[#000000]">
            <h2 className="text-2xl font-bold text-white mb-1 font-electrolize">Payment</h2>
            <p className="text-sm text-gray-300 font-inter">Choose your payment method</p>
          </div>
          <CardBody className="p-0 space-y-0 divide-y divide-gray-800 no-scrollbar">
            <div className="p-4 bg-[#111111]">
              <div className="flex justify-between mb-3"><span className="text-gray-400 text-sm">Panels:</span><span className="text-white">{orderDetails.panels}</span></div>
              <div className="flex justify-between mb-3"><span className="text-gray-400 text-sm">Capacity:</span><span className="text-white">{orderDetails.capacity.toFixed(2)} kW</span></div>
              <div className="mt-4 pt-4 border-t border-gray-800"><div className="flex justify-between items-center"><span className="text-white font-medium">Total:</span><span className="text-white font-bold">${orderDetails.cost.toFixed(2)}</span></div></div>
            </div>
            <div className="p-4 bg-[#111111]">
              <h3 className="text-xl font-bold text-white mb-4">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { method: 'NRG', icon: nrgIcon },
                  { method: 'SOL', icon: solIcon },
                  { method: 'USDC', icon: usdcIcon }
                ].map(({ method, icon }) => (
                  <div
                    key={method}
                    className={`cursor-pointer transition-all border ${selectedPayment === method ? 'border-[#E9423A] bg-[#3A1A18]' : 'border-gray-700 bg-[#252525]'}`}
                    onClick={() => handleSelectPayment(method as PaymentMethod)}
                  >
                    <div className="p-3 flex flex-col items-center justify-center h-full">
                      <img src={icon} alt={method} className="w-8 h-8 mb-2" />
                      <div className="text-sm font-bold text-white">{method}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-3 text-center">
                <p className="text-sm text-gray-300 mb-1">Amount Due in {selectedPayment}</p>
                <p className="text-3xl font-bold text-white mb-1">{tokenAmount.toFixed(2)} {selectedPayment}</p>
                <p className="text-sm text-gray-400 mb-2">≈ ${orderDetails.cost.toFixed(2)} USD</p>
                <div className="inline-block px-2 py-1 bg-yellow-500 bg-opacity-20 rounded text-xs text-yellow-400">Devnet</div>
              </div>
              <div className="flex items-center justify-center text-sm text-[#E9423A]"><Clock size={14} className="mr-1" /><span>Price locked for {lockMinutes}:{lockSeconds < 10 ? `0${lockSeconds}` : lockSeconds}</span></div>
            </div>
            <div className="bg-[#111111] p-4">
              {/* Updated wallet information section */}
              {(connected && publicKey) ? (
                <div className="px-4 py-2 text-center">
                  <p className="text-gray-400 text-xs">Connected to</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-white">
                    <span>{wallet?.adapter.name || 'Unknown Wallet'}</span>
                    <span>•</span>
                    <span className="font-mono">{truncateAddress(publicKey.toString())}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-400 text-xs">Wallet Balance</p>
                    <span className="text-white">{walletBalance.toFixed(2)} {selectedPayment}</span>
                  </div>
                  <button onClick={handleChangeWallet} className="text-[#E9423A] text-xs mt-1 hover:underline">
                    change wallet
                  </button>
                </div>
              ) : (
                web3AuthWalletInfo && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-gray-400 text-xs">Connected via</p>
                    <div className="flex items-center justify-center gap-1 text-sm text-white">
                      <span>{web3AuthWalletInfo.provider}</span>
                      {web3AuthWalletInfo.publicKey && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{truncateAddress(web3AuthWalletInfo.publicKey)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate("/login")}
                        className="text-[#E9423A] text-xs mt-1 hover:underline"
                      >
                        change login
                      </button>
                      {/* <button 
                        className="text-[#E9423A] text-xs mt-1 ml-2 hover:underline"
                        onClick={debugWeb3Auth}
                      >
                        debug
                      </button> */}
                    </div>
                  </div>
                )
              )}

              <Button
                className="w-full bg-[#E9423A] text-white font-medium h-14 rounded-none relative"
                onPress={isAuthenticated ? handlePaymentAction : handleLoginButtonClick}
                disabled={isProcessingPayment || isLoadingRates}
              >
                {isProcessingPayment && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <Spinner size="sm" />
                  </motion.div>
                )}
                <span className={`${isProcessingPayment ? 'opacity-0' : 'opacity-100'}`}>
                  {isAuthenticated ? (
                    connected ? 'Complete Payment with Wallet' :
                      web3AuthWalletInfo ? 'Complete Payment with Web3Auth' :
                        'Select Wallet'
                  ) : 'Login to Continue'}
                </span>
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`p-4 rounded shadow-lg flex items-start gap-3 transition-all duration-300 animate-slideIn max-w-xs ${toast.type === 'success' ? 'bg-green-500/90 text-white' :
                  toast.type === 'danger' ? 'bg-red-500/90 text-white' :
                    toast.type === 'primary' ? 'bg-blue-500/90 text-white' :
                      'bg-black/80 text-white'
                }`}
              style={{ animationDuration: '200ms' }}
            >
              <div className="flex-1">
                {toast.title && <h4 className="font-medium text-sm mb-1">{toast.title}</h4>}
                {toast.description && <p className="text-xs opacity-90">{toast.description}</p>}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-xs text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {transform: translateX(100%); opacity: 0;}
          to {transform: translateX(0); opacity: 1;}
        }
        .animate-slideIn {animation: slideIn 0.2s ease-out forwards;}
        
        /* hides scrollbar */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
          overflow-y: auto;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </FormContainer>
  );
}
