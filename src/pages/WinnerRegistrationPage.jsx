import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function WinnerRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { outlet, prize, outletId } = location.state || {};

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const { spinId } = location.state || {};

  useEffect(() => {
    const already = localStorage.getItem(`spin_done_${spinId}`);

    if (already) {
      alert("This spin is already registered");
      navigate(`/spin/${outletId}`);
    }
  }, []);

  const API_URL =
    "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

  const submit = async () => {
    if (!fullName || !phone) {
      alert("Name and phone required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        action: "addWinner",
        outletId,
        outletName: outlet?.name,
        prize,
        fullName,
        phone,
        age,
        gender,
        date: new Date().toISOString()
      };

     const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      console.log("Apps Script Response:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to save winner");
      }
      const campaign = JSON.parse(
        localStorage.getItem(`campaign_${outletId}`)
      );

      const updated = campaign
        .map(item =>
          item.name === prize
            ? {
                ...item,
                qty: item.qty - 1
              }
            : item
        )
        .filter(item => item.qty > 0);

        localStorage.setItem(
          `campaign_${outletId}`,
          JSON.stringify(updated)
        )

       if (updated.length === 0) {
        alert("All prizes have been distributed!");
        navigate("/home");
        return;
      } 
      alert("Winner registered 🎉");
      navigate(`/spin/${outletId}`, {
        state: { outlet }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to register winner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-2xl text-yellow-400 font-bold mb-2">
        🎉 Winner Registration
      </h1>

      <p className="text-gray-400 mb-6">
        Prize: <span className="text-yellow-400">{prize}</span>
      </p>

      <div className="w-full max-w-sm space-y-3">

        <input
          placeholder="Full Name"
          className="w-full p-3 rounded bg-gray-900 border border-yellow-600"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          placeholder="Phone Number"
          className="w-full p-3 rounded bg-gray-900 border border-yellow-600"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Age"
          className="w-full p-3 rounded bg-gray-900 border border-yellow-600"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <select
          className="w-full p-3 rounded bg-gray-900 border border-yellow-600"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-300 text-black p-3 rounded font-bold"
        >
          {loading ? "Saving..." : "CONFIRM WIN"}
        </button>

      </div>
    </div>
  );
}