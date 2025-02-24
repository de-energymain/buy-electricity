import "./app.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Image from "./pages/personal/Image";
import ElectricityEstimateForm from "./pages/personal/ElectricityEstimateForm";
import ByPanelsForm from "./pages/personal/ByPanelsForm";
import ContactForm from "./pages/personal/ContactForm";
import BusinessContactForm from "./pages/business/BusinessContactForm";

function App() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Router>
        {/* Image component is placed outside Routes so it's always visible */}
        <Image />
        <Routes>
          <Route path="/" element={<ElectricityEstimateForm />} />
          <Route path="/by-panels" element={<ByPanelsForm />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route
            path="/business-contact"
            element={<BusinessContactForm />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
