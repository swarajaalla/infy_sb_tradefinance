const PageSection = ({ title, actions, children }) => {
  return (
    <section className="space-y-8">
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
            )}
            <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
};

export default PageSection;
