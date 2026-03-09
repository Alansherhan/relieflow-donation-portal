'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
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
    CreditCard,
    User
} from 'lucide-react';
import { toast } from 'sonner';

interface DonationRequest {
    _id: string;
    title: string;
    amount: number;
    fulfilledAmount?: number;
    upiNumber?: string;
}

export default function GuestDonatePage() {
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<DonationRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMockPayment, setShowMockPayment] = useState(false);

    const [amount, setAmount] = useState('');
    const [donorInfo, setDonorInfo] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const id = params.id as string;

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await portalApi.getPublicDonationRequest(id);
                if (response.data.success) {
                    setRequest(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch request:', error);
                toast.error('Failed to load donation request');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchRequest();
        }
    }, [id]);

    // Calculate the remaining amount that can be donated
    const remainingAmount = request?.amount
        ? request.amount - (request.fulfilledAmount || 0)
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

        setShowMockPayment(true);
    };

    const processMockPayment = async () => {
        setIsProcessing(true);

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            const response = await portalApi.guestDonate({
                donationRequestId: id,
                donorName: donorInfo.name || 'Anonymous',
                donorEmail: donorInfo.email,
                donorPhone: donorInfo.phone,
                amount: parseFloat(amount),
                transactionRef: `TXN_${Date.now()}`,
            });

            if (response.data.success) {
                toast.success('Thank you for your donation!');
                router.push(`/success?type=cash&donationId=${response.data.data._id}`);
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
                                {request?.title}
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
            <Button variant="ghost" asChild className="mb-6">
                <Link href={`/requests/${id}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Request
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-100">
                            <CircleDollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Quick Donate</CardTitle>
                            <CardDescription>
                                {request?.title || 'Make a donation without creating an account'}
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
                        {request?.amount && (
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Goal: ₹{request.amount.toLocaleString()}
                                </p>
                                {remainingAmount !== null && remainingAmount < request.amount && (
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

                    {/* Donor Info (Optional) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">Your Information (Optional)</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Leave blank to donate anonymously
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Your name"
                                value={donorInfo.name}
                                onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    value={donorInfo.email}
                                    onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Phone"
                                    value={donorInfo.phone}
                                    onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* UPI Info */}
                    {request?.upiNumber && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">UPI Payment ID</p>
                            <p className="font-mono">{request.upiNumber}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePayment}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        Donate ₹{amount ? parseFloat(amount).toLocaleString() : '0'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Want to track your donation?{' '}
                        <Link href="/register" className="text-primary hover:underline">
                            Create an account
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
