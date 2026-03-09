'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { portalApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Package,
    Loader2,
    ArrowLeft,
    CircleDollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    MapPin
} from 'lucide-react';

interface Donation {
    _id: string;
    donationType: 'cash' | 'item';
    amount?: number;
    status: string;
    deliveryMethod?: string;
    createdAt: string;
    donationRequest?: {
        title: string;
    };
    itemDetails?: Array<{ category: string; quantity: string; unit?: string }>;
}

interface DonationCounts {
    pending_payment: number;
    pending_delivery: number;
    awaiting_volunteer: number;
    pickup_scheduled: number;
    completed: number;
    cancelled: number;
}

export default function MyDonationsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [counts, setCounts] = useState<DonationCounts | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchDonations = async () => {
            if (!isAuthenticated) return;

            try {
                const params: { status?: string; limit: number } = { limit: 50 };
                if (activeTab !== 'all') {
                    params.status = activeTab;
                }

                const response = await portalApi.getMyDonations(params);
                if (response.data.success) {
                    setDonations(response.data.data);
                    setCounts(response.data.counts);
                }
            } catch (error) {
                console.error('Failed to fetch donations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            setIsLoading(true);
            fetchDonations();
        }
    }, [isAuthenticated, activeTab]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending_payment':
                return <CircleDollarSign className="h-4 w-4 text-orange-600" />;
            case 'pending_delivery':
                return <Truck className="h-4 w-4 text-blue-600" />;
            case 'awaiting_volunteer':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'pickup_scheduled':
                return <MapPin className="h-4 w-4 text-purple-600" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            pending_payment: { variant: 'outline', label: 'Pending Payment' },
            pending_delivery: { variant: 'outline', label: 'Pending Delivery' },
            awaiting_volunteer: { variant: 'secondary', label: 'Awaiting Volunteer' },
            pickup_scheduled: { variant: 'default', label: 'Pickup Scheduled' },
            completed: { variant: 'default', label: 'Completed' },
            cancelled: { variant: 'destructive', label: 'Cancelled' },
        };
        const config = configs[status] || { variant: 'secondary' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const pendingCount = (counts?.pending_payment || 0) + (counts?.pending_delivery || 0) + (counts?.awaiting_volunteer || 0);
    const inProgressCount = counts?.pickup_scheduled || 0;
    const completedCount = counts?.completed || 0;

    return (
        <div className="container py-8">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Link>
            </Button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Donations</h1>
                <p className="text-muted-foreground mt-1">
                    Track and manage all your donations
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="all">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="pending_delivery">
                        Pending ({pendingCount})
                    </TabsTrigger>
                    <TabsTrigger value="pickup_scheduled">
                        In Progress ({inProgressCount})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedCount})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : donations.length === 0 ? (
                        <Card>
                            <CardContent className="py-20 text-center">
                                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-medium">No donations found</h3>
                                <p className="text-muted-foreground mt-1">
                                    {activeTab === 'all'
                                        ? 'Start by browsing donation requests'
                                        : `No ${activeTab} donations`
                                    }
                                </p>
                                <Button asChild className="mt-4">
                                    <Link href="/requests">Browse Requests</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {donations.map((donation) => (
                                <Card 
                                    key={donation._id} 
                                    className="cursor-pointer transition-colors hover:bg-muted/50"
                                    onClick={() => router.push(`/my-donations/${donation._id}`)}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* Icon */}
                                                <div className="p-3 rounded-full bg-muted">
                                                    {donation.donationType === 'cash' ? (
                                                        <CircleDollarSign className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div>
                                                    <h3 className="font-medium">
                                                        {donation.donationRequest?.title || 'Direct Fund Donation'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {donation.donationType === 'cash'
                                                            ? `₹${donation.amount?.toLocaleString()}`
                                                            : `${donation.itemDetails?.length || 0} items`
                                                        }
                                                        {donation.deliveryMethod === 'pickup' && ' · Pickup'}
                                                        {donation.deliveryMethod === 'self_delivery' && ' · Self delivery'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(donation.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(donation.status)}
                                                {getStatusBadge(donation.status)}
                                            </div>
                                        </div>

                                        {/* Action buttons based on status */}
                                        {donation.status === 'pending_payment' && (
                                            <div className="mt-4 pt-4 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button size="sm" asChild>
                                                    <Link href={`/donate/${donation._id}/cash?from=my-donations`}>
                                                        Complete Payment
                                                    </Link>
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={async () => {
                                                    try {
                                                        await portalApi.cancelDonation(donation._id);
                                                        window.location.reload();
                                                    } catch (e) {
                                                        console.error('Failed to cancel', e);
                                                    }
                                                }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                        {(donation.status === 'pending_delivery' || donation.status === 'awaiting_volunteer') && (
                                            <div className="mt-4 pt-4 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                {donation.status === 'pending_delivery' && (
                                                    <Button size="sm" asChild>
                                                        <Link href={`/donate/${donation._id}/self-delivery?from=my-donations`}>
                                                            Complete Delivery
                                                        </Link>
                                                    </Button>
                                                )}
                                                {donation.status === 'awaiting_volunteer' && (
                                                    <div className="text-sm text-muted-foreground flex items-center">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        Waiting for a volunteer...
                                                    </div>
                                                )}
                                                <Button size="sm" variant="outline" onClick={async () => {
                                                    try {
                                                        await portalApi.cancelDonation(donation._id);
                                                        window.location.reload();
                                                    } catch (e) {
                                                        console.error('Failed to cancel', e);
                                                    }
                                                }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}

                                        {donation.status === 'pickup_scheduled' && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="text-sm text-muted-foreground flex items-center">
                                                    <Truck className="h-4 w-4 mr-1" />
                                                    Volunteer assigned - pickup scheduled
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
