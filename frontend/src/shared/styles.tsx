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
      backgroundSize: '70%',
      backgroundRepeat: 'no-repeat',
      opacity: 0.5
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
    className="w-full md:w-1/2 bg-[#202020] p-6 md:p-12 flex flex-col items-center relative overflow-hidden"
  >
    <BackgroundWatermark />
    {children}
  </motion.div>
);

// Common input styling
export const inputClasses = {
  input: "bg-[#333333] text-white placeholder:text-[#E2E2E2]",
  inputWrapper: "bg-[#333333] border-2 border-[#E2E2E2]",
  errorMessage: "text-red-500"
};

// Common select styling
export const selectClasses = {
  trigger: "bg-[#333333] border-2 border-[#E2E2E2] text-white",
  value: "text-white !text-white",
  popoverContent: "bg-[#333333] text-[#E2E2E2]",
};

// Common card styling
export const cardClasses = "max-w-md w-full shadow-sm bg-[#202020] border-none relative z-10";

// Common button styling
export const primaryButtonClasses = "w-full bg-[#E9423A] text-white";
export const secondaryButtonClasses = "bg-transparent text-white hover:bg-gray-600";