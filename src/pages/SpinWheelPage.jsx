import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Imported the assets from your Start Page
import logo from "../assets/21+Logo - Habesha - Horizontal.png";
import mandalaPattern from "../assets/Gemini_Generated_Image_hngu6uhngu6uhngu.png";

export default function SpinWheelPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const outlet = location.state?.outlet;

  const [campaign, setCampaign] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null); // { label, isNoWin }

  const canvasRef = useRef(null);
  const wheelDegRef = useRef(0); // cumulative rotation degrees

  // ── COLORS ────────────────────────────────────────────────────────────────
  const COLORS = [
    { bg: "#d4af37", fg: "#2a1f00" },
    { bg: "#1a1a1a", fg: "#e8e8e8" },
    { bg: "#8b6914", fg: "#fff3cc" },
    { bg: "#2e2e2e", fg: "#dddddd" },
    { bg: "#c9a227", fg: "#2a1f00" },
    { bg: "#141414", fg: "#cccccc" },
    { bg: "#4a3800", fg: "#ffd966" },
    { bg: "#383838", fg: "#eeeeee" },
  ];
  const NO_WIN_COLOR = { bg: "#7a0000", fg: "#ffbbbb" };

  // ── LOAD FROM LOCALSTORAGE ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(`campaign_${id}`);
    if (!saved) {
      alert("No campaign found");
      navigate("/home");
      return;
    }
    const parsed = JSON.parse(saved);
    setCampaign(parsed);
  }, []);

  // ── DRAW whenever campaign or wheelDeg changes ────────────────────────────
  useEffect(() => {
    if (campaign.length > 0) drawWheel(wheelDegRef.current);
  }, [campaign]);

  // ── BUILD SLICES ──────────────────────────────────────────────────────────
  function buildSlices(items) {
    const all = [
      ...items.map((x, i) => ({ ...x, colorIdx: i, isNoWin: false })),
      { name: "No Win", qty: 2, colorIdx: -1, isNoWin: true },
    ];
    const total = all.reduce((s, x) => s + x.qty, 0);
    const slices = [];
    let acc = 0;
    all.forEach((item) => {
      const frac = item.qty / total;
      slices.push({
        label: item.name,
        qty: item.qty,
        startFrac: acc,
        endFrac: acc + frac,
        midFrac: acc + frac / 2,
        isNoWin: item.isNoWin,
        ...(item.isNoWin
          ? NO_WIN_COLOR
          : COLORS[item.colorIdx % COLORS.length]),
      });
      acc += frac;
    });
    return slices;
  }

  // ── READ POINTER ──────────────────────────────────────────────────────────
  function readPointer(slices, deg) {
    const normalized = ((-deg % 360) + 360) % 360;
    const frac = normalized / 360;
    for (const sl of slices) {
      if (frac >= sl.startFrac && frac < sl.endFrac) return sl;
    }
    return slices[slices.length - 1];
  }

  // ── DRAW WHEEL ────────────────────────────────────────────────────────────
  function drawWheel(deg) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 150, cy = 150, r = 147;
    ctx.clearRect(0, 0, 300, 300);

    const slices = buildSlices(campaign);
    if (slices.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.clip();

    slices.forEach((sl) => {
      const toRad = (f) => (f * 360 + deg - 90) * (Math.PI / 180);
      const a0 = toRad(sl.startFrac);
      const a1 = toRad(sl.endFrac);
      const am = toRad(sl.midFrac);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sl.bg;
      ctx.fill();
      ctx.strokeStyle = "#00000044";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      const lr = r * 0.6;
      ctx.save();
      ctx.translate(cx + Math.cos(am) * lr, cy + Math.sin(am) * lr);
      ctx.rotate(am + Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const sweepRad = (sl.endFrac - sl.startFrac) * 2 * Math.PI;
      const fs = Math.min(11, Math.max(7, (lr * sweepRad) / sl.label.length * 0.85));
      ctx.font = `500 ${fs}px sans-serif`;
      ctx.fillStyle = sl.fg;
      ctx.shadowColor = "#0008";
      ctx.shadowBlur = 3;
      let txt = sl.label;
      const maxW = lr * 0.85;
      if (ctx.measureText(txt).width > maxW) {
        while (txt.length > 2 && ctx.measureText(txt + "…").width > maxW)
          txt = txt.slice(0, -1);
        txt += "…";
      }
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "#00000022";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── SPIN ──────────────────────────────────────────────────────────────────
  const spin = () => {
    if (spinning || campaign.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const extraDeg = 360 * 5 + Math.random() * 360 * 3 + Math.random() * 360;
    const finalDeg = wheelDegRef.current + extraDeg;
    const startDeg = wheelDegRef.current;
    const startTime = performance.now();
    const duration = 4500;

    const easeOut = (t) => 1 - Math.pow(1 - t, 4.5);

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const current = startDeg + (finalDeg - startDeg) * easeOut(t);
      wheelDegRef.current = current;
      drawWheel(current);

      if (t < 1) {
        requestAnimationFrame(animate);
        return;
      }

      wheelDegRef.current = finalDeg;
      drawWheel(finalDeg);

      const slices = buildSlices(campaign);
      const result = readPointer(slices, finalDeg);
      setSpinning(false);
      setWinner({ label: result.label, isNoWin: result.isNoWin });
    
      if (!result.isNoWin) {
        setTimeout(() => {
          navigate("/winner-register", {
            state: {
              outlet,
              prize: result.label,
              outletId: id
            }
          });
        }, 1200);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="relative h-screen max-w-md mx-auto overflow-hidden bg-black text-white flex flex-col">
      
      {/* ── BACKGROUND LAYER SYSTEM (z-0) ────────────────────────── */}
      <div className="absolute inset-0 bg-black z-0 pointer-events-none" />

      {/* Mandala Background Graphic */}
      <div
        className="absolute inset-x-0 top-0 h-[30vh] opacity-[0.06] z-0 pointer-events-none" 
        style={{
          backgroundImage: `url(${mandalaPattern})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center", 
          backgroundSize: "contain",
        }}
      />

      {/* Top Fading Overlays */}
      <div className="absolute inset-x-0 top-0 h-[30vh] bg-gradient-to-b from-transparent to-black z-0 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400/5 blur-[70px] z-0 pointer-events-none" />

      {/* ── INTERACTIVE CONTENT LAYER (z-10) ── */}
      <div className="relative z-10 flex flex-col h-full w-full">
        
        {/* COMPACT BRAND HEADER (Reduced paddings and margins dramatically) */}
        <div className="pt-3 px-6 flex-none flex flex-col items-center">
          <div className="relative mb-1">
            <div className="absolute inset-0 bg-yellow-400/10 blur-xl rounded-full" />
            <img
              src={logo}
              alt="Habesha Golden Wheel"
              className="relative w-24 object-contain" // Scaled down from w-36
            />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-black bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] bg-clip-text text-transparent uppercase tracking-wide">
              Lucky Spin
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-zinc-400 mt-0.5">
              Outlet: <span className="text-yellow-400 font-bold">{outlet?.name || "Unknown"}</span>
            </p>
          </div>
        </div>

        {/* MIDDLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col items-center gap-4 custom-scrollbar">

          {/* Wheel Assembly Container */}
          <div className="relative w-[300px] h-[300px] flex-none mt-1性能 z-20">
            
            {/* Top Marker Pin Pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30"
              style={{
                top: "-12px",
                width: 0,
                height: 0,
                borderLeft: "11px solid transparent",
                borderRight: "11px solid transparent",
                borderBottom: "24px solid #d4af37",
                filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))",
              }}
            />

            {/* Canvas Component */}
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="rounded-full relative z-10"
              style={{ border: "3px solid #B8860B", boxShadow: "0 0 0 2px #d4af3744" }}
            />

            {/* Center Axle Node */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                         w-12 h-12 rounded-full bg-black flex items-center justify-center
                         text-yellow-400 text-lg font-bold"
              style={{ border: "2.5px solid #d4af37", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              ✦
            </div>
          </div>

          {/* Alert/Result Toast Notifications */}
          {winner && (
            <div className="w-full max-w-[300px] flex-none animate-fade-in relative z-20">
              {winner.isNoWin ? (
                <div className="text-center py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-red-300 bg-red-950/90 backdrop-blur-sm border border-red-800">
                  😬 No luck this time — try again!
                </div>
              ) : (
                <div className="text-center py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-green-300 bg-green-950/90 backdrop-blur-sm border border-green-800">
                  🎉 Winner: {winner.label}!
                </div>
              )}
            </div>
          )}

          {/* Live Inventory Stock Tracker Section */}
          <div className="w-full max-w-[300px] flex-1 min-w-[300px] relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Remaining Prizes
            </p>
            <div className="space-y-1.5">
              {campaign.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs italic py-2">All prizes claimed!</p>
              ) : (
                campaign.map((item, i) => {
                  const total = campaign.reduce((s, x) => s + x.qty, 0) + 2;
                  const pct = Math.round((item.qty / total) * 100);
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-zinc-900/80 backdrop-blur-sm p-2 px-3 rounded-xl border border-zinc-800/60"
                    >
                      <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{pct}%</span>
                        <span className="text-[10px] font-extrabold text-yellow-400 bg-yellow-950/60 px-2 py-0.5 rounded-full border border-yellow-500/20">
                          ×{item.qty}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ACTION FOOTER BAR */}
        <div className="relative z-20 p-4 bg-gradient-to-t from-black via-black to-transparent flex-none">
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] text-black font-black tracking-widest text-xs shadow-[0_4px_20px_rgba(234,179,8,0.25)] active:scale-95 disabled:opacity-40 transition-all duration-200"
          >
            {spinning ? "SPINNING..." : "SPIN WHEEL"}
          </button>
        </div>

      </div>
    </div>
  );
}