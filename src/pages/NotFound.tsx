import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-7xl md:text-9xl font-extrabold text-purple-500">
        404
      </h1>

      <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
        Page Not Found
      </h2>

      <p className="mt-3 text-gray-400 text-center max-w-md">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition duration-200"
      >
        Go Home
      </Link>
    </div>
  );
}