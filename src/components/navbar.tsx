'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, LogOut, LayoutDashboard, History } from 'lucide-react';

export function Navbar() {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/requests', label: 'Requests' },
        { href: '/donate/wallet', label: 'Relief Fund' },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Heart className="h-6 w-6 text-coral fill-coral" />
                    <span className="font-bold text-xl">RelieFlow</span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors px-4 py-2 rounded-full ${isActive
                                        ? 'bg-white text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
                    ) : isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-coral text-coral-foreground font-medium">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                                <div className="flex flex-col space-y-1 p-3">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/my-donations" className="cursor-pointer">
                                        <History className="mr-2 h-4 w-4" />
                                        My Donations
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="cursor-pointer text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Button variant="ghost" className="hidden sm:inline-flex rounded-full" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button className="rounded-full px-6" asChild>
                                <Link href="/requests">Donate Now</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Dialog */}
            <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to log out? You will need to sign in again to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLogoutDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowLogoutDialog(false);
                                logout();
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </nav>
    );
}
