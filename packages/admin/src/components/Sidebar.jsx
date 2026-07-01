import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users, Truck,
  Tags, Bell, Megaphone, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',   icon: Package,         label: 'Products' },
  { to: '/orders',     icon: ShoppingCart,     label: 'Orders' },
  { to: '/inventory',  icon: Warehouse,       label: 'Inventory' },
  { to: '/categories', icon: Tags,            label: 'Categories' },
  { to: '/sections',   icon: Layers,          label: 'Sections' },
  { to: '/notifications', icon: Megaphone,     label: 'Notifications' },
  { to: '/customers',  icon: Users,           label: 'Customers' },
  { to: '/riders',     icon: Truck,           label: 'Riders' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
];

export default function Sidebar({ collapsed, toggle }) {
  const { logout, user } = useAuth();
  const w = collapsed ? 'w-[68px]' : 'w-[240px]';

  return (
    <aside className={`${w} h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-200 fixed left-0 top-0 z-30`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Package size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-gray-900 text-lg">GroceryAdmin</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <n.icon size={19} className="flex-shrink-0" />
            {!collapsed && <span>{n.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-gray-100 space-y-0.5">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
          <LogOut size={19} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={toggle} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
