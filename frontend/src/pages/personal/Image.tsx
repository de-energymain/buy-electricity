import video from "../../assets/video.mp4";

const ImpactSection = () => {
  return (
    <div className="relative w-full md:w-1/2 h-screen bg-black">
      {/* Full container for video and stats */}
      <div className="absolute inset-0">
        {/* Video background - full size */}
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full" style={{ objectFit: 'none' }}
        />
        
        {/* 100+ Solar Assets - left side */}
        <div className="absolute left-[5%] top-[40%] bg-black bg-opacity-80 p-4 rounded border border-[#585454]">
          <div className="text-4xl font-bold text-white">100+</div>
          <div className="text-lg text-gray-300">Solar Assets</div>
        </div>
        
        {/* > 6k RECs - top right */}
        <div className="absolute right-[5%] top-[20%] bg-black bg-opacity-80 p-4 rounded border border-[#585454]">
          <div className="text-4xl font-bold text-white">&gt; 6k RECs</div>
          <div className="text-lg text-white">(worth $67k)</div>
          <div className="text-sm text-gray-300 mt-1">Environmental Commodities</div>
          <div className="text-sm text-gray-300">generated</div>
        </div>
        
        {/* 10+ Countries - middle right */}
        <div className="absolute right-[5%] top-[50%] bg-black bg-opacity-80 p-4 rounded border border-[#585454]">
          <div className="text-4xl font-bold text-white">10+</div>
          <div className="text-lg text-gray-300">Countries</div>
        </div>
        
        {/* 1GWh - bottom left */}
        <div className="absolute left-[5%] bottom-[20%] bg-black bg-opacity-80 p-4 rounded border border-[#585454]">
          <div className="text-4xl font-bold text-white">1GWh</div>
          <div className="text-lg text-gray-300">Power Production</div>
          <div className="text-sm text-gray-300">(Monthly)</div>
        </div>
        
        {/* > 11% - bottom right */}
        <div className="absolute right-[20%] bottom-[15%] bg-black bg-opacity-80 p-4 rounded border border-[#585454]">
          <div className="text-4xl font-bold text-white">&gt; 11%</div>
          <div className="text-lg text-gray-300">IRR (USD)</div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSection;
