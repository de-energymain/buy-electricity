import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Spinner
  } from "@nextui-org/react";
  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { ArrowLeft } from "lucide-react";
  import { motion } from "framer-motion";
  import logo from "../../assets/logo.svg";
  import { 
    FormContainer, 
    cardClasses,
    secondaryButtonClasses
  } from "../../shared/styles";
  
  // Import wallet components
  import { useWallet } from '@solana/wallet-adapter-react';
  import { useWalletModal } from '@solana/wallet-adapter-react-ui';
  import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
  
  // Import Torus - you need to install this package
  // npm install @toruslabs/solana-embed
  import Torus from "@toruslabs/solana-embed";
  
  // Google icon component
  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.76 10.2271C19.76 9.57656 19.7062 8.93156 19.5985 8.29761H10.24V12.0497H15.605C15.3919 13.2997 14.6946 14.3591 13.6485 15.0685V17.5771H16.8603C18.7576 15.8351 19.76 13.2726 19.76 10.2271Z" fill="#4285F4"/>
      <path d="M10.24 20C12.9128 20 15.1641 19.1045 16.8641 17.577L13.6523 15.0684C12.7538 15.6683 11.5908 16.0228 10.24 16.0228C7.59097 16.0228 5.33826 14.2616 4.59177 11.9001H1.26953V14.4911C3.00354 17.8592 6.39354 20 10.24 20Z" fill="#34A853"/>
      <path d="M4.58699 11.9001C4.14838 10.6683 4.14838 9.33663 4.58699 8.10481V5.5138H1.26974C-0.108951 8.33663 -0.108951 11.6683 1.26974 14.4911L4.58699 11.9001Z" fill="#FBBC04"/>
      <path d="M10.24 3.97727C11.6953 3.95909 13.0922 4.52272 14.1411 5.56136L16.9912 2.71136C15.1845 0.991363 12.7584 0.0504544 10.24 0.0681817C6.39355 0.0681817 3.00354 2.20909 1.26953 5.5818L4.58677 8.10477C5.33327 5.77727 7.59097 3.97727 10.24 3.97727Z" fill="#EA4335"/>
    </svg>
  );
  
  // Solana Wallet icon
  const SolanaIcon = () => (
    <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M93.96 42.2H23.3C21.5 42.2 20.7 40.3 22 39.3L34.1 30.5L40.2 26.1C41.3 25.3 42.7 25.3 43.9 26.1L93.96 63.4C95.76 64.7 95.76 67.3 93.96 68.6L43.9 105.9C42.7 106.7 41.3 106.7 40.1 105.9L34 101.4L22 92.7C20.7 91.7 21.5 89.8 23.3 89.8H93.96C97.16 89.8 99.86 87.1 99.86 83.9V48.1C99.76 44.9 97.06 42.2 93.96 42.2Z" fill="#FFFFFF"/>
    </svg>
  );
  
  interface TorusInstance {
    init: (config: any) => Promise<void>;
    login: (options: { verifier: string }) => Promise<void>;
    getUserInfo: () => Promise<any>;
    getPublicKey: () => Promise<any>;
    getProvider: () => Promise<any>;
    cleanUp: () => void;
  }
  
  function Login() {
    const navigate = useNavigate();
    const { connected, connecting, disconnect, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    
    const [torusInstance, setTorusInstance] = useState<TorusInstance | null>(null);
    const [isTorusInitializing, setIsTorusInitializing] = useState(true);
    const [isTorusLoggingIn, setIsTorusLoggingIn] = useState(false);
    const [torusError, setTorusError] = useState<string | null>(null);
    const [redirecting, setRedirecting] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
  
    // Check if already authenticated on load
    useEffect(() => {
      const checkAuth = () => {
        const walletConnected = localStorage.getItem("walletConnected") === "true";
        const torusSession = localStorage.getItem("torusSession");
        
        if (walletConnected || !!torusSession) {
          setRedirecting(true);
          navigate("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      };
      
      // Small delay to ensure localStorage is up to date
      const timer = setTimeout(checkAuth, 50);
      return () => clearTimeout(timer);
    }, [navigate]);
  
    // Initialize Torus when component mounts
    useEffect(() => {
      const initTorus = async () => {
        try {
          setIsTorusInitializing(true);
          
          // Create new Torus instance
          const torus = new Torus() as TorusInstance;
          
          // Initialize Torus with Solana devnet
          await torus.init({
            buildEnv: "production", // can be "production", "development", "staging", "testing"
            enableLogging: false,
            network: {
              //host: clusterApiUrl("devnet"), // Use mainnet in production
              chainId: "devnet", // Use "mainnet" in production
              networkName: "Solana Devnet",
            },
            showTorusButton: false, // Don't show the Torus button
            useWalletConnect: true,
            enabledVerifiers: {
              google: true, // Enable Google login
              // Add other verifiers as needed
              // facebook: true,
              // discord: true,
              // github: true,
            },
          });
          
          setTorusInstance(torus);
          setTorusError(null);
        } catch (error) {
          console.error("Failed to initialize Torus:", error);
          setTorusError(`Failed to initialize Google login: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setIsTorusInitializing(false);
        }
      };
  
      initTorus();
  
      // Cleanup Torus when component unmounts
      return () => {
        if (torusInstance) {
          try {
            torusInstance.cleanUp();
          } catch (error) {
            console.error("Error cleaning up Torus:", error);
          }
        }
      };
    }, []);
  
    // Handle connect with Solana wallet
    const handleConnectWallet = () => {
      if (connected) {
        // If already connected, disconnect
        disconnect();
        localStorage.setItem("walletConnected", "false");
      } else {
        // Show wallet selection modal
        setVisible(true);
      }
    };
  
    // Handle Google login via Torus
    const handleGoogleLogin = async () => {
      if (!torusInstance) {
        setTorusError("Google login is not initialized yet");
        return;
      }
      
      try {
        setIsTorusLoggingIn(true);
        setTorusError(null);
        
        // This will open the Google login popup and handle the OAuth flow
        await torusInstance.login({ verifier: "google" });
        
        // Get Torus user info
        const userInfo = await torusInstance.getUserInfo();
        console.log("Torus user info:", userInfo);
        
        // Get Solana public key from Torus
        const publicKey = await torusInstance.getPublicKey();
        console.log("Torus public key:", publicKey.toString());
        
        // Get Torus provider (can be used for transactions)
        const provider = await torusInstance.getProvider();
        console.log("Torus provider:", provider);
        
        // Store session data in localStorage
        const sessionData = {
          userInfo,
          publicKey: publicKey.toString(),
          timestamp: Date.now()
        };
        
        localStorage.setItem("torusSession", JSON.stringify(sessionData));
        
        // Set redirecting state to prevent multiple redirects
        setRedirecting(true);
        
        // Redirect to dashboard after successful login
        navigate("/dashboard");
      } catch (error) {
        console.error("Torus Google login failed:", error);
        setTorusError(`Google login failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsTorusLoggingIn(false);
      }
    };
  
    // Redirect to dashboard if connected with wallet
    useEffect(() => {
      if (connected && wallet && !redirecting) {
        // When wallet is connected, set the flag in localStorage
        localStorage.setItem("walletConnected", "true");
        
        // Set redirecting state to prevent multiple redirects
        setRedirecting(true);
        
        // Delay to show the connected state briefly
        const redirectTimer = setTimeout(() => {
          navigate("/dashboard");
        }, 500);
        
        return () => clearTimeout(redirectTimer);
      }
    }, [connected, wallet, navigate, redirecting]);
  
    const handleBack = () => {
      navigate(-1);
    };
  
    // Determine if any authentication process is in progress
    const isProcessing = isTorusLoggingIn || connecting || redirecting;
  
    // Show loading state while checking auth
    if (checkingAuth) {
      return (
        <FormContainer>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 mb-8">
              <img src={logo} alt="Renrg logo" />
            </div>
            <Spinner size="lg" color="danger" className="mb-4" />
            <p className="text-white text-lg">Loading...</p>
          </div>
        </FormContainer>
      );
    }
  
    // If already redirecting, show a loading state
    if (redirecting) {
      return (
        <FormContainer>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 mb-8">
              <img src={logo} alt="Renrg logo" />
            </div>
            <Spinner size="lg" color="danger" className="mb-4" />
            <p className="text-white text-lg">Redirecting to dashboard...</p>
          </div>
        </FormContainer>
      );
    }
  
    return (
      <FormContainer>
        {/* Logo */}
        <div className="flex justify-center relative z-10 mb-6">
          <div className="w-24">
            <img src={logo} alt="Renrg logo" />
          </div>
        </div>
  
        {/* Back Button */}
        <div className="max-w-md mx-auto w-full relative z-10">
          <Button
            className={`mb-4 ${secondaryButtonClasses}`}
            onPress={handleBack}
            startContent={<ArrowLeft size={20} />}
            disabled={isProcessing}
          >
            Back
          </Button>
  
          <Card className={cardClasses}>
            <CardHeader className="flex justify-center items-center flex-col">
              <div className="mt-3 p-4 bg-[#2F2F2F] rounded-lg shadow-inner w-full text-center">
                <h2 className="text-3xl font-bold text-white mb-2 font-electrolize">
                  Login
                </h2>
                <p className="text-sm text-white font-inter">
                  Connect your wallet or Google account
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-6 bg-[#2F2F2F]">
              <div className="space-y-8 relative">
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#2F2F2F] bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="lg" color="danger" className="mb-4" />
                    <p className="text-white">
                      {isTorusLoggingIn ? "Connecting with Google..." : connecting ? "Connecting wallet..." : "Processing..."}
                    </p>
                  </div>
                )}
                
                {/* Wallet Connection Section */}
                <div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      className={`w-full h-14 ${connected ? 'bg-[#2A3A1A] border-green-500' : 'bg-[#3A1A1A] border-[#E9423A]'} text-white border-2 hover:bg-[#4A2A2A] rounded-lg`}
                      disabled={connecting || isProcessing}
                      onPress={handleConnectWallet}
                      startContent={<SolanaIcon />}
                    >
                      {connecting ? (
                        <Spinner color="white" size="sm" />
                      ) : connected ? (
                        `Connected: ${wallet?.adapter?.name || "Wallet"}`
                      ) : (
                        "Connect Solana Wallet"
                      )}
                    </Button>
                  </motion.div>
                  
                  {connected && (
                    <p className="text-xs text-green-400 mt-2 text-center">
                      Wallet connected! Redirecting to dashboard...
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="h-px bg-gray-700 flex-1"></div>
                  <span className="text-gray-400 text-sm">OR</span>
                  <div className="h-px bg-gray-700 flex-1"></div>
                </div>
                
                {/* Google/Torus Login Section */}
                <div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-lg"
                      onPress={handleGoogleLogin}
                      disabled={isProcessing || isTorusInitializing || !torusInstance}
                      startContent={<GoogleIcon />}
                    >
                      {isTorusInitializing ? (
                        <Spinner color="default" size="sm" />
                      ) : (
                        "Continue with Google"
                      )}
                    </Button>
                  </motion.div>
                  
                  {isTorusInitializing && (
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                      Initializing Google login...
                    </p>
                  )}
                  
                  {torusError && (
                    <p className="text-xs text-red-400 mt-2 text-center">
                      {torusError}
                    </p>
                  )}
                </div>
                
                <p className="text-center text-sm text-gray-400">
                  By connecting, you agree to our{" "}
                  <a href="/terms" className="text-[#E9423A] hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-[#E9423A] hover:underline">Privacy Policy</a>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </FormContainer>
    );
  }
  
  export default Login;