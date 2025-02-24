import image from "../../assets/image.png"

const Image = () => {
  return (
    <>
    <div className="hidden md:block w-full md:w-1/2 bg-black relative">
  <img
    src={image}
    alt="solar image"
    className="w-full h-full object-cover opacity-50"
  />
</div>


      {/* <div className="w-1/2 bg-gradient-to-br from-red-900 to-black flex items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-red-600/20 flex items-center justify-center">
            <div className="text-red-500 text-6xl font-bold">N</div>
          </div>
        </div>
        <div className="absolute w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-2 border-red-500/20"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full border-2 border-red-500/20"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full border-2 border-red-500/20"></div>
        </div>
      </div> */}
    </>
  );
};

export default Image;
