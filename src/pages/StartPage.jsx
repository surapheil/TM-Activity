import { useNavigate } from "react-router-dom";
import logo from "../assets/21+Logo - Habesha - Vertical.png";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-black via-zinc-950 to-black text-white flex flex-col justify-between px-6 py-10 relative overflow-hidden">

      {/* Atmosphere Glow Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.08),transparent_60%)]" />

      {/* Floating Gold Blobs */}
      <div className="absolute w-72 h-72 bg-yellow-500/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-72 h-72 bg-yellow-600/10 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      {/* TOP SECTION */}
      <div className="flex flex-col items-center mt-8 z-10">

        {/* LOGO FRAME */}
        <div className="p-6 rounded-2xl bg-white/5 border border-yellow-500/20 backdrop-blur-md shadow-lg">
          <img
            src={logo}
            alt="Habesha Logo"
            className="w-44 md:w-52 object-contain"
          />
        </div>

        {/* BRAND TEXT */}
        <div className="mt-6 text-center">
          <h1 className="text-yellow-400 text-2xl md:text-3xl font-extrabold tracking-widest">
            HABESHA BEER
          </h1>

          <p className="text-gray-400 mt-2 text-sm tracking-wide">
            Trade Marketing Activation System
          </p>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="text-center z-10">
        <h2 className="text-white text-3xl md:text-4xl font-extrabold tracking-widest">
          SPIN & WIN
        </h2>

        <p className="text-gray-400 mt-3 text-sm leading-relaxed">
          Engage customers, collect data, and activate outlets with precision.
        </p>

        <p className="text-yellow-500/70 text-xs mt-4 tracking-wide">
          Select START to begin activation
        </p>
      </div>

      {/* START BUTTON */}
      <div className="z-10 mb-6">
        <button
          onClick={() => navigate("/login")}
          className="
            w-full py-4 rounded-2xl font-bold text-lg
            bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500
            text-black shadow-[0_0_25px_rgba(234,179,8,0.35)]
            active:scale-95 hover:scale-[1.02]
            transition-all duration-300
          "
        >
          START
        </button>

        <p className="text-center text-gray-500 text-xs mt-3">
          Powered by Trade Marketing Team
        </p>
      </div>
    </div>
  );
}