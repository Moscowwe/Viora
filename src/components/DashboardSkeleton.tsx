
const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-8">
      <header className="flex justify-between items-start mb-12">
        <div className="space-y-4 w-1/3">
          <div className="h-10 bg-surface-container-low/80-highest rounded-xl w-3/4"></div>
          <div className="h-6 bg-surface-container-low/80-highest rounded-xl w-1/2"></div>
        </div>
        <div className="w-12 h-12 bg-surface-container-low/80-highest rounded-full"></div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 h-32 border border-surface-container-highest/20">
            <div className="w-12 h-12 bg-surface-container-low/80-highest rounded-lg mb-4"></div>
            <div className="h-4 bg-surface-container-low/80-highest rounded w-1/2"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-6 h-80 border border-surface-container-highest/20"></div>
        <div className="bg-card rounded-xl p-6 h-80 border border-surface-container-highest/20"></div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
