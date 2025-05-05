import React, { ReactNode } from 'react';
import { motion } from "framer-motion";
import logoBlack from "../assets/logo-black.png";

// Background watermark component that can be reused across forms
export const BackgroundWatermark: React.FC = () => (
  <div 
    className="absolute right-0 bottom-0 w-full h-full pointer-events-none"
    style={{
      backgroundImage: `url(${logoBlack})`,
      backgroundPosition: 'bottom right',
      backgroundSize: '80%',
      backgroundRepeat: 'no-repeat',
      opacity: 0.8,
      filter: 'grayscale(100%)'
    }}
  />
);

// Animation variants for page transitions
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 }
};

// Animation variants for form elements
export const formElementTransition = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 }
};

// Types for the FormContainer props
interface FormContainerProps {
  children: ReactNode;
}

// Common container for all forms
export const FormContainer: React.FC<FormContainerProps> = ({ children }) => (
  <motion.div 
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
    className="w-full md:w-1/2 p-4 md:p-6 flex flex-col items-center relative h-screen overflow-y-auto"
    style={{
      background: "linear-gradient(to bottom, #202020, #000000)",
    }}
  >
    <BackgroundWatermark />
    {children}
  </motion.div>
);
// Common input styling
export const inputClasses = {
  input: "bg-[#3A3A3A] text-white placeholder:text-[#E2E2E2] rounded-none",
  inputWrapper: "bg-[#3A3A3A] border border-gray-600 border-opacity-50 rounded-none",
  errorMessage: "text-red-500"
};

// Common select styling
export const selectClasses = {
  trigger: "bg-[#333333] border border-gray-600 border-opacity-50 text-white rounded-none",
  value: "text-white !text-white rounded",
  popoverContent: "bg-[#333333] text-[#E2E2E2]",
};

// Common card styling
export const cardClasses = "max-w-md w-full shadow-sm bg-[#2F2F2F] border-none relative z-10";

// Common button styling
export const primaryButtonClasses = "w-full bg-[#E9423A] text-white";
export const secondaryButtonClasses = "bg-transparent text-white hover:bg-gray-600";