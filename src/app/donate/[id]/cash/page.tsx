'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    CircleDollarSign,
    Loader2,
    ArrowLeft,
    CheckCircle,
    CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface PortalDonation {
    _id: string;
    donationType: string;
    amount?: number;
    status: string;
    donationRequest?: {
        title: string;
        amount: number;
        fulfilledAmount?: number;
        upiNumber?: string;
    };
}

function CashDonationContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [donation, setDonation] = useState<PortalDonation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMockPayment, setShowMockPayment] = useState(false);
    const [amount, setAmount] = useState('');

    const id = params.id as string;
    const fromPage = searchParams.get('from');

    // Determine back navigation destination
    const getBackUrl = useCallback(() => {
        if (fromPage === 'requests') return '/requests';
        if (fromPage === 'my-donations') return '/my-donations';
        return '/my-donations'; // default
    }, [fromPage]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchDonation = async () => {
            try {
                const response = await portalApi.getDonation(id);
                if (response.data.success) {
                    const d = response.data.data;
                    setDonation(d);
                    // Pre-fill with remaining amount (goal - already fulfilled)
                    if (d.donationRequest?.amount) {
                        const remaining = d.donationRequest.amount - (d.donationRequest.fulfilledAmount || 0);
                        setAmount(Math.max(0, remaining).toString());
                    } else if (d.amount) {
                        setAmount(d.amount.toString());
                    }
                }
            } catch (error) {
                console.error('Failed to fetch donation:', error);
                toast.error('Failed to load donation details');
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonation();
    }, [id, isAuthenticated, router]);

    // Calculate the remaining amount that can be donated
    const remainingAmount = donation?.donationRequest?.amount
        ? donation.donationRequest.amount - (donation.donationRequest.fulfilledAmount || 0)
        : null;

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        // Validate against remaining amount
        if (remainingAmount !== null && parseFloat(amount) > remainingAmount) {
            toast.error(`Maximum donation allowed is ₹${remainingAmount.toLocaleString()}`);
            return;
        }

        // Show mock payment UI
        setShowMockPayment(true);
    };

    const processMockPayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            const response = await portalApi.submitCashDonation(id, {
                amount: parseFloat(amount),
                transactionRef: `TXN_${Date.now()}`,
            });

            if (response.data.success) {
                toast.success('Payment successful! Thank you for your donation.');
                router.push(`/success?type=cash&donationId=${response.data.data._id}`);
            } else {
                toast.error('Payment failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
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

    // If donation is already completed, show success message
    if (donation?.status === 'completed') {
        return (
            <div className="container py-8 max-w-2xl">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => router.push(getBackUrl())} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardContent className="pt-8 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-600">Payment Completed!</h2>
                            <p className="text-muted-foreground mt-2">
                                Thank you for your generous donation of ₹{donation.amount?.toLocaleString()}.
                            </p>
                            {donation.donationRequest?.title && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    For: {donation.donationRequest.title}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center pt-4">
                            <Button variant="outline" onClick={() => router.push('/my-donations')}>
                                View My Donations
                            </Button>
                            <Button onClick={() => router.push('/requests')}>
                                Browse More Requests
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
                                {donation?.donationRequest?.title || 'Donation'}
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
        <div className="container py-8 max-w-2xl">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.push(getBackUrl())} className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-100">
                            <CircleDollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Cash Donation</CardTitle>
                            <CardDescription>
                                {donation?.donationRequest?.title || 'Complete your donation'}
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
                            onChange={(e) => {
                                const val = e.target.value;
                                // Cap input to remaining amount
                                if (remainingAmount !== null && parseFloat(val) > remainingAmount) {
                                    setAmount(remainingAmount.toString());
                                } else {
                                    setAmount(val);
                                }
                            }}
                            min="1"
                            max={remainingAmount !== null ? remainingAmount : undefined}
                            className="text-lg"
                        />
                        {donation?.donationRequest?.amount && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Goal: ₹{donation.donationRequest.amount.toLocaleString()}
                                </p>
                                {remainingAmount !== null && remainingAmount < donation.donationRequest.amount && (
                                    <p className="text-sm font-medium text-primary">
                                        Remaining: ₹{remainingAmount.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {[100, 500, 1000, 5000]
                            .filter((value) => remainingAmount === null || value <= remainingAmount)
                            .map((value) => (
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

                    <Separator />

                    {/* UPI Info */}
                    {donation?.donationRequest?.upiNumber && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">UPI Payment ID</p>
                            <p className="font-mono">{donation.donationRequest.upiNumber}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePayment}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        Pay ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Your donation will be processed securely
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CashDonationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CashDonationContent />
        </Suspense>
    );
}