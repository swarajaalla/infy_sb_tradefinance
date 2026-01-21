import Sidebar from "./Sidebar";

const Layout = ({ children, title }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 z-30">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="ml-64 flex flex-col flex-1 h-screen">
        {/* Fixed Header */}
        {title && (
          <header className="h-16 shrink-0 bg-white/70 backdrop-blur-xl border-b border-slate-200 px-10 flex items-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              {title}
            </h1>
          </header>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
