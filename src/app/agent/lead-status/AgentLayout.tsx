export default function AgentLayout() {
  return (
    <>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Number of Calls</h3>
            <p className="text-2xl font-bold text-blue-400">200</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">
              Number of Disburse
            </h3>
            <p className="text-2xl font-bold text-pink-600"></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Number of Fails</h3>
            <p className="text-2xl font-bold text-green-600"></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Total</h3>
            <p className="text-2xl font-bold text-amber-500"></p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">
            All Time Data
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold">
                Number of Calls
              </h3>
              <p className="text-2xl font-bold text-blue-400">200</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold">
                Number of Disburse
              </h3>
              <p className="text-2xl font-bold text-pink-600"></p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold">
                Number of Fails
              </h3>
              <p className="text-2xl font-bold text-green-600"></p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-bold">Total</h3>
              <p className="text-2xl font-bold text-amber-500"></p>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}
