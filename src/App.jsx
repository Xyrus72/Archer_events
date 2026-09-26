import { lazy, Suspense, useState } from "react";
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

/* Three doors, chosen by path: the show, a guest's own pages, and the ticket office. */
const Admin = lazy(() => import("./components/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Account = lazy(() => import("./pages/Account"));
const Pay = lazy(() => import("./pages/Pay"));

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const PAGES = { "/login": Login, "/account": Account };
// /pay/<ref> is the checkout counter
const payRef = path.startsWith("/pay/") ? path.slice(5) : "";

export default function App() {
  const [started, setStarted] = useState(false);

  if (path === "/admin") {
    return (
      <Suspense fallback={<div className="min-h-svh bg-cream" />}>
        <Admin />
      </Suspense>
    );
  }

  // the guest pages wear the site's chrome, without the curtain and the film
  const Page = payRef ? Pay : PAGES[path];
  if (Page) {
    return (
      <>
        <Cursor />
        <CursorTrail />
        <Nav />
        <Suspense fallback={<div className="min-h-svh" />}>
          <Page />
        </Suspense>
        <Footer />
        <RegisterModal />
        <div className="poster-frame" aria-hidden="true" />
      </>
    );
  }

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
      <div className="poster-frame" aria-hidden="true" />
    </SmoothScroll>
  );
}
