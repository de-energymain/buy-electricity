import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Image from "./pages/personal/Image";
import ElectricityEstimateForm from "./pages/personal/ElectricityEstimateForm";
import ByPanelsForm from "./pages/personal/ByPanelsForm";
import ContactForm from "./pages/personal/ContactForm";
import BusinessContactForm from "./pages/business/BusinessContactForm";
import { SolanaWalletProvider } from "./components/WalletProvider";

// Import new components
import PanelSelectionPage from "./pages/purchase/PanelSelectionPage";
import PaymentMethodPage from "./pages/purchase/PaymentMethodPage";
import PaymentSuccessPage from "./pages/purchase/PaymentSuccessPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

function App() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <SolanaWalletProvider>
      <Router>
        <Routes>
          {/* Dashboard Routes (No Image component) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Purchase Flow Routes (Now with Image component) */}
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
        </Routes>
      </Router>
      </SolanaWalletProvider>
    </div>
  );
}

export default App;