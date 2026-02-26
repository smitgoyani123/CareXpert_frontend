import { BrowserRouter as Router } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "./context/theme-context";
import AppRoutes from "./routes";
import { useAuthStore } from "./store/authstore";
import { connectSocket, disconnectSocket } from "./sockets/socket";

function App() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Initialize auth on app load
    useAuthStore.getState().checkAuth();
  }, []);

  // Manage socket lifecycle at the app root so the connection persists across
  // all protected route navigations and is torn down only when the user logs out.
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  return (
    <Router>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </Router>
  );
}

export default App;
