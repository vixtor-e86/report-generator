"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Home, ShoppingBag, Wrench, User, 
  Wallet, Bell, ChevronDown, LogOut 
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
import { formatCurrency } from '@/lib/marketplace-utils';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useUser();
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
                    ? 'text-black bg-white shadow-sm border border-[#e5e7eb]'
                    : 'text-[#6b7280] hover:text-black hover:bg-[#f3f4f6]'
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] rounded-full"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 hover:bg-[#f3f4f6] rounded-full px-2"
                    >
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full border border-[#e5e7eb]"
                      />
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
                    <div className="px-3 py-2">
                      <p className="text-black font-semibold text-sm">{user?.name}</p>
                      <p className="text-[#6b7280] text-xs">{user?.email}</p>
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
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50/50 cursor-pointer rounded-lg m-1"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-[#6b7280] hover:text-black hover:bg-[#f3f4f6] rounded-full px-6"
                >
                  Sign In
                </Button>
                <Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-6">
                  Get Started
                </Button>
              </div>
            )}

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
                            ? 'text-black bg-[#f3f4f6] font-semibold'
                            : 'text-[#6b7280] hover:text-black hover:bg-[#f3f4f6]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {isAuthenticated && (
                    <div className="p-6 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-3 mb-6">
                        <img
                          src={user?.avatar}
                          alt={user?.name}
                          className="w-12 h-12 rounded-full border border-[#e5e7eb]"
                        />
                        <div>
                          <p className="text-black font-bold">{user?.name}</p>
                          <p className="text-[#6b7280] text-sm">{user?.email}</p>
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
