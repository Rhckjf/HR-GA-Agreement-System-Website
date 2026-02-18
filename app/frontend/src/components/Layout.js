import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Users as UsersIcon,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { getDepartmentConfig, ADMIN_CONFIG } from '@/departmentConfig';
import { API } from '../config';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.filter(n => !n.is_read));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const deptConfig = user?.department ? getDepartmentConfig(user.department) : null;
  const themeColor = isAdmin ? ADMIN_CONFIG.color : (deptConfig?.color || '#134E4A');

  const getNavigation = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Agreements', href: '/agreements', icon: FileText },
        { name: 'Vendors', href: '/vendors', icon: Building2 },
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
      ];
    }
    return [
      { name: 'Dashboard', href: `/department/${user?.department}`, icon: LayoutDashboard },
      { name: 'Agreements', href: '/agreements', icon: FileText },
      { name: 'Vendors', href: '/vendors', icon: Building2 },
    ];
  };

  const navigation = getNavigation();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    if (path.startsWith('/department/')) return location.pathname.startsWith('/department/');
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      {/* Top Navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-stone-600 hover:text-stone-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <FileText style={{ color: themeColor }} size={28} strokeWidth={2} />
              <h1 className="text-xl font-bold text-stone-900">PT Diamond Electric Indonesia</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Department Badge */}
            {user && (
              <Badge
                className="hidden sm:inline-flex text-xs font-medium gap-1 px-2.5 py-1"
                style={{
                  backgroundColor: isAdmin ? '#F0FDFA' : (deptConfig?.bgColor || '#F0FDFA'),
                  color: themeColor,
                  border: `1px solid ${themeColor}30`,
                }}
              >
                {isAdmin ? (
                  <><Shield size={12} /> Admin</>
                ) : (
                  <>{deptConfig?.icon && <deptConfig.icon size={12} />} {user.department}</>
                )}
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#D97706] text-white text-xs"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-stone-500 text-center">No new notifications</div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                      <p className="text-sm font-medium text-stone-900">{notif.message}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="user-menu-button">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: themeColor }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuLabel>
                  <div>
                    <p className="text-sm">{user?.name}</p>
                    <p className="text-xs text-stone-500 font-normal">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-stone-200
            transform transition-transform duration-200 ease-in-out lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ top: '73px' }}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all
                    ${active
                      ? 'text-white'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                    }
                  `}
                  style={active ? { backgroundColor: themeColor } : {}}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: themeColor }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-900 truncate">{user?.name}</p>
                <p className="text-xs text-stone-500 truncate">{isAdmin ? 'Administrator' : user?.department}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}