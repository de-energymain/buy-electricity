import React from "react";
import video from "../../assets/video.mp4";

const ImpactSection = () => {
  return (
    <div className="relative w-full md:w-1/2 h-screen bg-black">
      {/* Full container for video */}
      <div className="absolute inset-0">
        {/* Video background - full size */}
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full"
          style={{ objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

export default ImpactSection;
