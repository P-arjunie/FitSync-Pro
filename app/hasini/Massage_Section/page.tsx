import Image from "next/image";
import Navbar from "../../Components/Navbar";

export default function ChatInterface() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-gray-800">
        <div className="flex flex-col text-sm">
          <p>Location: 4/1, Sapumal Place, Colombo</p>
          <p>Email: email@example.com</p>
        </div>
        <div className="flex flex-col text-sm">
          <p>Opening Hours: Mon - Sat: 8.00 am - 7.00 pm</p>
          <p>+94 71 278 1444</p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Left chat section */}
        <div className="w-1/3 bg-gray-800 p-4">
          {/* Search Client */}
          <input
            type="text"
            placeholder="Search Client"
            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
          />
          {/* Chat messages */}
          <div className="space-y-2">
            <div className="bg-gray-700 p-2 rounded">
              <p>Client 01</p>
              <p>Hello coach! Can't wait for our 1st session</p>
              <p className="text-xs text-gray-400">00:14</p>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <p>Client 01</p>
              <p>Ah! I'm so tired</p>
              <p className="text-xs text-gray-400">00:07</p>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <p>Client 01</p>
              <p>Still awake!</p>
              <p className="text-xs text-gray-400">00:05</p>
            </div>
          </div>
        </div>

        {/* Right section with background image */}
        <div className="flex-1 relative">
          <Image
            src="/path/to/gym-image.jpg"
            alt="Gym Background"
            layout="fill"
            objectFit="cover"
            className="opacity-80"
          />
          <div className="absolute bottom-4 left-4">
            <div className="bg-red-600 p-2 rounded">
              <p>Hello coach! Can't wait for our 1st session</p>
              <p className="text-xs text-white">00:14</p>
            </div>
            <div className="bg-black p-2 rounded mt-2">
              <p>Neither can I!</p>
              <p className="text-xs text-white">00:17</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 bg-gray-800">
        <input
          type="text"
          placeholder="Message"
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
      </div>
    </div>
  );
}
