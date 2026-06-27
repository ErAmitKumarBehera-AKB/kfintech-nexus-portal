import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => {

    const quotes = [
  {
    text: "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    text: "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Ben Graham",
  },
  {
    text: "Know what you own, and know why you own it.",
    author: "Peter Lynch",
  },
  {
    text: "Invest for the long haul. Don’t get too greedy and don’t get too scared.",
    author: "Shelby M.C. Davis",
  },
];

const [currentQuote, setCurrentQuote] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentQuote((prev) => (prev + 1) % quotes.length);
  }, 4000);

  return () => clearInterval(timer);
}, []);

  return (
    <section className="shapedividers_com-9723 relative min-h-screen bg-gradient-to-r from-[#0A0F1C] via-[#102348] to-[#1E4E8C]">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/*left item */}
          <div>
            <p className="uppercase tracking-[4px] text-blue-300 font-semibold mb-4">
              Investor Service Management Platform
            </p>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Investor Service Request Management Portal
            </h1>

            <p className="text-slate-200 text-lg leading-8 mb-8 max-w-xl">
              Streamline investor service requests with real-time tracking,
              SLA monitoring, secure workflows and seamless communication
              between investors and administrators.
            </p>

            <div className="flex gap-4">

  <Link to="/register">
    <button
      className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold
      transition-all duration-300 ease-in-out
      hover:bg-blue-500 hover:text-white
      hover:scale-105 hover:-translate-y-1
      hover:shadow-[0_10px_25px_rgba(59,130,246,0.45)]
      active:scale-95"
    >
      Sign Up
    </button>
  </Link>

  <Link to="/login">
    <button
      className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold
      transition-all duration-300 ease-in-out
      hover:bg-white hover:text-blue-700
      hover:scale-105 hover:-translate-y-1
      hover:shadow-[0_10px_25px_rgba(255,255,255,0.25)]
      active:scale-95"
    >
      Sign In
    </button>
  </Link>

</div>
          </div>

          {/*right Image */}
          <div className="flex flex-col items-center">
  <img
    src="/Hero.jpeg"
    alt="Investor Portal"
    className="rounded-2xl shadow-2xl max-h-[500px] object-cover"
  />

  <div className="quote-card mt-6">
    <p className="quote-text">
      "{quotes[currentQuote].text}"
    </p>

    <h4 className="quote-author">
      — {quotes[currentQuote].author}
    </h4>
  </div>
</div>
        </div>
      </div>

      {/*wave */}
      {/* Wave */}
<div className="custom-shape-divider-bottom-1782329069">
  <svg
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
  >
    <path
      d="M321.39,56.44c58-10.79,114.16-30.13,
      172-41.86,82.39-16.72,168.19-17.73,
      250.45-.39C823.78,31,906.67,72,
      985.66,92.83c70.05,18.48,146.53,
      26.09,214.34,3V0H0V27.35A600.21,
      600.21,0,0,0,321.39,56.44Z"
      className="shape-fill"
    />
  </svg>
</div>
    </section>
  );
};

export default Hero;