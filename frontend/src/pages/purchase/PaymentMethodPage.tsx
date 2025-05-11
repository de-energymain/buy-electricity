import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardBody,
  Spinner
} from "@nextui-org/react";
import { ArrowLeft, Clock, LogIn, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { 
  FormContainer, 
  cardClasses
} from "../../shared/styles";

// Import wallet connection libraries
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

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

export default function PaymentMethodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connection } = useConnection();
  const { publicKey, connected, disconnect, signTransaction, select, wallet, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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

  // Check authentication status when component mounts and when wallet connection changes
  useEffect(() => {
    const checkAuth = (): void => {
      // If wallet is connected, user is authenticated via wallet
      if (connected) {
        setIsAuthenticated(true);
        return;
      }
      
      // Check for Torus session
      const torusSession = localStorage.getItem("torusSession");
      if (torusSession) {
        setIsAuthenticated(true);
        return;
      }
      
      setIsAuthenticated(false);
    };
    
    checkAuth();
  }, [connected]);

  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("farm")) {
      setOrderDetails({
        farm: params.get("farm") || orderDetails.farm,
        location: params.get("location") || orderDetails.location,
        panels: parseInt(params.get("panels") || `${orderDetails.panels}`),
        capacity: parseFloat(params.get("capacity") || `${orderDetails.capacity}`),
        output: parseInt(params.get("output") || `${orderDetails.output}`),
        cost: parseFloat(params.get("cost") || `${orderDetails.cost}`)
      });
    }
  }, [location.search]);

  // Update token amount based on current cost
  useEffect(() => {
    if (selectedPayment === "SOL") {
      // Use a reasonable SOL to USD conversion rate (example: 1 SOL = $20)
      setTokenAmount(orderDetails.cost / 20);
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
  }, [lockMinutes, lockSeconds]);

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

  const handleProceedToPayment = async () => {
    setIsProcessingPayment(true);
    const processingId = toastKey;
    showToast("Processing Payment", `Sending ${tokenAmount.toFixed(2)} ${selectedPayment}...`, "primary", 100000);
    try {
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
        setToasts(prev => prev.filter(t => t.id !== processingId));
        showToast("Payment Successful", "Your transaction was completed successfully", "success", 3000);
        navigate("/payment-success", {
          state: { ...orderDetails, paymentMethod: selectedPayment, tokenAmount, wallet: wallet?.adapter.name ?? "Unknown", signature }
        });
      } else {
        handleSelectWallet();
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
  const handleAuthButtonClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

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
          
          {/* Conditional Login/Dashboard link aligned to the right */}
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
                    className={`cursor-pointer transition-all border ${selectedPayment===method ? 'border-[#E9423A] bg-[#3A1A18]' : 'border-gray-700 bg-[#252525]'}`}
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
              <div className="flex items-center justify-center text-sm text-[#E9423A]"><Clock size={14} className="mr-1" /><span>Price locked for {lockMinutes}:{lockSeconds<10?`0${lockSeconds}`:lockSeconds}</span></div>
            </div>
            <div className="bg-[#111111] p-4">
              {connected && publicKey && (
                <div className="px-4 py-2 text-center">
                  <p className="text-gray-400 text-xs">Connected to</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-white"><span>{wallet?.adapter.name||'Unknown Wallet'}</span><span>•</span><span className="font-mono">{truncateAddress(publicKey.toString())}</span></div>
                  <button onClick={handleChangeWallet} className="text-[#E9423A] text-xs mt-1 hover:underline">change wallet</button>
                </div>
              )}
              <Button className="w-full bg-[#E9423A] text-white font-medium h-14 rounded-none relative" onPress={connected?handleProceedToPayment:handleSelectWallet} disabled={isProcessingPayment}>
                {isProcessingPayment && (
                  <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1}} className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"><Spinner size="sm" /></motion.div>
                )}
                <span className={`${isProcessingPayment?'opacity-0':'opacity-100'}`}>{connected?'Complete Payment':'Select Wallet'}</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast=>(
            <div key={toast.id} className={`p-4 rounded shadow-lg flex items-start gap-3 transition-all duration-300 animate-slideIn max-w-xs ${toast.type==='success'?'bg-green-500/90 text-white':toast.type==='danger'?'bg-red-500/90 text-white':toast.type==='primary'?'bg-blue-500/90 text-white':'bg-black/80 text-white'}`} style={{animationDuration:'200ms'}}>
              <div className="flex-1">{toast.title&&<h4 className="font-medium text-sm mb-1">{toast.title}</h4>}{toast.description&&<p className="text-xs opacity-90">{toast.description}</p>}</div>
              <button onClick={()=>setToasts(prev=>prev.filter(t=>t.id!==toast.id))} className="text-xs text-white/80 hover:text-white">✕</button>
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