import Image from "next/image";
import Navbar from "@/app/Components/Navbar";
import Footer1 from "./Components/Footer_01";
import Footer2 from "./Components/Footer_02";

export default function Home() {
  return (
  <>
  <Navbar />
   <main>
    <h1>Hello world</h1>
    <Footer1/>
   </main>
  </>
  );
}
