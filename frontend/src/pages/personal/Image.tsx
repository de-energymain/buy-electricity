// // import React from 'react';
// // import video from "../../assets/video.mp4";

// // const VideoWithOverlay = () => {
// //   return (
// //     <div className="relative w-full md:w-1/2">
// //       {/* Video container */}
// //       <div className="w-full h-full bg-black">
// //         <video
// //           src={video}
// //           autoPlay
// //           loop
// //           muted
// //           className="w-full h-full object-cover opacity-50"
// //         />
// //       </div>
      
// //       {/* Overlays container - positioned absolutely over the video */}
// //       <div className="absolute inset-0 flex flex-wrap items-center justify-center">
// //         {/* Stats boxes - positioned strategically over the video */}
// //         <div className="absolute top-1/4 left-1/4 bg-black bg-opacity-70 p-3 rounded-lg text-white">
// //           <div className="text-2xl font-bold">100+</div>
// //           <div className="text-sm">Solar Assets</div>
// //         </div>
        
// //         <div className="absolute top-1/4 right-1/4 bg-black bg-opacity-70 p-3 rounded-lg text-white">
// //           <div className="text-2xl font-bold">&gt; 6k RECs</div>
// //           <div className="text-sm">(worth $67k)</div>
// //           <div className="text-xs">Environmental Commodities generated</div>
// //         </div>
        
// //         <div className="absolute bottom-1/4 left-1/4 bg-black bg-opacity-70 p-3 rounded-lg text-white">
// //           <div className="text-2xl font-bold">1GWh</div>
// //           <div className="text-sm">Power Production</div>
// //           <div className="text-xs">(Monthly)</div>
// //         </div>
        
// //         <div className="absolute bottom-1/3 right-1/3 bg-black bg-opacity-70 p-3 rounded-lg text-white">
// //           <div className="text-2xl font-bold">&gt; 11%</div>
// //           <div className="text-sm">IRR (USD)</div>
// //         </div>
        
// //         <div className="absolute bottom-1/4 right-1/4 bg-black bg-opacity-70 p-3 rounded-lg text-white">
// //           <div className="text-2xl font-bold">10+</div>
// //           <div className="text-sm">Countries</div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default VideoWithOverlay;

// import video from "../../assets/video.mp4";

// const Image = () => {
//   return (
//     <div className="relative w-full md:w-1/2 bg-black">
//       {/* Video element for the background */}
//       <video
//         className="w-full h-full object-cover opacity-50"
//         autoPlay
//         loop
//         muted
//         playsInline
//       >
//         <source src={video} type="video/mp4" />
//         Your browser does not support the video tag.
//       </video>

//       {/* Overlay for informational elements */}
//       <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8">
//         {/* Top-left: 100+ Solar Assets */}
//         <div className="bg-black bg-opacity-70 text-white p-2 rounded-md">
//           <span className="text-2xl font-bold">100+</span>
//           <br />
//           <span className="text-sm">Solar Assets</span>
//         </div>

//         {/* Bottom-left: 1GWh Power Production */}
//         <div className="bg-black bg-opacity-70 text-white p-2 rounded-md">
//           <span className="text-2xl font-bold">1GWh</span>
//           <br />
//           <span className="text-sm">Power Production (Monthly)</span>
//         </div>

//         {/* Top-right: >6K RECs */}
//         <div className="bg-black bg-opacity-70 text-white p-2 rounded-md self-end">
//           <span className="text-2xl font-bold">&gt;6K RECs</span>
//           <br />
//           <span className="text-sm">(worth $67k) Environmental Commodities generated</span>
//         </div>

//         {/* Bottom-right: 10+ Countries */}
//         <div className="bg-black bg-opacity-70 text-white p-2 rounded-md self-end">
//           <span className="text-2xl font-bold">10+</span>
//           <br />
//           <span className="text-sm">Countries</span>
//         </div>

//         {/* Center-right: >11% IRR USD */}
//         <div className="bg-black bg-opacity-70 text-white p-2 rounded-md self-end mt-16">
//           <span className="text-2xl font-bold">&gt;11%</span>
//           <br />
//           <span className="text-sm">IRR USD</span>
//         </div>
//       </div>
//     </div>
//   );
// };



// export default Image;

import video from "../../assets/video.mp4";

const ImpactSection = () => {
  return (
    <div className="relative w-full md:w-1/2 min-h-screen bg-black">
      {/* Header - "Our Impact" */}
    
      
      {/* Main content with video/earth and overlays */}
      <div className="relative w-full max-w-4xl aspect-square">
        {/* Video container */}
        <div className="w-full h-full">
          <video
            src={video}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Stat boxes - positioned exactly as in the reference */}
        <div className="absolute top-[15%] left-[20%] bg-black bg-opacity-80 p-4 border border-gray-800 rounded">
          <div className="text-3xl font-bold text-center text-white">100+</div>
          <div className="text-sm text-center text-gray-300">Solar Assets</div>
        </div>
        
        <div className="absolute top-[15%] right-[10%] bg-black bg-opacity-80 p-4 border border-gray-800 rounded">
          <div className="text-3xl font-bold text-white">&gt; 6k RECs</div>
          <div className="text-sm text-white">(worth $67k)</div>
          <div className="text-xs text-gray-300 mt-1">Environmental Commodities<br />generated</div>
        </div>
        
        <div className="absolute bottom-[15%] left-[15%] bg-black bg-opacity-80 p-4 border border-gray-800 rounded">
          <div className="text-3xl font-bold text-center text-white">1GWh</div>
          <div className="text-sm text-center text-gray-300">Power Production<br />(Monthly)</div>
        </div>
        
        <div className="absolute bottom-[15%] right-[20%] bg-black bg-opacity-80 p-4 border border-gray-800 rounded">
          <div className="text-3xl font-bold text-center text-white">&gt; 11%</div>
          <div className="text-sm text-center text-gray-300">IRR (USD)</div>
        </div>
        
        <div className="absolute right-[20%] top-[45%] bg-black bg-opacity-80 p-4 border border-gray-800 rounded">
          <div className="text-3xl font-bold text-center text-white">10+</div>
          <div className="text-sm text-center text-gray-300">Countries</div>
        </div>
      </div>
      
   
    </div>
  );
};

export default ImpactSection;
