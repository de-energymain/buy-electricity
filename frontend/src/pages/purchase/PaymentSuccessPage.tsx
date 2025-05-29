import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardBody
} from "@nextui-org/react";
import { 
  Check,
  Copy
} from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";
import { 
  FormContainer, 
  cardClasses
} from "../../shared/styles";
import { createPurchase } from "../../services/purchaseApi";

// Success page order details type
interface SuccessDetails {
  farm: string;
  location: string;
  panels: number;
  capacity: number;
  output: number;
  cost: number;
  paymentMethod: string;
  tokenAmount: number;
  walletAddress: string;
  wallet: string;
}

interface PurchaseData {
  farmName: string;
  location: string,
  walletAddress: string,
  paymentMethod: string,
  tokenAmount: number,
  panelsPurchased: number,
  cost: number,
  capacity: number,
  output: number,
  transactionHash: string,
  purchaseDate: string,
}

function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<SuccessDetails | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate a realistic looking transaction hash
  const [transactionHash, setTransactionHash] = useState("");
  const [entireHash, setEntireHash] = useState<string>("");
  const [nodeToken, setNodeToken] = useState("");
  
  useEffect(() => {
    // Make sure we have order details from the previous page
    if (location.state) {
      setOrderDetails(location.state as SuccessDetails);
      
      // Generate transaction hash
      const characters = "0123456789abcdef";
      let hash = "0x";
      for (let i = 0; i < 64; i++) {
        hash += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setEntireHash(hash);
      // Format hash to look like the one in the design (truncated with ellipsis)
      const displayHash = `${hash.substring(0, 12)}...${hash.substring(58)}`;
      setTransactionHash(displayHash);
      
      // Generate node token ID
      const farmPrefix = (location.state as SuccessDetails).farm
        .split(" ")
        .map(word => word.substring(0, 3).toUpperCase())
        .join("-");
      setNodeToken(`${farmPrefix}-${(location.state as SuccessDetails).panels}`);
    } else {
      // If no state was passed, redirect to home
      navigate("/");
    }
  }, [location, navigate]);

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  const handlePurchaseMore = () => {
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(entireHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
  }

  useEffect(() => {
    const savePurchase = async () => {
      if (!orderDetails || !entireHash) return;
      
      try {
        const purchaseData: PurchaseData = {
          farmName: orderDetails.farm,
          location: orderDetails.location,
          walletAddress: orderDetails.walletAddress,
          paymentMethod: orderDetails.paymentMethod,
          tokenAmount: orderDetails.tokenAmount,
          panelsPurchased: orderDetails.panels,
          cost: orderDetails.cost,
          capacity: orderDetails.capacity,
          output: orderDetails.output,
          transactionHash: entireHash,
          purchaseDate: new Date().toISOString()
        };
        console.log("Purchase data:", purchaseData);
        await createPurchase(purchaseData);
      } catch (error) {
        console.error('Failed to save purchase:', error);
      }
    };

    savePurchase();

  }, [location.state, entireHash, orderDetails]);

  // If no orderDetails, show nothing (will redirect)
  if (!orderDetails) {
    return (
      <FormContainer>
        <div className="text-center text-white py-10">Loading order details...</div>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-4">
        <div className="w-24">
          <img src={logo} alt="Renrg logo" />
        </div>
      </div>

      {/* Navigation Bar with Login link aligned to the right */}
      <div className="max-w-md mx-auto w-full relative z-10">
        {/* <div className="flex justify-end items-center mb-4">
         
          <a 
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors duration-300"
          >
            <LogIn size={18} />
            <span>Login</span>
          </a>
        </div> */}

        <Card className={cardClasses}>
          <CardBody className="p-6 bg-[#1A1A1A] flex flex-col items-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-[#E9423A] flex items-center justify-center mb-6"
            >
              <Check size={32} className="text-white" />
            </motion.div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-white mb-2 font-electrolize text-center">
              Purchase Complete!
            </h2>
            <p className="text-white text-center mb-8">
              Your solar panel purchase was successful.
            </p>

            {/* Transaction Details */}
            <div className="w-full mb-8">
              {/* First row - Transaction Hash (full width) */}
              <div className="mb-4">
              <Card className="w-full bg-[#222]">
                <CardBody className="p-4">
                  <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-mono text-sm overflow-hidden text-ellipsis">
                      {transactionHash}
                    </div>
                    <button
                      onClick={handleCopy}
                      title="Copy to Clipboard"
                      className="ml-4 p-1 rounded hover:bg-gray-700 transition-colors text-gray-400"
                    >
                      <Copy size={16} color="white" />
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    <a
                      href={`https://explorer.solana.com/tx/${entireHash}?cluster=devnet`}
                      target='_blank'
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                  {copied && (
                     <div className="mt-1 text-xs text-green-400">
                       Copied to clipboard!
                      </div>
                  )}
                </CardBody>
              </Card>
              </div>

              {/* Second row - 2 cards side by side */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="w-full bg-[#222]">
                  <CardBody className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Panels Purchased</div>
                    <div className="text-white">
                      {orderDetails.panels} x 450W Solar Panels
                    </div>
                  </CardBody>
                </Card>

                <Card className="w-full bg-[#222]">
                  <CardBody className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Capacity</div>
                    <div className="text-white">
                      {orderDetails.capacity.toFixed(2)} kW
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Third row - 2 cards side by side */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="w-full bg-[#222]">
                  <CardBody className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Payment Method</div>
                    <div className="text-white">
                      {orderDetails.tokenAmount.toLocaleString()} {orderDetails.paymentMethod}
                    </div>
                  </CardBody>
                </Card>

                <Card className="w-full bg-[#222]">
                  <CardBody className="p-4">
                    <div className="text-sm text-gray-400 mb-1">Node Token ID</div>
                    <div className="text-white font-mono">
                      {nodeToken}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-3">
              <Button 
                className="w-full bg-[#E9423A] text-white py-6 rounded-none"
                onPress={handleViewDashboard}
              >
                View Dashboard
              </Button>
              <Button 
                className="w-full bg-transparent text-white border border-white py-6 rounded-none"
                onPress={handlePurchaseMore}
              >
                Purchase More Panels
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* No business profile text as requested */}
    </FormContainer>
  );
}

export default PaymentSuccessPage;