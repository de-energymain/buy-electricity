// src/components/AuthRoute.tsx
import { ReactElement, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

interface AuthRouteProps {
  component: React.ComponentType;
}

/**
 * A component that redirects to the dashboard if a user is already authenticated
 * through Solana wallet or other login methods
 */
export const AuthRoute = ({ component: Component }: AuthRouteProps): ReactElement => {
  const navigate = useNavigate();
  const { connected } = useWallet();

  // We'll check for either Solana wallet connection or Torus login
  const isAuthenticated = (): boolean => {
    // Check if the wallet is connected
    if (connected) return true;

    // Check for Torus/Google login session
    // We can check localStorage or a session token set during Google login
    const torusSession = localStorage.getItem("torusSession");
    return !!torusSession;
  };

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [connected, navigate]);

  // If user is not authenticated, render the requested component (Login)
  return <Component />;
};

export default AuthRoute;