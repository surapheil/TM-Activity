import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STANDARD_PRIZES = [
  "Keychain",
  "1 Bottle",
  "2 Bottles",
  "T-Shirt",
  "Cap",
  "Bottle Opener",
  "Umbrella",
  "Glass",
];

export default function CampaignSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const outlet = location.state?.outlet;

  const [prizes, setPrizes] = useState([]);
  const [customPrize, setCustomPrize] = useState("");

  const addPrize = (prizeName) => {
    const existing = prizes.find(
      (p) => p.name === prizeName
    );

    if (existing) return;

    setPrizes([
      ...prizes,
      {
        name: prizeName,
        qty: 1,
      },
    ]);
  };

  const updateQty = (index, qty) => {
    const updated = [...prizes];
    updated[index].qty = Number(qty);
    setPrizes(updated);
  };

  const removePrize = (index) => {
    const updated = [...prizes];
    updated.splice(index, 1);
    setPrizes(updated);
  };

  const addCustomPrize = () => {
    if (!customPrize.trim()) return;

    addPrize(customPrize);

    setCustomPrize("");
  };

  const startCampaign = () => {
    if (prizes.length === 0) {
      alert("Add at least one prize");
      return;
    }

    localStorage.setItem(
      `campaign_${outlet.id}`,
      JSON.stringify(prizes)
    );

    navigate(`/spin/${outlet.id}`, {
      state: { outlet },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-5">
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">
        Campaign Setup
      </h1>

      <div className="mb-6">
        <p className="text-gray-400">Outlet</p>

        <h2 className="text-xl font-bold">
          {outlet?.name}
        </h2>
      </div>

      <h3 className="text-yellow-400 font-semibold mb-3">
        Standard Trade Materials
      </h3>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {STANDARD_PRIZES.map((prize) => (
          <button
            key={prize}
            onClick={() => addPrize(prize)}
            className="bg-yellow-500 text-black p-3 rounded-xl font-semibold"
          >
            {prize}
          </button>
        ))}
      </div>

      <h3 className="text-yellow-400 font-semibold mb-3">
        Custom Prize
      </h3>

      <div className="flex gap-2 mb-6">
        <input
          value={customPrize}
          onChange={(e) =>
            setCustomPrize(e.target.value)
          }
          placeholder="Enter custom prize"
          className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-700"
        />

        <button
          onClick={addCustomPrize}
          className="bg-yellow-500 text-black px-4 rounded-xl"
        >
          Add
        </button>
      </div>

      <h3 className="text-yellow-400 font-semibold mb-3">
        Selected Prizes
      </h3>

      {prizes.length === 0 && (
        <p className="text-gray-400">
          No prizes selected yet.
        </p>
      )}

      {prizes.map((prize, index) => (
        <div
          key={index}
          className="bg-gray-900 p-4 rounded-xl mb-3"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">
              {prize.name}
            </h4>

            <button
              onClick={() => removePrize(index)}
              className="text-red-400"
            >
              Remove
            </button>
          </div>

          <input
            type="number"
            min="1"
            value={prize.qty}
            onChange={(e) =>
              updateQty(index, e.target.value)
            }
            className="mt-3 w-full p-2 rounded bg-black border border-gray-700"
          />
        </div>
      ))}

      <button
        onClick={startCampaign}
        className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-bold p-4 rounded-2xl"
      >
        Start Campaign
      </button>
    </div>
  );
}