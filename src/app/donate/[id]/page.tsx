'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    Loader2,
    ArrowLeft,
    Truck,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface PortalDonation {
    _id: string;
    donationType: string;
    status: string;
    itemDetails?: Array<{ category: string; description?: string; quantity: string; unit?: string }>;
    donationRequest?: {
        title: string;
    };
}

function DonateFlowContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [donation, setDonation] = useState<PortalDonation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                    const donationData = response.data.data;
                    setDonation(donationData);

                    // If it's a cash donation, redirect to cash flow
                    if (donationData.donationType === 'cash') {
                        router.push(`/donate/${id}/cash`);
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

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-3xl">
            {/* Back Button */}
            <Button variant="ghost" className="mb-6" onClick={() => router.push(getBackUrl())}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-blue-100">
                        <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Item Donation</h1>
                        <p className="text-muted-foreground">
                            {donation?.donationRequest?.title || 'Complete your donation'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items Summary */}
            {donation?.itemDetails && donation.itemDetails.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">Items to Donate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {donation.itemDetails.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium capitalize">{item.category}</p>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline">Qty: {item.quantity} {item.unit || 'pieces'}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delivery Options */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium">How would you like to deliver?</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Self Delivery Option */}
                    <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => router.push(`/donate/${id}/self-delivery?from=delivery-method`)}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-green-100">
                                    <Truck className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Self Delivery</CardTitle>
                                    <CardDescription>
                                        I&apos;ll deliver the items myself
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                                <li>✓ Drop off at designated location</li>
                                <li>✓ Upload proof after delivery</li>
                                <li>✓ Faster verification</li>
                            </ul>
                            <Button className="w-full">
                                Choose Self Delivery
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Request Pickup Option */}
                    <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => router.push(`/donate/${id}/pickup?from=delivery-method`)}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-purple-100">
                                    <MapPin className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Request Pickup</CardTitle>
                                    <CardDescription>
                                        A volunteer will pick up from me
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                                <li>✓ Convenient pickup from your location</li>
                                <li>✓ Volunteer coordination</li>
                                <li>✓ No travel required</li>
                            </ul>
                            <Button variant="outline" className="w-full">
                                Request Pickup
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function DonateFlowPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <DonateFlowContent />
        </Suspense>
    );
}
