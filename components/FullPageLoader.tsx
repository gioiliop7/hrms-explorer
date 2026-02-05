export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-8 w-8 rounded-full bg-blue-50"></div>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900">Φόρτωση...</h3>
      </div>
    </div>
  );
}
