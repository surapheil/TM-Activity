import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AddOutletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [loading, setLoading] = useState(false);
  const cities = [
  "Addis Ababa",
  "Dire Dawa",
  "Bahir Dar",
  "Hawassa",
  "Mekelle",
  "Gondar",
  "Jimma",
  "Adama",
  "Dessie",
  "Jijiga",
  "Shashamane",
  "Hosaena",
  "Arba Minch",
  "Harar"
];

  const API_URL =
    "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

  // 📍 GPS
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => alert("Unable to get location")
    );
  };

  // 🌐 offline check
  const isOnline = () => navigator.onLine;

  const saveOffline = (data) => {
    const queue =
      JSON.parse(localStorage.getItem("offline_outlets")) || [];

    queue.push(data);

    localStorage.setItem(
      "offline_outlets",
      JSON.stringify(queue)
    );
  };

  // ☁️ SUBMIT
  const handleSubmit = async () => {
    if (!name || !city) {
      alert("Name and City are required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        action: "addOutlet",
        baId: user.id,
        name,
        address,
        city,
        latitude: lat,
        longitude: lng
      };

      // 🌐 OFFLINE MODE
      if (!isOnline()) {
        saveOffline(payload);
        alert("Saved offline. Will sync later.");
        navigate("/home");
        return;
      }

      // ⚠️ NO CORS MODE (IMPORTANT)
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      alert("Outlet saved successfully");
      navigate("/home");

    } catch (err) {
      console.error(err);
      alert("Error saving outlet");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 auto sync offline data
  useEffect(() => {
    const syncOffline = async () => {
      const queue =
        JSON.parse(localStorage.getItem("offline_outlets")) || [];

      if (queue.length === 0) return;
      if (!navigator.onLine) return;

      for (let item of queue) {
        try {
          await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(item)
          });
        } catch (err) {
          console.log("sync failed", err);
        }
      }

      localStorage.removeItem("offline_outlets");
    };

    window.addEventListener("online", syncOffline);

    syncOffline();

    return () => {
      window.removeEventListener("online", syncOffline);
    };
  }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black text-white px-5 py-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">
        Add Outlet
      </h1>

      {/* NAME */}
      <input
        placeholder="Outlet Name *"
        className="w-full p-3 mb-3 bg-white/5 rounded-xl"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* ADDRESS */}
      <input
        placeholder="Address"
        className="w-full p-3 mb-3 bg-white/5 rounded-xl"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      {/* CITY */}
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full p-3 mb-3 bg-white/5 rounded-xl text-white"
      >
        <option value="">Select City *</option>

        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* GPS */}
      <button
        onClick={getLocation}
        className="w-full p-3 mb-3 bg-yellow-500 text-black rounded-xl"
      >
        📍 Get Location
      </button>

      {lat && (
        <p className="text-xs text-gray-400 mb-3">
          Lat: {lat} | Lng: {lng}
        </p>
      )}

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full p-3 bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-bold rounded-xl"
      >
        {loading ? "Saving..." : "Save Outlet"}
      </button>

      <button
        onClick={() => navigate("/home")}
        className="w-full mt-3 text-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}