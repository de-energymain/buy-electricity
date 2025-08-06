import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardBody, Spinner, Tooltip } from "@nextui-org/react";
import { ArrowLeft, Clock, Copy, ExternalLink } from "lucide-react";
import {
  FormContainer,
  cardClasses,
  secondaryButtonClasses,
} from "../../shared/styles";
import { API_CONFIG } from "../../config/api";

// Import wallet connection libraries
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { updateUserPanels } from "../../services/userApi";

// Import email service
import { sendPurchaseNotificationEmail } from "../../services/emailApi";

// Import plant allocation service
import {
  PlantAllocationService,
  PlantAllocation,
  Purchase,
} from "../../services/plantAllocationService";

// Import crypto icons from assets
import solIcon from "../../assets/crypto/sol-icon.svg";
import usdcIcon from "../../assets/crypto/usdc-icon.svg";
import nrgIcon from "../../assets/crypto/nrg-icon.svg";
import logo from "../../assets/logo.svg";

// Payment method types
type PaymentMethod = "SOL" | "USDC" | "NRG";

// USDC mint address on Solana devnet
const USDC_MINT_ADDRESS = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
); // Devnet USDC
// For mainnet, use: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

// NRG token mint address (using DOGA token address)
const NRG_MINT_ADDRESS = new PublicKey(
  "GvkBPHKFYscCPP9AncN5YNVenbabY7vYXPrWg3NfYYXW"
); // DOGA token mint address (displayed as NRG in UI)

interface OrderDetails {
  panels: number;
  capacity: number;
  output: number;
  cost: number;
  plantAllocations: PlantAllocation[];
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
  nrg: number;
}

export default function PaymentMethodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    disconnect,
    signTransaction,
    select,
    wallet,
    wallets,
  } = useWallet();
  const { setVisible } = useWalletModal();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [web3AuthWalletInfo, setWeb3AuthWalletInfo] =
    useState<Web3AuthWalletInfo | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastKey, setToastKey] = useState(0);

  // Clipboard state
  const [copied, setCopied] = useState(false);

  // Order details
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    panels: 29,
    capacity: 13.05,
    output: 0,
    cost: 15225.0,
    plantAllocations: [],
  });

  // Payment selection - Default to SOL instead of NRG
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("SOL");
  const [tokenAmount, setTokenAmount] = useState(0.05);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastTransactionTime, setLastTransactionTime] = useState<number>(0);
  const [lockMinutes, setLockMinutes] = useState(13);
  const [lockSeconds, setLockSeconds] = useState(22);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Get consistent wallet address across all scenarios
  const getWalletAddress = (): string => {
    if (publicKey) {
      return publicKey.toBase58();
    }
    if (web3AuthWalletInfo?.publicKey) {
      return web3AuthWalletInfo.publicKey;
    }
    return "";
  };

  const walletAddress = getWalletAddress();

  //Exchange rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    sol: 20,
    usdc: 1,
    nrg: 0.03, // $0.03 per NRG token
  });
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const panels = queryParams.get("panels");
  const cost = queryParams.get("cost");
  const capacity = queryParams.get("capacity");

  // Construct the redirect URL with only the necessary parameters
  const redirectSearchParams = new URLSearchParams();
  if (panels) {
    redirectSearchParams.append("panels", panels);
  }
  if (cost) {
    redirectSearchParams.append("cost", cost);
  }
  if (capacity) {
    redirectSearchParams.append("capacity", capacity);
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
          email: data.userInfo?.email || null,
        };
      }
      return null;
    } catch (e) {
      console.error("Error reading Web3Auth session", e);
      return null;
    }
  };

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
          "https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd"
        );
        const data = await response.json();
        setExchangeRates({
          sol: data.solana.usd,
          usdc: data["usd-coin"].usd,
          nrg: 0.03, // Updated rate for NRG
        });
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        showToast(
          "Error",
          "Failed to fetch exchange rates. Using default rates.",
          "danger",
          3000
        );
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Enhanced wallet balance fetching with USDC support
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!publicKey) return;

      try {
        let balance = 0;

        if (selectedPayment === "SOL") {
          balance = await connection.getBalance(publicKey);
          balance /= LAMPORTS_PER_SOL;
        } else if (selectedPayment === "USDC") {
          try {
            console.log("Fetching USDC balance for:", publicKey.toString());
            console.log(
              "USDC Mint Address (Devnet):",
              USDC_MINT_ADDRESS.toString()
            );

            // Get associated token account address for USDC
            const tokenAccount = await getAssociatedTokenAddress(
              USDC_MINT_ADDRESS,
              publicKey
            );

            console.log(
              "Expected USDC token account:",
              tokenAccount.toString()
            );

            // Get account info
            const accountInfo = await getAccount(connection, tokenAccount);
            balance = Number(accountInfo.amount) / Math.pow(10, 6); // USDC has 6 decimals
            console.log("USDC balance found:", balance);
          } catch (error: any) {
            // If token account doesn't exist, balance is 0
            console.log("USDC token account error:", error.message);
            if (error.message.includes("could not find account")) {
              console.log(
                "USDC token account not found - you may need devnet USDC tokens"
              );
            }
            balance = 0;
          }
        } else if (selectedPayment === "NRG") {
          try {
            console.log("Fetching NRG balance for:", publicKey.toString());
            console.log("NRG Mint Address:", NRG_MINT_ADDRESS.toString());

            // Get associated token account address for NRG
            const tokenAccount = await getAssociatedTokenAddress(
              NRG_MINT_ADDRESS,
              publicKey
            );

            console.log("Expected NRG token account:", tokenAccount.toString());

            // Get account info
            const accountInfo = await getAccount(connection, tokenAccount);
            balance = Number(accountInfo.amount) / Math.pow(10, 9); // NRG has 9 decimals (standard SPL token)
            console.log("NRG balance found:", balance);
          } catch (error: any) {
            // If token account doesn't exist, balance is 0
            console.log("NRG token account error:", error.message);
            if (error.message.includes("could not find account")) {
              console.log(
                "NRG token account not found - you may need NRG tokens"
              );
            }
            balance = 0;
          }
        }
        setWalletBalance(balance);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletBalance(0);
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
      newOrderDetails.panels = panelsValue
        ? Math.abs(parseFloat(panelsValue))
        : orderDetails.panels;
    }

    if (params.has("capacity")) {
      const capacityValue = params.get("capacity");
      newOrderDetails.capacity = capacityValue
        ? Math.abs(parseFloat(capacityValue))
        : orderDetails.capacity;
    }

    if (params.has("cost")) {
      const costValue = params.get("cost");
      newOrderDetails.cost = costValue
        ? Math.abs(parseFloat(costValue))
        : orderDetails.cost;
    }

    // Parse plant allocations from query params
    if (params.has("allocations")) {
      try {
        const allocationsStr = params.get("allocations");
        console.log("🔗 PaymentMethodPage: Raw allocations string:", allocationsStr);
        
        const allocations = allocationsStr ? JSON.parse(allocationsStr) : [];
        console.log("🔗 PaymentMethodPage: Parsed allocations:", allocations);
        console.log("🔗 PaymentMethodPage: Allocations count:", allocations.length);
        
        newOrderDetails.plantAllocations = allocations;
      } catch (error) {
        console.error("❌ PaymentMethodPage: Error parsing plant allocations:", error);
        newOrderDetails.plantAllocations = [];
      }
    } else {
      console.warn("⚠️ PaymentMethodPage: No allocations parameter found in URL");
      newOrderDetails.plantAllocations = [];
    }

    if (params.has("output")) {
      const outputValue = params.get("output");
      newOrderDetails.output = outputValue
        ? parseInt(outputValue)
        : orderDetails.output;
    }

    setOrderDetails(newOrderDetails);
  }, [location.search]);

  // Update token amount based on current cost
  useEffect(() => {
    if (selectedPayment === "SOL") {
      // Use SOL to USD conversion rate from exchange rates
      setTokenAmount(orderDetails.cost / exchangeRates.sol);
    } else if (selectedPayment === "USDC") {
      // USDC is pegged to USD (1:1)
      setTokenAmount(orderDetails.cost);
    } else if (selectedPayment === "NRG") {
      // Use NRG rate from exchange rates
      setTokenAmount(orderDetails.cost / exchangeRates.nrg);
    }
  }, [selectedPayment, orderDetails.cost, exchangeRates]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (lockSeconds > 0) {
        setLockSeconds((s) => s - 1);
      } else if (lockMinutes > 0) {
        setLockMinutes((m) => m - 1);
        setLockSeconds(59);
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockMinutes, lockSeconds, exchangeRates, isLoadingRates]);

  // Toast helper
  const showToast = (
    title: string,
    description: string,
    type = "success",
    duration = 3000
  ) => {
    const newToast = { id: toastKey, title, description, type, duration };
    setToasts((prev) => [...prev, newToast]);
    setToastKey((prev) => prev + 1);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== newToast.id)),
      duration
    );
  };

  useEffect(() => {
    if (connected && publicKey && wallet) {
      showToast(
        "Wallet Connected",
        `Connected to ${wallet.adapter.name}`,
        "success"
      );
    }
  }, [connected, publicKey, wallet]);

  const handleSelectPayment = (method: PaymentMethod) =>
    setSelectedPayment(method);
  const handleSelectWallet = () =>
    wallets.length > 0 && select?.(wallets[0].adapter.name);

  const handleChangeWallet = async () => {
    await disconnect?.();
    setVisible(true);
  };

  const truncateAddress = (address: string) =>
    address.length <= 8
      ? address
      : `${address.slice(0, 4)}...${address.slice(-4)}`;

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Copied", "Address copied to clipboard", "success", 2000);
  };

  // Helper function to extract primary plant data
  const getPrimaryPlantData = async (): Promise<{
    farm: string;
    location: string;
  }> => {
    try {
      const primaryAllocation = orderDetails.plantAllocations[0];
      if (primaryAllocation) {
        const primaryPlant = await PlantAllocationService.getPlant(
          primaryAllocation.plantId
        );
        if (primaryPlant) {
          return {
            farm: primaryPlant.name,
            location: primaryPlant.location,
          };
        }
      }
    } catch (error) {
      console.error("Error getting primary plant data:", error);
    }

    return {
      farm: "Multi-Plant Purchase",
      location: "Multiple Locations",
    };
  };

  // Helper function to send admin notification email
  const sendAdminNotification = async (
    paymentMethod: PaymentMethod,
    _tokenAmount: number,
    _walletName: string,
    signature: string
  ) => {
    try {
      // Get primary plant info for email (first allocation)
      const primaryAllocation = orderDetails.plantAllocations[0];
      let primaryPlantName = "Multi-Plant Purchase";
      let primaryPlantLocation = "Multiple Locations";

      if (primaryAllocation) {
        try {
          const primaryPlant = await PlantAllocationService.getPlant(
            primaryAllocation.plantId
          );
          if (primaryPlant) {
            primaryPlantName = primaryPlant.name;
            primaryPlantLocation = primaryPlant.location;
          }
        } catch (error) {
          console.error("Error getting primary plant data:", error);
        }
      }

      await sendPurchaseNotificationEmail({
        orderDetails: {
          farm: primaryPlantName,
          location: primaryPlantLocation,
          panels: orderDetails.panels,
          capacity: orderDetails.capacity,
          output: orderDetails.output,
          cost: orderDetails.cost,
        },
        paymentMethod,
        tokenAmount: orderDetails.cost, // Use cost as token amount
        walletAddress: walletAddress,
        signature,
        wallet: "Connected Wallet", // Default wallet name
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Don't block the payment flow if email fails
    }
  };

  // Save purchase and reserve capacity - IMPROVED VERSION
  const savePurchase = async (
    paymentMethod: PaymentMethod,
    _tokenAmount: number,
    _walletName: string,
    signature: string
  ) => {
    const currentWalletAddress = getWalletAddress();
    
    console.log('🔄 Starting purchase save process', {
      signature,
      walletAddress: currentWalletAddress,
      paymentMethod,
      tokenAmount: _tokenAmount,
      panels: orderDetails.panels,
      allocationsCount: orderDetails.plantAllocations.length
    });

    // Input validation
    if (!currentWalletAddress) {
      console.error('❌ Invalid wallet address');
      return false;
    }

    if (!signature) {
      console.error('❌ Missing transaction signature');
      return false;
    }

    if (!orderDetails.plantAllocations || orderDetails.plantAllocations.length === 0) {
      console.error('❌ Missing plant allocations:', orderDetails);
      return false;
    }

    try {
      // 1. Update User API (non-critical, can fail without blocking)
      try {
        console.log('📝 Updating user panel details...');
        await updateUserPanels(currentWalletAddress, {
          panelsPurchased: orderDetails.panels,
          cost: orderDetails.cost
        });
        console.log('✅ User panel details updated successfully');
      } catch (error) {
        console.warn('⚠️  Failed to update user panel details (non-critical)', error);
        // Continue with purchase save even if this fails
      }

      // 2. Create purchase record for backend API (CRITICAL)
      const purchaseData = {
        walletAddress: currentWalletAddress,
        paymentMethod,
        tokenAmount: tokenAmount, // Use the component state tokenAmount
        panelsPurchased: orderDetails.panels,
        cost: orderDetails.cost,
        capacity: orderDetails.capacity,
        output: orderDetails.output,
        transactionHash: signature,
        farmName: "Multi-Plant Purchase",
        location: "Multiple Locations",
        plantAllocations: orderDetails.plantAllocations,
      };

      console.log('💾 Saving purchase to database...', {
        signature,
        allocationsCount: purchaseData.plantAllocations.length,
        totalCost: purchaseData.cost
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Database save failed:', {
          status: response.status,
          responseData,
          purchaseData
        });
        
        // Handle specific error cases
        if (response.status === 409) {
          console.warn('⚠️  Transaction already exists in database');
          // This might be okay - the purchase is already saved
          return true;
        }
        
        throw new Error(`Database save failed: ${responseData.message || response.statusText}`);
      }

      console.log("✅ Purchase saved successfully to database:", responseData);

      // 3. Save to local storage for backup (non-critical)
      try {
        const purchase: Purchase = {
          id: Date.now().toString(),
          walletAddress: currentWalletAddress,
          totalPanels: orderDetails.panels,
          totalCapacity: orderDetails.capacity,
          totalCost: orderDetails.cost,
          paymentMethod,
          signature,
          timestamp: new Date().toISOString(),
          plantAllocations: orderDetails.plantAllocations,
        };
        PlantAllocationService.savePurchase(purchase);
        console.log('📱 Purchase saved to local storage as backup');
      } catch (error) {
        console.warn('⚠️  Failed to save to local storage (non-critical)', error);
      }

      return true;
    } catch (error) {
      console.error("💥 Failed to save purchase:", {
        error,
        signature,
        walletAddress: currentWalletAddress,
        orderDetails
      });
      return false;
    }
  };

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

  // Enhanced payment processing with validation and security checks
  const handleProceedToPayment = async () => {
    // Prevent rapid duplicate transactions (5 second cooldown)
    const currentTime = Date.now();
    if (currentTime - lastTransactionTime < 5000) {
      showToast(
        "Please Wait",
        "Please wait a moment before submitting another transaction",
        "warning",
        3000
      );
      return;
    }
    
    setIsProcessingPayment(true);
    setLastTransactionTime(currentTime);
    const processingId = toastKey;
    showToast(
      "Processing Payment",
      `Sending ${tokenAmount.toFixed(2)} ${selectedPayment}...`,
      "primary",
      100000
    );

    try {
      // Validate payment method and wallet connection
      if (!connected && !web3AuthWalletInfo) {
        throw new Error("No wallet connected");
      }

      // Check if USDC is selected and validate
      if (selectedPayment === "USDC") {
        // Check if user has sufficient USDC balance
        if (walletBalance < tokenAmount) {
          throw new Error(
            `Insufficient USDC balance. You need ${tokenAmount.toFixed(
              2
            )} USDC but only have ${walletBalance.toFixed(2)} USDC.`
          );
        }

        // Handle USDC payment via Solana wallet adapter
        if (connected && publicKey && signTransaction) {
          // Send payment to company treasury wallet
          const recipient = new PublicKey("5iHtAYDfRH6oU4BzmkK3oupXPQN5okzSGVficfGE3JSg");

          console.log("Starting USDC payment transaction");
          console.log("Sender public key:", publicKey.toString());
          console.log("Recipient public key:", recipient.toString());
          console.log("USDC Mint:", USDC_MINT_ADDRESS.toString());

          // Get sender's USDC token account
          const senderTokenAccount = await getAssociatedTokenAddress(
            USDC_MINT_ADDRESS,
            publicKey
          );
          console.log("Sender token account:", senderTokenAccount.toString());

          // Check if sender's token account exists and has balance
          try {
            const senderAccountInfo = await getAccount(
              connection,
              senderTokenAccount
            );
            console.log(
              "Sender USDC balance:",
              Number(senderAccountInfo.amount) / Math.pow(10, 6)
            );

            if (
              Number(senderAccountInfo.amount) <
              Math.floor(tokenAmount * Math.pow(10, 6))
            ) {
              throw new Error("Insufficient USDC balance in token account");
            }
          } catch (error: any) {
            if (error.message.includes("could not find account")) {
              throw new Error(
                "USDC token account not found. Please ensure you have USDC tokens in your wallet."
              );
            }
            throw error;
          }

          // Get recipient's USDC token account (create if doesn't exist)
          const recipientTokenAccount = await getAssociatedTokenAddress(
            USDC_MINT_ADDRESS,
            recipient
          );
          console.log(
            "Recipient token account:",
            recipientTokenAccount.toString()
          );

          const tx = new Transaction();

          // Check if recipient token account exists
          try {
            await getAccount(connection, recipientTokenAccount);
          } catch (error) {
            // If account doesn't exist, create it
            tx.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // payer
                recipientTokenAccount, // associatedToken
                recipient, // owner
                USDC_MINT_ADDRESS // mint
              )
            );
          }

          // Add USDC transfer instruction
          const usdcAmount = Math.floor(tokenAmount * Math.pow(10, 6)); // USDC has 6 decimals
          tx.add(
            createTransferInstruction(
              senderTokenAccount, // source
              recipientTokenAccount, // destination
              publicKey, // owner
              usdcAmount // amount
            )
          );

          const { blockhash } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;
          const signedTx = await signTransaction(tx);
          const signature = await connection.sendRawTransaction(
            signedTx.serialize()
          );
          await connection.confirmTransaction(signature, "confirmed");

          // Complete transaction
          setToasts((prev) => prev.filter((t) => t.id !== processingId));
          showToast(
            "Payment Successful",
            "Your USDC transaction was completed successfully",
            "success",
            3000
          );

          // Send admin notification email
          await sendAdminNotification(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          // Save purchase and reserve capacity
          const purchaseSaved = await savePurchase(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          if (!purchaseSaved) {
            throw new Error("Purchase could not be saved. Please try again.");
          }

          // Get farm and location data for navigation
          const plantData = await getPrimaryPlantData();

          navigate("/payment-success", {
            state: {
              ...orderDetails,
              paymentMethod: selectedPayment,
              tokenAmount,
              wallet: wallet?.adapter.name ?? "Unknown",
              walletAddress: walletAddress,
              signature,
              farm: plantData.farm,
              location: plantData.location,
            },
          });

          // Send admin notification email
          sendAdminNotification(
            "USDC",
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );
        }
        // Handle USDC payment via Web3Auth/Google login
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

            // Handle different private key formats (same as SOL implementation)
            let privateKeyBytes;

            if (typeof sessionData.privateKey === "string") {
              if (sessionData.privateKey.length === 88) {
                throw new Error("Base58 decoding requires bs58 library");
              } else if (
                sessionData.privateKey.length === 128 ||
                sessionData.privateKey.length === 64
              ) {
                privateKeyBytes = new Uint8Array(
                  sessionData.privateKey.length / 2
                );
                for (let i = 0; i < sessionData.privateKey.length; i += 2) {
                  privateKeyBytes[i / 2] = parseInt(
                    sessionData.privateKey.substr(i, 2),
                    16
                  );
                }
              } else {
                try {
                  const parsed = JSON.parse(sessionData.privateKey);
                  privateKeyBytes = new Uint8Array(parsed);
                } catch (e) {
                  throw new Error(
                    `Unable to parse privateKey format: ${e.message}`
                  );
                }
              }
            } else if (Array.isArray(sessionData.privateKey)) {
              privateKeyBytes = new Uint8Array(sessionData.privateKey);
            } else if (typeof sessionData.privateKey === "object") {
              privateKeyBytes = new Uint8Array(
                Object.values(sessionData.privateKey)
              );
            } else {
              throw new Error("Unsupported privateKey format");
            }

            if (privateKeyBytes.length !== 64) {
              console.error(
                "Invalid private key length:",
                privateKeyBytes.length
              );
              throw new Error(
                `Bad secret key size: expected 64 bytes, got ${privateKeyBytes.length}`
              );
            }

            const keyPair = Keypair.fromSecretKey(privateKeyBytes);
            // For testing purposes, send to your own wallet
            const recipient = keyPair.publicKey; // Send to yourself for testing
            // Alternative: use a different valid wallet address

            console.log("Starting Web3Auth USDC payment transaction");
            console.log("Sender public key:", keyPair.publicKey.toString());
            console.log("Recipient public key:", recipient.toString());

            // Get sender's USDC token account
            const senderTokenAccount = await getAssociatedTokenAddress(
              USDC_MINT_ADDRESS,
              keyPair.publicKey
            );

            // Get recipient's USDC token account
            const recipientTokenAccount = await getAssociatedTokenAddress(
              USDC_MINT_ADDRESS,
              recipient
            );

            const tx = new Transaction();

            // Check if recipient token account exists
            try {
              await getAccount(connection, recipientTokenAccount);
            } catch (error) {
              // If account doesn't exist, create it
              tx.add(
                createAssociatedTokenAccountInstruction(
                  keyPair.publicKey, // payer
                  recipientTokenAccount, // associatedToken
                  recipient, // owner
                  USDC_MINT_ADDRESS // mint
                )
              );
            }

            // Add USDC transfer instruction
            const usdcAmount = Math.floor(tokenAmount * Math.pow(10, 6)); // USDC has 6 decimals
            tx.add(
              createTransferInstruction(
                senderTokenAccount, // source
                recipientTokenAccount, // destination
                keyPair.publicKey, // owner
                usdcAmount // amount
              )
            );

            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = keyPair.publicKey;
            tx.sign(keyPair);

            const signature = await connection.sendRawTransaction(
              tx.serialize()
            );
            await connection.confirmTransaction(signature, "confirmed");

            // Complete transaction
            setToasts((prev) => prev.filter((t) => t.id !== processingId));
            showToast(
              "Payment Successful",
              "Your USDC transaction was completed successfully",
              "success",
              3000
            );

            // Send admin notification email
            await sendAdminNotification(
              selectedPayment,
              tokenAmount,
              "Google Web3Auth",
              signature
            );

            // Save purchase and reserve capacity
            const purchaseSaved = await savePurchase(
              selectedPayment,
              tokenAmount,
              "Google Web3Auth",
              signature
            );

            if (!purchaseSaved) {
              throw new Error("Purchase could not be saved. Please try again.");
            }

            // Get farm and location data for navigation
            const plantData = await getPrimaryPlantData();

            navigate("/payment-success", {
              state: {
                ...orderDetails,
                paymentMethod: selectedPayment,
                tokenAmount,
                wallet: "Google Web3Auth",
                signature,
                farm: plantData.farm,
                location: plantData.location,
              },
            });
          } catch (error: any) {
            console.error("Web3Auth USDC transaction error:", error);
            throw new Error(
              `Web3Auth USDC transaction failed: ${error.message}`
            );
          }
        }
      }

      // Check if NRG is selected and validate
      if (selectedPayment === "NRG") {
        // Check if user has sufficient NRG balance
        if (walletBalance < tokenAmount) {
          throw new Error(
            `Insufficient NRG balance. You need ${tokenAmount.toFixed(
              2
            )} NRG but only have ${walletBalance.toFixed(2)} NRG.`
          );
        }

        // Handle NRG payment via Solana wallet adapter
        if (connected && publicKey && signTransaction) {
          // Send NRG payments to specific recipient address
          const recipient = new PublicKey(
            "CxuV3Wd1BDkgaYCqJuzuy1BRjdszt9bUhhKBBRB8pTru"
          );

          console.log("Starting NRG payment transaction");
          console.log("Sender public key:", publicKey.toString());
          console.log("Recipient public key:", recipient.toString());
          console.log("NRG Mint:", NRG_MINT_ADDRESS.toString());

          // Get sender's NRG token account
          const senderTokenAccount = await getAssociatedTokenAddress(
            NRG_MINT_ADDRESS,
            publicKey
          );
          console.log("Sender token account:", senderTokenAccount.toString());

          // Check if sender's token account exists and has balance
          try {
            const senderAccountInfo = await getAccount(
              connection,
              senderTokenAccount
            );
            console.log(
              "Sender NRG balance:",
              Number(senderAccountInfo.amount) / Math.pow(10, 9)
            );

            if (
              Number(senderAccountInfo.amount) <
              Math.floor(tokenAmount * Math.pow(10, 9))
            ) {
              throw new Error("Insufficient NRG balance in token account");
            }
          } catch (error: any) {
            if (error.message.includes("could not find account")) {
              throw new Error(
                "NRG token account not found. Please ensure you have NRG tokens in your wallet."
              );
            }
            throw error;
          }

          // Get recipient's NRG token account (create if doesn't exist)
          const recipientTokenAccount = await getAssociatedTokenAddress(
            NRG_MINT_ADDRESS,
            recipient
          );
          console.log(
            "Recipient token account:",
            recipientTokenAccount.toString()
          );

          const tx = new Transaction();

          // Check if recipient token account exists
          try {
            await getAccount(connection, recipientTokenAccount);
          } catch (error) {
            // If account doesn't exist, create it
            tx.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // payer
                recipientTokenAccount, // associatedToken
                recipient, // owner
                NRG_MINT_ADDRESS // mint
              )
            );
          }

          // Add NRG transfer instruction
          const nrgAmount = Math.floor(tokenAmount * Math.pow(10, 9)); // NRG has 9 decimals (standard SPL token)
          tx.add(
            createTransferInstruction(
              senderTokenAccount, // source
              recipientTokenAccount, // destination
              publicKey, // owner
              nrgAmount // amount
            )
          );

          // Get fresh blockhash for transaction uniqueness
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;
          
          // Sign and send transaction with retry logic
          const signedTx = await signTransaction(tx);
          
          // Use sendTransaction with skipPreflight to avoid simulation issues
          let signature;
          try {
            signature = await connection.sendRawTransaction(
              signedTx.serialize(),
              {
                skipPreflight: true,
                maxRetries: 3
              }
            );
          } catch (error: any) {
            // Handle specific "already processed" error
            if (error.message && error.message.includes("already been processed")) {
              throw new Error("Transaction was already processed. If you don't see the payment reflected, please wait a moment and refresh the page.");
            }
            // Handle other simulation/send errors
            if (error.message && error.message.includes("Simulation failed")) {
              throw new Error("Transaction simulation failed. Please try again with a fresh transaction.");
            }
            throw error;
          }
          
          // Wait for confirmation with timeout
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          }, "confirmed");
          
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }

          // Complete transaction
          setToasts((prev) => prev.filter((t) => t.id !== processingId));
          showToast(
            "Payment Successful",
            "Your NRG transaction was completed successfully",
            "success",
            3000
          );

          // Send admin notification email
          await sendAdminNotification(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          // Save purchase and reserve capacity
          const purchaseSaved = await savePurchase(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          if (!purchaseSaved) {
            throw new Error("Purchase could not be saved. Please try again.");
          }

          // Get farm and location data for navigation
          const plantData = await getPrimaryPlantData();

          navigate("/payment-success", {
            state: {
              ...orderDetails,
              paymentMethod: selectedPayment,
              tokenAmount,
              wallet: wallet?.adapter.name ?? "Unknown",
              walletAddress: walletAddress,
              signature,
              farm: plantData.farm,
              location: plantData.location,
            },
          });
        }
        // Handle NRG payment via Web3Auth/Google login
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

            // Handle different private key formats (same as SOL implementation)
            let privateKeyBytes;

            if (typeof sessionData.privateKey === "string") {
              if (sessionData.privateKey.length === 88) {
                throw new Error("Base58 decoding requires bs58 library");
              } else if (
                sessionData.privateKey.length === 128 ||
                sessionData.privateKey.length === 64
              ) {
                privateKeyBytes = new Uint8Array(
                  sessionData.privateKey.length / 2
                );
                for (let i = 0; i < sessionData.privateKey.length; i += 2) {
                  privateKeyBytes[i / 2] = parseInt(
                    sessionData.privateKey.substr(i, 2),
                    16
                  );
                }
              } else {
                try {
                  const parsed = JSON.parse(sessionData.privateKey);
                  privateKeyBytes = new Uint8Array(parsed);
                } catch (e) {
                  throw new Error(
                    `Unable to parse privateKey format: ${e.message}`
                  );
                }
              }
            } else if (Array.isArray(sessionData.privateKey)) {
              privateKeyBytes = new Uint8Array(sessionData.privateKey);
            } else if (typeof sessionData.privateKey === "object") {
              privateKeyBytes = new Uint8Array(
                Object.values(sessionData.privateKey)
              );
            } else {
              throw new Error("Unsupported privateKey format");
            }

            if (privateKeyBytes.length !== 64) {
              console.error(
                "Invalid private key length:",
                privateKeyBytes.length
              );
              throw new Error(
                `Bad secret key size: expected 64 bytes, got ${privateKeyBytes.length}`
              );
            }

            const keyPair = Keypair.fromSecretKey(privateKeyBytes);
            // Send NRG payments to specific recipient address
            const recipient = new PublicKey(
              "CxuV3Wd1BDkgaYCqJuzuy1BRjdszt9bUhhKBBRB8pTru"
            );

            console.log("Starting Web3Auth NRG payment transaction");
            console.log("Sender public key:", keyPair.publicKey.toString());
            console.log("Recipient public key:", recipient.toString());

            // Get sender's NRG token account
            const senderTokenAccount = await getAssociatedTokenAddress(
              NRG_MINT_ADDRESS,
              keyPair.publicKey
            );

            // Get recipient's NRG token account
            const recipientTokenAccount = await getAssociatedTokenAddress(
              NRG_MINT_ADDRESS,
              recipient
            );

            const tx = new Transaction();

            // Check if recipient token account exists
            try {
              await getAccount(connection, recipientTokenAccount);
            } catch (error) {
              // If account doesn't exist, create it
              tx.add(
                createAssociatedTokenAccountInstruction(
                  keyPair.publicKey, // payer
                  recipientTokenAccount, // associatedToken
                  recipient, // owner
                  NRG_MINT_ADDRESS // mint
                )
              );
            }

            // Add NRG transfer instruction
            const nrgAmount = Math.floor(tokenAmount * Math.pow(10, 9)); // NRG has 9 decimals (standard SPL token)
            tx.add(
              createTransferInstruction(
                senderTokenAccount, // source
                recipientTokenAccount, // destination
                keyPair.publicKey, // owner
                nrgAmount // amount
              )
            );

            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = keyPair.publicKey;
            tx.sign(keyPair);

            const signature = await connection.sendRawTransaction(
              tx.serialize()
            );
            await connection.confirmTransaction(signature, "confirmed");

            // Complete transaction
            setToasts((prev) => prev.filter((t) => t.id !== processingId));
            showToast(
              "Payment Successful",
              "Your NRG transaction was completed successfully",
              "success",
              3000
            );

            // Send admin notification email
            await sendAdminNotification(
              selectedPayment,
              tokenAmount,
              "Google Web3Auth",
              signature
            );

            // Save purchase and reserve capacity
            const purchaseSaved = await savePurchase(
              selectedPayment,
              tokenAmount,
              "Google Web3Auth",
              signature
            );

            if (!purchaseSaved) {
              throw new Error("Purchase could not be saved. Please try again.");
            }

            // Get farm and location data for navigation
            const plantData = await getPrimaryPlantData();

            navigate("/payment-success", {
              state: {
                ...orderDetails,
                paymentMethod: selectedPayment,
                tokenAmount,
                wallet: "Google Web3Auth",
                signature,
                farm: plantData.farm,
                location: plantData.location,
              },
            });
          } catch (error: any) {
            console.error("Web3Auth NRG transaction error:", error);
            throw new Error(
              `Web3Auth NRG transaction failed: ${error.message}`
            );
          }
        }
      }

      // Validate SOL payment
      if (selectedPayment === "SOL") {
        // Check if user has sufficient balance
        if (walletBalance < tokenAmount) {
          throw new Error(
            `Insufficient balance. You need ${tokenAmount.toFixed(
              4
            )} SOL but only have ${walletBalance.toFixed(4)} SOL.`
          );
        }

        // Handle payment via Solana wallet adapter
        if (connected && publicKey && signTransaction) {
          const lamports = Math.floor(tokenAmount * LAMPORTS_PER_SOL);
          const recipient = new PublicKey("5iHtAYDfRH6oU4BzmkK3oupXPQN5okzSGVficfGE3JSg"); // Company treasury wallet
          const tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: recipient,
              lamports,
            })
          );
          const { blockhash } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;
          const signedTx = await signTransaction(tx);
          const signature = await connection.sendRawTransaction(
            signedTx.serialize()
          );
          await connection.confirmTransaction(signature, "confirmed");

          // Complete transaction
          setToasts((prev) => prev.filter((t) => t.id !== processingId));
          showToast(
            "Payment Successful",
            "Your transaction was completed successfully",
            "success",
            3000
          );

          // Send admin notification email
          await sendAdminNotification(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          // Save purchase and reserve capacity
          const purchaseSaved = await savePurchase(
            selectedPayment,
            tokenAmount,
            wallet?.adapter.name ?? "Unknown",
            signature
          );

          if (!purchaseSaved) {
            throw new Error("Purchase could not be saved. Please try again.");
          }

          // Get farm and location data for navigation
          const plantData = await getPrimaryPlantData();

          navigate("/payment-success", {
            state: {
              ...orderDetails,
              paymentMethod: selectedPayment,
              tokenAmount,
              wallet: wallet?.adapter.name ?? "Unknown",
              walletAddress: walletAddress,
              signature,
              farm: plantData.farm,
              location: plantData.location,
            },
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

            // Handle different private key formats
            let privateKeyBytes;

            if (typeof sessionData.privateKey === "string") {
              // If it's a base58 encoded string
              if (sessionData.privateKey.length === 88) {
                // Decode base58 string to bytes - you might need bs58 library for this
                // privateKeyBytes = bs58.decode(sessionData.privateKey);
                throw new Error("Base58 decoding requires bs58 library");
              }
              // If it's a hex string
              else if (
                sessionData.privateKey.length === 128 ||
                sessionData.privateKey.length === 64
              ) {
                privateKeyBytes = new Uint8Array(
                  sessionData.privateKey.length / 2
                );
                for (let i = 0; i < sessionData.privateKey.length; i += 2) {
                  privateKeyBytes[i / 2] = parseInt(
                    sessionData.privateKey.substr(i, 2),
                    16
                  );
                }
              }
              // Attempt to parse as JSON if it's a stringified array
              else {
                try {
                  const parsed = JSON.parse(sessionData.privateKey);
                  privateKeyBytes = new Uint8Array(parsed);
                } catch (e) {
                  throw new Error(
                    `Unable to parse privateKey format: ${e.message}`
                  );
                }
              }
            }
            // If it's already an array
            else if (Array.isArray(sessionData.privateKey)) {
              privateKeyBytes = new Uint8Array(sessionData.privateKey);
            }
            // If it's an object with numeric keys (like what JSON.stringify does to Uint8Array)
            else if (typeof sessionData.privateKey === "object") {
              privateKeyBytes = new Uint8Array(
                Object.values(sessionData.privateKey)
              );
            } else {
              throw new Error("Unsupported privateKey format");
            }

            // Ensure the private key is the correct size for Solana (64 bytes)
            if (privateKeyBytes.length !== 64) {
              console.error(
                "Invalid private key length:",
                privateKeyBytes.length
              );
              throw new Error(
                `Bad secret key size: expected 64 bytes, got ${privateKeyBytes.length}`
              );
            }

            // Create keypair from the processed private key
            try {
              const keyPair = Keypair.fromSecretKey(privateKeyBytes);
              console.log("Successfully created keypair from private key");
              console.log(
                "Public key from keypair:",
                keyPair.publicKey.toString()
              );

              // Verify the keypair's public key matches what we expect
              if (
                keyPair.publicKey.toString() !== web3AuthWalletInfo.publicKey
              ) {
                console.warn(
                  "Warning: public key from keypair doesn't match stored public key.",
                  "Expected:",
                  web3AuthWalletInfo.publicKey,
                  "Got:",
                  keyPair.publicKey.toString()
                );
              }

              // Create and sign the transaction using the private key
              const recipientPublicKey = keyPair.publicKey; // Send to yourself for testing
              const senderPublicKey = keyPair.publicKey;
              const lamports = Math.floor(tokenAmount * LAMPORTS_PER_SOL);

              // Create a transaction
              const tx = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: senderPublicKey,
                  toPubkey: recipientPublicKey,
                  lamports,
                })
              );

              // Get recent blockhash
              const { blockhash } = await connection.getLatestBlockhash();
              tx.recentBlockhash = blockhash;
              tx.feePayer = senderPublicKey;

              // Sign transaction using the keypair
              tx.sign(keyPair);

              // Send the signed transaction
              const signature = await connection.sendRawTransaction(
                tx.serialize()
              );
              await connection.confirmTransaction(signature, "confirmed");

              // Complete transaction
              setToasts((prev) => prev.filter((t) => t.id !== processingId));
              showToast(
                "Payment Successful",
                "Your transaction was completed successfully",
                "success",
                3000
              );

              // Send admin notification email
              await sendAdminNotification(
                selectedPayment,
                tokenAmount,
                "Google Web3Auth",
                signature
              );

              // Save purchase and reserve capacity
              const purchaseSaved = await savePurchase(
                selectedPayment,
                tokenAmount,
                "Google Web3Auth",
                signature
              );

              if (!purchaseSaved) {
                throw new Error(
                  "Purchase could not be saved. Please try again."
                );
              }

              // Get farm and location data for navigation
              const plantData = await getPrimaryPlantData();

              navigate("/payment-success", {
                state: {
                  ...orderDetails,
                  paymentMethod: selectedPayment,
                  tokenAmount,
                  wallet: "Google Web3Auth",
                  signature,
                  farm: plantData.farm,
                  location: plantData.location,
                },
              });
            } catch (error) {
              console.error(
                "Error creating keypair or signing transaction:",
                error
              );
              throw error;
            }
          } catch (error: any) {
            console.error("Web3Auth transaction error:", error);
            throw new Error(`Web3Auth transaction failed: ${error.message}`);
          }
        }
      } else {
        throw new Error(
          "Payment method not supported for current wallet connection"
        );
      }
    } catch (error: any) {
      console.error(error);
      setToasts((prev) => prev.filter((t) => t.id !== processingId));
      showToast(
        "Payment Failed",
        error.message || "Transaction failed",
        "danger",
        5000
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => navigate(-1);

  const handleLoginButtonClick = () => {
    if (!isAuthenticated) {
      const redirectUrl = `/payment?panels=${panels}&cost=${cost}&capacity=${capacity}`;
      const encodedRedirect = encodeURIComponent(redirectUrl);
      navigate(`/login?redirect=${encodedRedirect}`);
    }
  };

  return (
    <FormContainer>
      {/* Logo */}
      <div className="flex justify-center relative z-10 mb-3">
        <div className="w-20">
          <img src={logo} alt="Renrg logo" />
        </div>
      </div>

      <div className="w-full max-w-[420px] mx-auto relative z-10 flex flex-col">
        {/* Navigation Bar with Back button */}
        <div className="flex justify-start items-center mb-3">
          <Button
            className={secondaryButtonClasses}
            onPress={handleBack}
            startContent={<ArrowLeft size={20} />}
            disabled={isProcessingPayment}
          >
            Back
          </Button>
        </div>

        <Card className={`${cardClasses} w-full overflow-hidden`}>
          {/* Header */}
          <div className="mt-3 p-3 bg-[#2F2F2F] rounded-lg shadow-inner w-full text-center">
            <h2 className="text-2xl font-bold text-white mb-1 font-electrolize">
              Payment
            </h2>
            <p className="text-xs text-white font-inter">
              Choose your payment method
            </p>
          </div>{" "}
          <CardBody className="p-4 bg-[#2F2F2F] space-y-4">
            {/* Order details section - Improved layout */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-[#1A1A1A] rounded">
                  <div className="text-xs text-gray-400 mb-1">Solar Panels</div>
                  <div className="text-lg font-bold text-white">
                    {orderDetails.panels}
                  </div>
                </div>
                <div className="p-2 bg-[#1A1A1A] rounded">
                  <div className="text-xs text-gray-400 mb-1">
                    Total Capacity
                  </div>
                  <div className="text-lg font-bold text-white">
                    {orderDetails.capacity.toFixed(2)} kW
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#1A1A1A] rounded border-t-2 border-[#E9423A]">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Amount</span>
                  <span className="text-lg font-bold text-white">
                    ${orderDetails.cost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method selection */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">
                Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { method: "SOL", icon: solIcon },
                  { method: "USDC", icon: usdcIcon },
                  { method: "NRG", icon: nrgIcon },
                ].map(({ method, icon }) => (
                  <div
                    key={method}
                    className={`cursor-pointer transition-all border-2 rounded p-3 ${
                      selectedPayment === method
                        ? "border-[#E9423A] bg-[#2A1A1A]"
                        : "border-gray-600 bg-[#1A1A1A] hover:border-gray-500"
                    }`}
                    onClick={() => handleSelectPayment(method as PaymentMethod)}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <img src={icon} alt={method} className="w-8 h-8 mb-2" />
                      <div className="text-sm font-bold text-white">
                        {method}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Amount display */}
              <div className="text-center mb-3">
                <p className="text-xs text-gray-300 mb-1">
                  Amount Due in {selectedPayment}
                </p>
                <p className="text-2xl font-bold text-white mb-1">
                  {tokenAmount.toFixed(2)} {selectedPayment}
                </p>
                <p className="text-xs text-gray-400">
                  ≈ ${orderDetails.cost.toFixed(2)} USD
                </p>
                <div className="inline-block px-2 py-1 bg-yellow-600 bg-opacity-20 rounded-full text-xs text-yellow-400 mt-1">
                  Devnet
                </div>
              </div>

              {/* Price lock timer */}
              <div className="flex items-center justify-center text-xs text-[#E9423A] mb-4">
                <Clock size={12} className="mr-1" />
                <span>
                  Price locked for {lockMinutes}:
                  {lockSeconds < 10 ? `0${lockSeconds}` : lockSeconds}
                </span>
              </div>
            </div>

            {/* Wallet connection section */}
            <div>
              {/* Connected wallet display */}
              {connected && publicKey ? (
                <div className="p-3 bg-[#1A1A1A] rounded mb-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">
                        Connected to
                      </span>
                      <span className="text-white text-xs font-medium">
                        {wallet?.adapter.name || "Unknown Wallet"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Address</span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white text-xs hover:text-[#E9423A] transition-colors flex items-center font-mono"
                        >
                          <span>{truncateAddress(publicKey.toString())}</span>
                          <ExternalLink size={10} className="ml-1" />
                        </a>
                        <Tooltip content={copied ? "Copied!" : "Copy Address"}>
                          <button
                            onClick={() => copyAddress(publicKey.toString())}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Balance</span>
                      <span className="text-white text-xs font-medium">
                        {walletBalance.toFixed(
                          selectedPayment === "USDC" ? 2 : 4
                        )}{" "}
                        {selectedPayment}
                      </span>
                    </div>

                    {/* Balance warning for insufficient funds or missing devnet USDC */}
                    {selectedPayment === "SOL" &&
                      walletBalance < tokenAmount && (
                        <div className="text-xs text-red-400 text-center">
                          Insufficient balance for this transaction
                        </div>
                      )}

                    {selectedPayment === "USDC" && walletBalance === 0 && (
                      <div className="text-xs text-yellow-400 text-center">
                        <div>No devnet USDC found.</div>
                        <a
                          href="https://spl-token-faucet.com/?token-name=USDC"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-yellow-300"
                        >
                          Get devnet USDC
                        </a>
                      </div>
                    )}

                    {selectedPayment === "USDC" &&
                      walletBalance > 0 &&
                      walletBalance < tokenAmount && (
                        <div className="text-xs text-red-400 text-center">
                          Insufficient USDC balance for this transaction
                        </div>
                      )}
                  </div>

                  <div className="mt-2 text-center">
                    <button
                      onClick={handleChangeWallet}
                      className="text-[#E9423A] text-xs hover:underline"
                    >
                      change wallet
                    </button>
                  </div>
                </div>
              ) : (
                web3AuthWalletInfo && (
                  <div className="p-3 bg-[#1A1A1A] rounded mb-3">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-xs">
                          Connected via
                        </span>
                        <span className="text-white text-xs font-medium">
                          {web3AuthWalletInfo.provider}
                        </span>
                      </div>

                      {web3AuthWalletInfo.publicKey && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Address</span>
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://explorer.solana.com/address/${web3AuthWalletInfo.publicKey}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white text-xs hover:text-[#E9423A] transition-colors flex items-center font-mono"
                            >
                              <span>
                                {truncateAddress(web3AuthWalletInfo.publicKey)}
                              </span>
                              <ExternalLink size={10} className="ml-1" />
                            </a>
                            <Tooltip
                              content={copied ? "Copied!" : "Copy Address"}
                            >
                              <button
                                onClick={() =>
                                  copyAddress(web3AuthWalletInfo.publicKey!)
                                }
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                <Copy size={12} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      {web3AuthWalletInfo.email && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Email</span>
                          <span className="text-white text-xs">
                            {web3AuthWalletInfo.email}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-center">
                      <button
                        onClick={() => navigate("/login")}
                        className="text-[#E9423A] text-xs hover:underline"
                      >
                        change login
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Action Button */}
              <Button
                className="w-full bg-[#E9423A] text-white font-medium h-10 rounded-none relative"
                onPress={
                  isAuthenticated ? handlePaymentAction : handleLoginButtonClick
                }
                disabled={
                  isProcessingPayment ||
                  isLoadingRates ||
                  (selectedPayment === "SOL" && walletBalance < tokenAmount) ||
                  (selectedPayment === "USDC" && walletBalance < tokenAmount) ||
                  (selectedPayment === "NRG" && walletBalance < tokenAmount)
                }
              >
                {isProcessingPayment && (
                  <div className="absolute inset-0 bg-[#E9423A] bg-opacity-80 flex items-center justify-center z-20 rounded">
                    <Spinner size="lg" color="white" />
                  </div>
                )}
                <span
                  className={`${
                    isProcessingPayment ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {isAuthenticated
                    ? connected
                      ? "Complete Payment"
                      : web3AuthWalletInfo
                      ? "Complete Payment"
                      : "Select Wallet"
                    : "Login to Continue"}
                </span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Toast notifications */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded shadow-lg flex items-start gap-3 transition-all duration-300 animate-slideIn max-w-xs ${
                toast.type === "success"
                  ? "bg-green-500/90 text-white"
                  : toast.type === "danger"
                  ? "bg-red-500/90 text-white"
                  : toast.type === "primary"
                  ? "bg-blue-500/90 text-white"
                  : "bg-black/80 text-white"
              }`}
              style={{ animationDuration: "200ms" }}
            >
              <div className="flex-1">
                {toast.title && (
                  <h4 className="font-medium text-sm mb-1">{toast.title}</h4>
                )}
                {toast.description && (
                  <p className="text-xs opacity-90">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
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
      `}</style>
    </FormContainer>
  );
}
