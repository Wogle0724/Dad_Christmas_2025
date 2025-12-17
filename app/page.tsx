import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dad Dashboard</h1>
          <p className="text-gray-600">Your personal command center</p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            Login
          </Link>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <Link
            href="/send-message"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            Send a Message
          </Link>
        </div>
      </div>
    </div>
  );
}

