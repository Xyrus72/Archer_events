import { useState } from "react";
import SmoothScroll from "./SmoothScroll";
import Loader from "./components/Loader";
import Cursor from "./components/Cursor";
import CursorTrail from "./components/CursorTrail";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Showcase from "./components/Showcase";
import Footer from "./components/Footer";
import RegisterModal from "./components/RegisterModal";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <SmoothScroll>
      <Loader onDone={() => setStarted(true)} />
      <Cursor />
      <CursorTrail />
      <Nav />
      <main>
        <Hero started={started} />
        <Services />
        <Showcase />
      </main>
      <Footer />
      <RegisterModal />
      <div className="grain" />
    </SmoothScroll>
  );
}
