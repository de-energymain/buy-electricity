import ElectricityEstimateForm from "./personal/ElectricityEstimateForm";
import Image from "./personal/Image";

function Home() {
  return (
    <div className="flex flex-col md:flex-col min-h-screen">
      <Image/>
      <ElectricityEstimateForm />
    </div>
  );
}


export default Home;
