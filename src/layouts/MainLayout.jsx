
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Ticket, User, LogOut, Server, Moon, Sun, ShieldCheck } from 'lucide-react';

function MainLayout() {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isLinkActive = (path) => isActive(path) 
    ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white" 
    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {user && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center dark:bg-indigo-500">
                    <Ticket className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 hidden md:block dark:text-white">Case à Chocs</span>
                </Link>

                <nav className="hidden md:flex gap-1">
                  <Link to="/">
                    <Button variant="ghost" className={`gap-2 ${isLinkActive('/')}`}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/tickets">
                    <Button variant="ghost" className={`gap-2 ${isLinkActive('/tickets')}`}>
                      <Ticket className="h-4 w-4" />
                      Tickets
                    </Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="ghost" className={`gap-2 ${isLinkActive('/admin')}`}>
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleDarkMode}
                  className="text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 dark:text-slate-200 dark:hover:bg-slate-800">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center dark:bg-indigo-900/50">
                        <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-slate-200">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 dark:bg-slate-900 dark:border-slate-800">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <ShieldCheck className="h-4 w-4 mr-2" /> Administration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={user ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
