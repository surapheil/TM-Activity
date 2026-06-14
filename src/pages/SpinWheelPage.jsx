import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

  // ── LOAD FROM LOCALSTORAGE (unchanged from original) ──────────────────────
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

  // ── BUILD SLICES: one per prize + one No Win ──────────────────────────────
  // Each slice gets startFrac/endFrac (0..1) proportional to qty.
  // This is the ONLY place slices are built — both draw and readPointer use it.
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

  // ── READ POINTER: what slice is at the top of the wheel right now? ────────
  // Pointer is at 12-o'clock (top). When wheel has rotated by `deg` degrees,
  // the fraction of the wheel sitting under the pointer is:
  //   ((-deg) mod 360 + 360) mod 360  /  360
  // Find which slice owns that fraction.
  function readPointer(slices, deg) {
    const normalized = ((-deg % 360) + 360) % 360;
    const frac = normalized / 360;
    for (const sl of slices) {
      if (frac >= sl.startFrac && frac < sl.endFrac) return sl;
    }
    return slices[slices.length - 1]; // floating-point safety
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
      // Convert fraction to canvas angle.
      // Canvas 0 = 3-o'clock; subtract 90° to put slice 0 at 12-o'clock; add deg for rotation.
      const toRad = (f) => (f * 360 + deg - 90) * (Math.PI / 180);
      const a0 = toRad(sl.startFrac);
      const a1 = toRad(sl.endFrac);
      const am = toRad(sl.midFrac);

      // Slice fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sl.bg;
      ctx.fill();
      ctx.strokeStyle = "#00000044";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Label — rotated along the spoke
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

    // Outer gold rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // Inner shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = "#00000022";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── SPIN ──────────────────────────────────────────────────────────────────
  // No winner pre-picking. Just spin a random amount, stop, then READ the pointer.
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

      // ── Wheel stopped: read pointer position as the authoritative result ──
      wheelDegRef.current = finalDeg;
      drawWheel(finalDeg);

      const slices = buildSlices(campaign);
      const result = readPointer(slices, finalDeg);
      const spinId = Date.now() + "_" + Math.random();
      setSpinning(false);
      setWinner({ label: result.label, isNoWin: result.isNoWin });
    
      if (!result.isNoWin) {
        //updateInventory(result.label);

        // ⛔ WAIT: redirect to registration
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

  // ── UPDATE INVENTORY (same logic as original) ─────────────────────────────
  const updateInventory = (prizeName) => {
    const updated = campaign
      .map((item) =>
        item.name === prizeName ? { ...item, qty: item.qty - 1 } : item
      )
      .filter((item) => item.qty > 0);

    setCampaign(updated);
    localStorage.setItem(`campaign_${id}`, JSON.stringify(updated));
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6 gap-4">

      {/* Title */}
      <h1 className="text-2xl font-bold text-yellow-400">Spin Wheel</h1>
      <p className="text-gray-400">{outlet?.name}</p>

      {/* Wheel */}
      <div className="relative w-[300px] h-[300px]">

        {/* Pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{
            top: "-14px",
            width: 0,
            height: 0,
            borderLeft: "11px solid transparent",
            borderRight: "11px solid transparent",
            borderBottom: "24px solid #d4af37",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full"
          style={{ border: "3px solid #B8860B", boxShadow: "0 0 0 2px #d4af3744" }}
        />

        {/* Center cap */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                     w-12 h-12 rounded-full bg-black flex items-center justify-center
                     text-yellow-400 text-lg font-bold"
          style={{ border: "2.5px solid #d4af37" }}
        >
          ✦
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-3 rounded-xl font-bold text-base text-black disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #d4af37, #f5e17a, #b8860b)",
          boxShadow: "0 4px 16px #d4af3740",
        }}
      >
        {spinning ? "Spinning…" : "SPIN"}
      </button>

      {/* Result */}
      {winner && (
        <div className="w-full max-w-[300px]">
          {winner.isNoWin ? (
            <div className="text-center py-3 px-5 rounded-xl font-medium text-red-300 bg-red-950 border border-red-800">
              😬 No luck this time — try again!
            </div>
          ) : (
            <div className="text-center py-3 px-5 rounded-xl font-medium text-green-300 bg-green-950 border border-green-800">
              🎉 Winner: {winner.label}!
            </div>
          )}
        </div>
      )}

      {/* Inventory */}
      <div className="w-full max-w-[300px]">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Remaining Prizes
        </p>
        {campaign.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-3">All prizes claimed!</p>
        ) : (
          campaign.map((item, i) => {
            const total = campaign.reduce((s, x) => s + x.qty, 0) + 2;
            const pct = Math.round((item.qty / total) * 100);
            return (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-900 p-2 px-3 rounded-lg mb-2 border border-gray-800"
              >
                <span className="text-sm text-white">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{pct}%</span>
                  <span className="text-xs font-medium text-yellow-500 bg-yellow-950 px-2 py-0.5 rounded-full">
                    ×{item.qty}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}