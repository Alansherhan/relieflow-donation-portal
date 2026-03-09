'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Wallet,
    Loader2,
    ArrowLeft,
    CheckCircle,
    CreditCard,
    Heart,
    Users
} from 'lucide-react';
import { toast } from 'sonner';

interface WalletInfo {
    balance: number;
    totalCredits: number;
    donorCount: number;
    recentDonations: Array<{
        amount: number;
        donorName: string;
        createdAt: string;
    }>;
}

export default function WalletDonationPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMockPayment, setShowMockPayment] = useState(false);
    const [amount, setAmount] = useState('');

    // Guest donor info
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        const fetchWalletInfo = async () => {
            try {
                const response = await portalApi.getWalletInfo();
                if (response.data.success) {
                    setWalletInfo(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch wallet info:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalletInfo();
    }, []);

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setShowMockPayment(true);
    };

    const processMockPayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            let response;

            if (isAuthenticated) {
                response = await portalApi.donateToWallet({
                    amount: parseFloat(amount),
                    transactionRef: `TXN_${Date.now()}`,
                });
            } else {
                response = await portalApi.guestDonateToWallet({
                    donorName: guestInfo.name || 'Anonymous',
                    donorEmail: guestInfo.email,
                    donorPhone: guestInfo.phone,
                    amount: parseFloat(amount),
                });
            }

            if (response.data.success) {
                toast.success('Thank you for your generous donation!');
                const donationId = response.data.data.donation?._id || response.data.data._id;
                router.push(`/success?type=wallet&donationId=${donationId}`);
            } else {
                toast.error('Donation failed. Please try again.');
            }
        } catch (error) {
            console.error('Donation failed:', error);
            toast.error('Donation failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setShowMockPayment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (showMockPayment) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Mock Payment</CardTitle>
                        <CardDescription>
                            This is a demo payment interface
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold">₹{parseFloat(amount).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Donation to Relief Fund
                            </p>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 text-center">
                                🎓 Demo Mode: No real payment will be processed
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={processMockPayment}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirm Payment
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowMockPayment(false)}
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-4xl">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Donation Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Donate to Relief Fund</CardTitle>
                                <CardDescription>
                                    Support emergency disaster relief efforts
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Donation Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                className="text-lg"
                            />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {[100, 500, 1000, 5000].map((value) => (
                                <Button
                                    key={value}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmount(value.toString())}
                                    className={amount === value.toString() ? 'border-primary' : ''}
                                >
                                    ₹{value}
                                </Button>
                            ))}
                        </div>

                        {/* Guest Info (for non-authenticated users) */}
                        {!isAuthenticated && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="font-medium text-sm">Your Information (Optional)</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your name (or leave blank for anonymous)"
                                            value={guestInfo.name}
                                            onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Email"
                                                value={guestInfo.email}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="Phone"
                                                value={guestInfo.phone}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Submit Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePayment}
                            disabled={!amount || parseFloat(amount) <= 0}
                        >
                            <Heart className="h-4 w-4 mr-2" />
                            Donate ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Your donation helps provide immediate relief to disaster-affected communities
                        </p>
                    </CardContent>
                </Card>

                {/* Right: Fund Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Relief Fund Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <Wallet className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold">
                                        ₹{walletInfo?.totalCredits?.toLocaleString() || '0'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Total Raised</p>
                                </div>
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold">{walletInfo?.donorCount || 0}</p>
                                    <p className="text-xs text-muted-foreground">Donors</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Donations */}
                    {walletInfo?.recentDonations && walletInfo.recentDonations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Donations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {walletInfo.recentDonations.map((donation, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Heart className="h-4 w-4 text-primary" />
                                                </div>
                                                <span>{donation.donorName}</span>
                                            </div>
                                            <span className="font-medium">₹{donation.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Trust Badges */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>100% of donations go to relief efforts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Transparent fund utilization</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Verified by local authorities</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
