import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1200);

  return () => clearTimeout(timer);
}, []);
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-12">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Patient/Doctor Dashboard
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          This is a placeholder for the dashboard content. You are viewing this
          as a patient or doctor.
        </p>
        {/* Add your dashboard content here */}
      </div>
      <Footer />
    </div>
  );
}
