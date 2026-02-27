import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Stethoscope, LogOut, User, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "@/context/theme-context";

export const Navbar = memo(function Navbar() {
  const user = useAuthStore((state) => state.user);

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Use shared theme context — single source of truth
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-700/60 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-2">
            <Link
              to={
                user
                  ? user.role === "DOCTOR"
                    ? "/dashboard/doctor"
                    : "/dashboard/patient"
                  : "/"
              }
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                CareXpert
              </span>
            </Link>
          </div>

          {/* Right side - Theme toggle and user info dropdown or login/signup */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 p-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role || "Patient"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/auth/patient/signup">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});
