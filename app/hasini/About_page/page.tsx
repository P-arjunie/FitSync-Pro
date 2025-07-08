import Image from "next/image";
import Navbar from "@/Components/Navbar";
import Footer1 from '@/Components/Footer_01';

const AboutVisionMission = () => {
  return (
    <div>
      <Navbar />
      {/* About Section */}
      <section className="relative bg-gray-100 p-10">
        <div className="container mx-auto flex flex-col lg:flex-row items-center">
          
          {/* Left Image */}
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <div className="relative w-full h-full">
              <Image
                src="/AboutIImg_1.jpg"
                alt="FitSync Pro"
                width={600}
                height={500}
                className="rounded-lg shadow-lg object-cover w-full"
              />
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:w-1/2 lg:pl-12">
            <h3 className="text-red-600 font-bold text-lg uppercase relative inline-block mb-2">
              Who We Are
              <span className="absolute bottom-0 left-0 w-full h-1 bg-red-600"></span>
            </h3>
            <h2 className="text-3xl font-bold text-gray-800">
              We Will Give You Strength and Health
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Transforming bodies, building strength, and redefining fitness. A
              legacy of power, endurance, and innovation that stands the test of
              time.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 text-base">
              <li>✔ FitSyncPro is an innovative fitness platform</li>
              <li>✔ Personalized training plans for every fitness level</li>
              <li>✔ Community-driven approach for motivation</li>
              <li>✔ Cutting-edge tech integrated into your workouts</li>
            </ul>
            <button className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
              Contact Us
            </button>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex justify-center mt-8 gap-16">
          
          {/* Trainer */}
          <div className="text-center">
            <div className="w-28 h-28 mx-auto border-4 border-red-600 rounded-full p-3">
              <Image
                src="/AboutImg_2.jpg"
                alt="Trainers"
                width={9999}
                height={9999}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h3 className="text-xl font-bold mt-2 text-gray-800">13+</h3>
            <p className="text-gray-600">Trainers</p>
          </div>

          {/* Member */}
          <div className="text-center">
            <div className="w-28 h-28 mx-auto border-4 border-red-600 rounded-full p-3">
              <Image
                src="/AboutImg_3.jpg"
                alt="Members"
                width={9999}
                height={9999}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h3 className="text-xl font-bold mt-2 text-gray-800">50+</h3>
            <p className="text-gray-600">Members</p>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="relative bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-16">
        <div className="container mx-auto flex flex-col gap-16 relative"> {/* Reduced gap from 32 to 16 */}

          {/* Vertical Red Line (between images) */}
          <div className="hidden lg:block absolute left-1/2 top-[110px] bottom-[110px] transform -translate-x-1/2 w-1 bg-red-600 z-0"></div>

          {/* Vision Section */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Vision Text */}
            <div className="lg:w-1/2 text-center space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Image src="/AboutIcon_1.png" alt="Vision Icon" width={80} height={80} />
                <h2 className="text-5xl font-bold text-black">OUR VISION</h2>
              </div>
              <p className="text-xl text-gray-800 leading-relaxed">
                Built on passion and dedication, FitSyncPro has grown into a premier fitness destination.
                From humble beginnings to a cutting-edge training facility, we continue to inspire strength,
                endurance, and transformation for all.
              </p>
            </div>

            {/* Vision Image */}
            <div className="lg:w-1/2 z-10">
              <Image
                src="/AboutImg_4.jpg"
                alt="Vision Image"
                width={500}
                height={350}
                className="rounded-xl object-cover w-full h-auto"
              />
            </div>
          </div>

          {/* Mission Section */}
          <div className="relative z-10 flex flex-col lg:flex-row-reverse items-center justify-between gap-8">
            
            {/* Mission Text */}
            <div className="lg:w-1/2 text-center space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Image src="/AboutIcon_2.png" alt="Mission Icon" width={80} height={80} />
                <h2 className="text-5xl font-bold text-black">OUR MISSION</h2>
              </div>
              <p className="text-xl text-gray-800 leading-relaxed">
                Empowering individuals to achieve their fitness goals through innovation, dedication, and a 
                commitment to excellence. We strive to create a motivating environment that fosters strength, 
                health, and well-being for everyone.
              </p>
            </div>

            {/* Mission Image */}
            <div className="lg:w-1/2 z-10">
              <Image
                src="/AboutImg_5.jpg"
                alt="Mission Image"
                width={500}
                height={350}
                className="rounded-xl object-cover w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      <Footer1 />
    </div>
  );
};

export default AboutVisionMission;
