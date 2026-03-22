import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 px-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="text-7xl">🍓</div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
          Sugar<span className="text-pink-500">Stack</span>
        </h1>
        <p className="text-lg text-gray-500">
          Fresh baked goods. Seamless ordering. Made with love.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/menu"
            className="px-8 py-3.5 bg-pink-500 text-white rounded-2xl font-semibold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200 text-center"
          >
            Browse Menu
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3.5 bg-white text-gray-700 rounded-2xl font-semibold border border-gray-200 hover:border-pink-300 transition-colors text-center"
          >
            Sign In
          </Link>
        </div>
        <div className="flex gap-6 justify-center text-sm text-gray-400 pt-4">
          <span>🥐 Pastries</span>
          <span>🧋 Drinks</span>
          <span>🍪 Cookies</span>
          <span>⭐ Specials</span>
        </div>
      </div>
    </main>
  );
}
