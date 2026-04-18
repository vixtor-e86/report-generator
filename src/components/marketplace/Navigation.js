"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Home, ShoppingBag, Wrench, User, 
  Wallet, Bell, ChevronDown, LayoutDashboard 
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/marketplace/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/marketplace/ui/dropdown-menu';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, notifications, unreadCount, markNotificationsAsRead } = useUser();
  const { wallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/marketplace', label: 'Home', icon: Home },
    { path: '/marketplace/projects', label: 'Live Market', icon: ShoppingBag },
    { path: '/marketplace/tools', label: 'Academic Tools', icon: Wrench },
  ];

  const isActive = (path) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9fc]/80 backdrop-blur-md border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link href="/marketplace" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W3</span>
            </div>
            <span className="text-black font-bold text-lg hidden sm:block tracking-tight">
              W3write Lab
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-black bg-white shadow-sm border border-[#e5e7eb] font-black'
                    : 'text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] font-bold'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Wallet */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-[#e5e7eb] shadow-sm">
                  <Wallet className="w-4 h-4 text-black" />
                  <span className="text-black text-sm font-semibold">
                    {formatCurrency(wallet.balance)}
                  </span>
                </div>

                {/* Notifications */}
                <DropdownMenu onOpenChange={(open) => open && markNotificationsAsRead()}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] rounded-full transition-all"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-white border-[#e5e7eb] rounded-2xl shadow-2xl p-0 overflow-hidden">
                    <div className="p-4 border-b border-[#e5e7eb] bg-zinc-50/50 flex justify-between items-center">
                      <h3 className="font-black text-xs uppercase tracking-widest text-zinc-900">Notifications</h3>
                      {unreadCount > 0 && <span className="text-[10px] font-bold text-blue-600">New Alerts</span>}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <Bell className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 border-b border-[#f3f4f6] last:border-0 hover:bg-zinc-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                notif.type === 'success' ? 'bg-emerald-500' :
                                notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                              }`} />
                              <div>
                                <p className="text-sm font-black text-zinc-900 leading-tight mb-1">{notif.title}</p>
                                <p className="text-xs font-medium text-zinc-500 leading-relaxed">{notif.message}</p>
                                <p className="text-[9px] font-black text-zinc-300 uppercase mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 hover:bg-[#f3f4f6] rounded-full px-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-black uppercase">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-black text-sm font-medium hidden sm:block">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 text-[#6b7280]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border-[#e5e7eb] rounded-xl shadow-lg p-1"
                  >
                    <div className="px-3 py-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 text-sm font-black uppercase">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-black font-semibold text-sm truncate">{user?.name}</p>
                        <p className="text-[#6b7280] text-xs truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/marketplace/dashboard"
                        className="text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] cursor-pointer rounded-lg m-1"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.isSeller && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/marketplace/upload-project"
                          className="text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] cursor-pointer rounded-lg m-1"
                        >
                          <Wrench className="w-4 h-4 mr-2" />
                          Upload Project
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-[#e5e7eb]" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] cursor-pointer rounded-lg m-1 font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2 text-blue-600" />
                        Back to Workspace
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] rounded-full"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 bg-white border-l border-[#e5e7eb] p-0"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
                    <span className="text-black font-bold text-lg">Menu</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-[#6b7280] hover:text-black rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex-1 py-6 px-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-2 ${
                          isActive(item.path)
                            ? 'text-black bg-[#f3f4f6] font-bold shadow-sm border border-[#e5e7eb]'
                            : 'text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] font-semibold'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}

                    {isAuthenticated && (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 font-black mt-4 transition-colors border border-blue-50"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Back to Workspace
                      </Link>
                    )}
                  </div>

                  {isAuthenticated && (
                    <div className="p-6 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white text-base font-black uppercase">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-black font-bold truncate">{user?.name}</p>
                          <p className="text-[#6b7280] text-sm truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 bg-[#f3f4f6] rounded-xl border border-[#e5e7eb]">
                        <Wallet className="w-4 h-4 text-black" />
                        <span className="text-black font-bold">
                          {formatCurrency(wallet.balance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
