import Image from "next/image";
import Navbar from "../../Components/Navbar";


const AboutSection = () => {
  return (
    <section className="relative bg-gray-100 p-10">
      <div className="container mx-auto flex flex-col lg:flex-row items-center">
        {/* Left Image Section */}
        <div className="lg:w-1/2">
          <div className="relative rounded-lg overflow-hidden">
          <Image
  src="/images/beautiful-athletic-sportswear-girl-training-gym-with-friend_1157-13781.jpg" 
  alt="FitSync Pro"
  width={500}
  height={500}
  className="rounded-lg"
/>
          </div>
        </div>

        {/* Right Text Section */}
        <div className="lg:w-1/2 mt-6 lg:mt-0 lg:pl-12">
          <h3 className="text-red-600 font-bold text-lg uppercase relative inline-block">
            Who We Are
            <span className="absolute bottom-0 left-0 w-full h-1 bg-red-600"></span>
          </h3>
          <h2 className="text-3xl font-bold mt-2">
            We Will Give You Strength and Health
          </h2>
          <p className="text-gray-600 mt-4">
            Transforming bodies, building strength, and redefining fitness. A
            legacy of power, endurance, and innovation that stands the test of
            time.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
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

      {/* Bottom Statistics Section */}
      <div className="flex justify-center mt-12 space-x-10">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto border-4 border-red-600 rounded-full overflow-hidden">
            <Image
              src="/images/trainers.jpg" // Replace with trainer image
              alt="Trainers"
              width={96}
              height={96}
              className="rounded-full"
            />
          </div>
          <h3 className="text-xl font-bold mt-2">13+</h3>
          <p className="text-gray-600">Trainers</p>
        </div>

        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto border-4 border-red-600 rounded-full overflow-hidden">
            <Image
              src="/images/members.jpg" // Replace with members image
              alt="Members"
              width={96}
              height={96}
              className="rounded-full"
            />
          </div>
          <h3 className="text-xl font-bold mt-2">50+</h3>
          <p className="text-gray-600">Members</p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
