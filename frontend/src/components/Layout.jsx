import Sidebar from "./Sidebar";

const Layout = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        {title && (
          <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200 px-10 py-6 shadow-sm">
            <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
              {title}
            </h1>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
