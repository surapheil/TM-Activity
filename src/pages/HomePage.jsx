import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FaPlus, FaStore } from "react-icons/fa";
import { getOutlets } from "../services/outletService";
import logo from "../assets/21+Logo - Habesha - Vertical.png";

export default function HomePage() {
const [outlets, setOutlets] = useState([]);
const [loading, setLoading] = useState(true);

const navigate = useNavigate();

const { user, logout } = useAuth();

useEffect(() => {
if (!user) return;

const cached = localStorage.getItem(
  `outlets_${user.id}`
);

if (cached) {
  setOutlets(JSON.parse(cached));
}

loadOutlets();

}, [user]);

async function loadOutlets() {
try {
const data = await getOutlets(user.id);

  setOutlets(data);

  localStorage.setItem(
    `outlets_${user.id}`,
    JSON.stringify(data)
  );
} catch (error) {
  console.error("Failed to load outlets:", error);
} finally {
  setLoading(false);
}

}

return ( <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-black via-[#120c00] to-black text-white px-5 py-6 flex flex-col">

```
  {/* Header */}
  <div className="flex justify-between items-center mb-8">

    <img
      src={logo}
      alt="Habesha Logo"
      className="w-16 object-contain"
    />

    <div className="text-right">
      <p className="text-gray-400 text-xs">
        Logged In As
      </p>

      <h2 className="font-semibold text-yellow-400">
        {user?.username}
      </h2>
    </div>

  </div>

  {/* Welcome */}
  <div className="mb-8">

    <h1 className="text-3xl font-bold">
      Welcome Back 👋
    </h1>

    <p className="text-gray-400 text-sm mt-1">
      Ready to activate another outlet?
    </p>

  </div>

  {/* Section */}
  <div className="mb-4">

    <h3 className="text-lg font-semibold">
      My Outlets
    </h3>

  </div>

  {/* Outlet List */}
  <div className="flex-1 space-y-4">

    {loading && (
      <div className="text-center text-gray-400 py-6">
        Loading outlets...
      </div>
    )}

    {!loading && outlets.length === 0 && (
      <div className="text-center text-gray-500 py-8">
        No outlets assigned yet.
      </div>
    )}

    {outlets.map((outlet) => (
      <div
        key={outlet.id}
        onClick={() =>
          navigate(`/campaign/${outlet.id}`, {
            state: { outlet }
          })
        }
        className="
          bg-white/5
          border
          border-yellow-500/20
          rounded-2xl
          p-4
          backdrop-blur-md
          cursor-pointer
          active:scale-[0.98]
          transition-all
        "
      >
        <div className="flex items-center gap-3">

          <div className="bg-yellow-500/10 p-3 rounded-xl">
            <FaStore className="text-yellow-400" />
          </div>

          <div>

            <h4 className="font-semibold">
              {outlet.name}
            </h4>

            <p className="text-gray-400 text-sm">
              {outlet.city}
            </p>

          </div>

        </div>
      </div>
    ))}

    {/* Add Outlet Card */}

    <div
      onClick={() => navigate("/add-outlet")}
      className="
        border-2
        border-dashed
        border-yellow-500/30
        rounded-2xl
        p-5
        text-center
        cursor-pointer
        hover:border-yellow-400
        transition-all
      "
    >
      <FaPlus className="mx-auto text-yellow-400 text-xl mb-2" />

      <p className="font-semibold text-yellow-400">
        Add New Outlet
      </p>

      <p className="text-xs text-gray-500 mt-1">
        Register a new outlet
      </p>
    </div>

  </div>

  {/* Logout */}

  <div className="mt-8 pb-4">

    <button
      onClick={() => {
        logout();
        navigate("/login");
      }}
      className="
        w-full
        py-3
        rounded-xl
        border
        border-red-500/30
        text-red-400
        font-semibold
        bg-red-500/5
      "
    >
      Logout
    </button>

  </div>

</div>

);
}
