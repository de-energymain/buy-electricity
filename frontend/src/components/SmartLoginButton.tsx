import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { LogIn, LayoutDashboard } from "lucide-react";

// Import wallet components
import { useWallet } from '@solana/wallet-adapter-react';

// This would be imported if using Torus
// import Torus from "@toruslabs/solana-embed";

/**
 * A smart login button that:
 * 1. Shows "Login" if user is not connected via wallet or Torus
 * 2. Shows "Dashboard" if user is already connected
 */
function SmartLoginButton() {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const [isTorusConnected, setIsTorusConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is connected with Torus
  useEffect(() => {
    const checkTorusConnection = async () => {
      try {
        // In actual implementation, you would check local storage or
        // initialize a Torus instance and check if user is logged in
        
        // Example with Torus:
        // const torus = new Torus();
        // await torus.init({ ... });
        // const isLoggedIn = await torus.isLoggedIn();
        // setIsTorusConnected(isLoggedIn);
        
        // For now, let's check if there's a Torus public key in localStorage
        const torusPublicKey = localStorage.getItem('torusPublicKey');
        setIsTorusConnected(!!torusPublicKey);
      } catch (error) {
        console.error("Error checking Torus connection:", error);
        setIsTorusConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTorusConnection();
  }, []);

  // Determine if user is connected with either method
  const isUserConnected = connected || isTorusConnected;

  // Navigate to appropriate page
  const handleClick = () => {
    if (isUserConnected) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  // Don't show anything while checking connection status
  if (isLoading) {
    return null;
  }

  return (
    <Button
      className={`
        ${isUserConnected ? 'bg-[#2A3A1A] text-white' : 'bg-transparent text-white border border-white'} 
        hover:bg-[#333333]
      `}
      size="sm"
      onPress={handleClick}
      startContent={isUserConnected ? <LayoutDashboard size={16} /> : <LogIn size={16} />}
    >
      {isUserConnected ? "Dashboard" : "Login"}
    </Button>
  );
}

export default SmartLoginButton;