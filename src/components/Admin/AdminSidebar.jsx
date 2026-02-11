
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Bug, 
  Play, 
  Database, 
  Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { 
      label: 'Tableau de Bord', 
      icon: LayoutDashboard, 
      path: '/admin' 
    },
    { 
      label: 'Logs Webhooks', 
      icon: FileText, 
      path: '/admin/logs' 
    },
    { 
      label: 'Débogage', 
      icon: Bug, 
      path: '/admin/debug' 
    },
    { 
      label: 'Test Flux Webhook', 
      icon: Play, 
      path: '/admin/test-webhook' 
    },
    { 
      label: 'Base de Données', 
      icon: Database, 
      path: '/admin/database' 
    },
    { 
      label: 'Système & Info', 
      icon: Info, 
      path: '/admin/system' 
    }
  ];

  return (
    <div className="w-48 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0">
      <div className="p-4"> {/* Changed from p-6 to p-4 */}
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3"> {/* Changed px-2 to px-3 */}
          Administration
        </h2>
        <nav className="space-y-1"> {/* space-y-1 already, no change needed here */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if active: exact match for root /admin, or startsWith for sub-routes (but handle root /admin carefully)
            const isActive = item.path === '/admin' 
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left", /* Changed gap-3 to gap-2, px-4 py-2.5 to px-3 py-2 */
                  isActive 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" 
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} /> {/* Icon size already h-4 w-4 */}
                <span className="truncate">{item.label}</span> {/* Ensure text uses truncate */}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
