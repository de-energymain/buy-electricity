import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, FC, ComponentType } from "react";
import Image from "./pages/personal/Image";
import ElectricityEstimateForm from "./pages/personal/ElectricityEstimateForm";
import ByPanelsForm from "./pages/personal/ByPanelsForm";
import ContactForm from "./pages/personal/ContactForm";
import BusinessContactForm from "./pages/business/BusinessContactForm";
import { SolanaWalletProvider } from "./components/WalletProvider";

// Import purchase flow pages
import PanelSelectionPage from "./pages/purchase/PanelSelectionPage";
import PaymentMethodPage from "./pages/purchase/PaymentMethodPage";
import PaymentSuccessPage from "./pages/purchase/PaymentSuccessPage";

// Import auth pages
import Login from "./pages/auth/login";

// Import dashboard pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import PanelsPage from "./pages/dashboard/PanelsPage";
import TransactionsPage from "./pages/dashboard/TransactionsPage";
import WalletPage from "./pages/dashboard/WalletPage";
import MarketplacePage from "./pages/dashboard/MarketplacePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import HelpPage from "./pages/dashboard/HelpPage";
import NodeDetailsPage from "./pages/dashboard/NodeDetailsPage";

// Simple authentication check helper
const isAuthenticated = () => {
  // Check for wallet connection
  const walletConnected = localStorage.getItem("walletConnected") === "true";
  
  // Check for Torus session
  const torusSession = localStorage.getItem("torusSession");
  
  // Return true if either is present
  return walletConnected || !!torusSession;
};

interface RouteProps {
  component: ComponentType;
}

// Auth Route component - redirects to dashboard if already logged in
const AuthRoute: FC<RouteProps> = ({ component: Component }) => {
  // Use state to track auth status and avoid redirecting during render
  const [auth, setAuth] = useState({
    checked: false,
    authenticated: false
  });
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      setAuth({
        checked: true,
        authenticated: isAuthenticated()
      });
    };
    
    // Slight delay to ensure localStorage is up to date
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Wait until check is complete
  if (!auth.checked) {
    return null; // Return nothing while checking
  }
  
  // If authenticated, redirect to dashboard
  if (auth.authenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  // Otherwise render the login page with the Image component
  return (
    <>
      <Image />
      <Component />
    </>
  );
};

// Protected Route component - requires authentication
const ProtectedRoute: FC<RouteProps> = ({ component: Component }) => {
  // Use state to track auth status and avoid redirecting during render
  const [auth, setAuth] = useState({
    checked: false,
    authenticated: false
  });
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      setAuth({
        checked: true,
        authenticated: isAuthenticated()
      });
    };
    
    // Slight delay to ensure localStorage is up to date
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Wait until check is complete
  if (!auth.checked) {
    return null; // Return nothing while checking
  }
  
  // If not authenticated, redirect to login
  if (!auth.authenticated) {
    return <Navigate to="/login" />;
  }
  
  // Otherwise render the dashboard component
  return <Component />;
};

function App() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <SolanaWalletProvider>
        <Router>
          <Routes>
            {/* Authentication Routes - redirects to dashboard if already logged in */}
            <Route
              path="/login"
              element={<AuthRoute component={Login} />}
            />
            
            {/* Dashboard Routes (No Image component) - all protected */}
            <Route path="/dashboard" element={<ProtectedRoute component={DashboardPage} />} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute component={AnalyticsPage} />} />
            <Route path="/dashboard/panels" element={<ProtectedRoute component={PanelsPage} />} />
            <Route path="/dashboard/transactions" element={<ProtectedRoute component={TransactionsPage} />} />
            <Route path="/dashboard/wallet" element={<ProtectedRoute component={WalletPage} />} />
            <Route path="/dashboard/marketplace" element={<ProtectedRoute component={MarketplacePage} />} />
            <Route path="/dashboard/settings" element={<ProtectedRoute component={SettingsPage} />} />
            <Route path="/dashboard/help" element={<ProtectedRoute component={HelpPage} />} />
            <Route path="/dashboard/node/:nodeId" element={<ProtectedRoute component={NodeDetailsPage} />} />
            
            {/* Purchase Flow Routes (with Image component) */}
            <Route
              path="/panel-selection"
              element={
                <>
                  <Image />
                  <PanelSelectionPage />
                </>
              }
            />
            <Route
              path="/payment"
              element={
                <>
                  <Image />
                  <PaymentMethodPage />
                </>
              }
            />
            <Route
              path="/payment-success"
              element={
                <>
                  <Image />
                  <PaymentSuccessPage />
                </>
              }
            />
            
            {/* Other Routes with Image component */}
            <Route
              path="/"
              element={
                <>
                  <Image />
                  <ElectricityEstimateForm />
                </>
              }
            />
            <Route
              path="/by-panels"
              element={
                <>
                  <Image />
                  <ByPanelsForm />
                </>
              }
            />
            <Route
              path="/contact"
              element={
                <>
                  <Image />
                  <ContactForm />
                </>
              }
            />
            <Route
              path="/business-contact"
              element={
                <>
                  <Image />
                  <BusinessContactForm />
                </>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SolanaWalletProvider>
    </div>
  );
}

export default App;