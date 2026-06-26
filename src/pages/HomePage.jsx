import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FaPlus, FaStore, FaFileDownload } from "react-icons/fa"; 
import { getOutlets } from "../services/outletService";
import logo from "../assets/21+Logo - Habesha - Vertical.png";

// Import the PDF packages
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // Import it as a direct function

export default function HomePage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false); 

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Your exact Apps Script Web App URL
  const API_URL = "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`outlets_${user.id}`);
    if (cached) {
      setOutlets(JSON.parse(cached));
    }

    loadOutlets();
  }, [user]);

  async function loadOutlets() {
    try {
      const data = await getOutlets(user.id);
      setOutlets(data);
      localStorage.setItem(`outlets_${user.id}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load outlets:", error);
    } finally { // Fixed the syntax typo here from "finaly:" to "finally"
      setLoading(false);
    }
  }

  // // ── GENERATE PDF REPORT ───────────────────────────────────────────────────
  // const generatePDF = async () => {
  //   setDownloading(true);
  //   try {
  //     // 1. Fetch live winners data from Google Sheet targeting action
  //     const response = await fetch(`${API_URL}?action=getWinners`);
  //     const result = await response.json();

  //     if (!result.success) {
  //       alert("Error from server: " + (result.message || "Unknown error"));
  //       return;
  //     }

  //     if (!result.data || result.data.length === 0) {
  //       alert("No winner data found in the 'Winners' sheet tab.");
  //       return;
  //     }

  //     // 2. Initialize Portrait A4 Document
  //     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  //     // 3. Header Styling Banner
  //     doc.setFillColor(20, 20, 20); 
  //     doc.rect(0, 0, 210, 35, "F");
      
  //     // Premium Gold Accent Line
  //     doc.setFillColor(184, 137, 47);
  //     doc.rect(0, 35, 210, 1.5, "F");

  //     // Brand Title Text
  //     doc.setTextColor(212, 175, 55); 
  //     doc.setFont("helvetica", "bold");
  //     doc.setFontSize(22);
  //     doc.text("HABESHA SPIN WHEEL", 14, 18);

  //     doc.setTextColor(255, 255, 255);
  //     doc.setFontSize(10);
  //     doc.setFont("helvetica", "normal");
  //     doc.text("Official Activation Winners Report Summary", 14, 26);

  //     // 4. Map Rows to AutoTable arrays
  //     // Uses fallback keys matching standard App Script patterns
  //     const tableRows = result.data.map((winner, index) => [
  //       index + 1,
  //       winner.fullName || winner["fullName"] || winner["Full Name"] || "N/A",
  //       winner.phone || winner["phone"] || winner["Phone"] || "N/A",
  //       winner.prize || winner["prize"] || winner["Prize"] || "N/A",
  //       winner.outletName || winner["outletName"] || winner["Outlet Name"] || "N/A",
  //       winner.date || winner["date"] || winner["Date"] ? new Date(winner.date || winner["date"] || winner["Date"]).toLocaleDateString() : "N/A"
  //     ]);

  //     // 5. Inject Premium Styled Data Table
  //     // Change from: doc.autoTable({ ... })
  //     // Change to this:
  //       autoTable(doc, {
  //         startY: 45,
  //         head: [["#", "Winner Name", "Phone", "Prize Awarded", "Outlet", "Date"]],
  //         body: tableRows,
  //         headStyles: { fillColor: [184, 137, 47], textColor: [0, 0, 0], fontStyle: "bold" },
  //         alternateRowStyles: { fillColor: [248, 248, 248] },
  //         styles: { fontSize: 9, font: "helvetica" },
  //       });

  //     // 6. Direct Client-Side Download Trigger
  //     doc.save(`Spin_Wheel_Winners_${new Date().toISOString().split('T')[0]}.pdf`);

  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //     alert("Failed to download report. Please check your network or spreadsheet columns.");
  //   } finally {
  //     setDownloading(false);
  //   }
  // };


 const generatePDF = async () => {
  setDownloading(true);
  try {
    alert("Generating PDF with photos, this may take 20–30 seconds...");

    const response = await fetch(`${API_URL}?action=generatePDF`);
    const result   = await response.json();

    if (!result.success) {
      alert("Error: " + result.message);
      return;
    }

    // Convert base64 → blob → download
    const byteChars  = atob(result.pdf);
    const byteArrays = [];
    for (let i = 0; i < byteChars.length; i += 512) {
      const slice  = byteChars.slice(i, i + 512);
      const bytes  = new Uint8Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        bytes[j] = slice.charCodeAt(j);
      }
      byteArrays.push(bytes);
    }

    const pdfBlob = new Blob(byteArrays, { type: "application/pdf" });
    const url     = URL.createObjectURL(pdfBlob);
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = `all-winners-${new Date().toISOString().split("T")[0]}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Failed: " + err.message);
  } finally {
    setDownloading(false);
  }
};

// Helper: fetch image URL and convert to base64 for jsPDF
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(null); // fail silently
    img.src = url;
  });
};

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-black via-[#120c00] to-black text-white px-5 py-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <img src={logo} alt="Habesha Logo" className="w-16 object-contain" />
        <div className="text-right">
          <p className="text-gray-400 text-xs">Logged In As</p>
          <h2 className="font-semibold text-yellow-400">{user?.username}</h2>
        </div>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome Back 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Ready to activate another outlet?</p>
      </div>

      {/* Section Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">My Outlets</h3>
      </div>

      {/* Main Interactive Stream */}
      <div className="flex-1 space-y-4">
        {loading && (
          <div className="text-center text-gray-400 py-6">Loading outlets...</div>
        )}

        {!loading && outlets.length === 0 && (
          <div className="text-center text-gray-500 py-8">No outlets assigned yet.</div>
        )}

        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            onClick={() =>
              navigate(`/campaign/${outlet.id}`, {
                state: { outlet }
              })
            }
            className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <FaStore className="text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold">{outlet.name}</h4>
                <p className="text-gray-400 text-sm">{outlet.city}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add Outlet Card */}
        <div
          onClick={() => navigate("/add-outlet")}
          className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-5 text-center cursor-pointer hover:border-yellow-400 transition-all"
        >
          <FaPlus className="mx-auto text-yellow-400 text-xl mb-2" />
          <p className="font-semibold text-yellow-400">Add New Outlet</p>
          <p className="text-xs text-gray-500 mt-1">Register a new outlet</p>
        </div>

        {/* Clean Separator Line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent my-6" />

        {/* Download Winners Report Card */}
        <div
          onClick={!downloading ? generatePDF : undefined}
          className={`
            bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900
            border border-yellow-500/10
            rounded-2xl p-4
            cursor-pointer
            flex items-center justify-between
            active:scale-[0.98] transition-all
            ${downloading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-3 rounded-xl">
              <FaFileDownload className={`text-yellow-400 ${downloading ? "animate-bounce" : ""}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-100">
                {downloading ? "Generating Document..." : "Winners Report"}
              </h4>
              <p className="text-zinc-500 text-xs mt-0.5">Export active spreadsheet data to PDF</p>
            </div>
          </div>
          <span className="text-[10px] bg-yellow-950/60 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-md font-bold tracking-wide">
            PDF
          </span>
        </div>
      </div>

      {/* Logout Option Footer */}
      <div className="mt-8 pb-4">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-semibold bg-red-500/5 transition-colors hover:bg-red-500/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
}