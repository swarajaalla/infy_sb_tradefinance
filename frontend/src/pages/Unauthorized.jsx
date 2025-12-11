import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      
      <div className="bg-white shadow-xl p-8 rounded-lg text-center w-96">
        
        <h1 className="text-4xl font-bold text-red-600 mb-4">🚫 Access Denied</h1>

        <p className="text-gray-700 mb-6">
          You do not have permission to view this page.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            🔐 Login Again
          </Link>

          <Link
            to="/dashboard"
            className="block w-full border border-gray-400 py-2 rounded hover:bg-gray-200 transition"
          >
            ⬅ Go Back
          </Link>
        </div>
      </div>

    </div>
  );
}
