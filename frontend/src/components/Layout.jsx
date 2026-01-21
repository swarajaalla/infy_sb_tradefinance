import Navbar from "./Navbar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="h-screen bg-slate-100">
      {/* SIDEBAR */}
      <Navbar />

      {/* TOPBAR */}
      <Topbar />

      {/* MAIN CONTENT */}
      <main
        className="
          ml-64 pt-14
          h-[calc(100vh-3.5rem)]
          overflow-y-auto
          bg-slate-100
        "
      >
        <Outlet />
      </main>
    </div>
  );
}
