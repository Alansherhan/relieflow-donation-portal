'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { portalApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    CheckCircle,
    Clock,
    Package,
    ArrowRight,
    Loader2,
    History,
    Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DonationCounts {
    accepted: number;
    submitted: number;
    pickup_requested: number;
    pickup_accepted: number;
    completed: number;
    cancelled: number;
}

interface Donation {
    _id: string;
    donationType: string;
    amount?: number;
    status: string;
    createdAt: string;
    donationRequest?: {
        title: string;
    };
}

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [counts, setCounts] = useState<DonationCounts | null>(null);
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                const response = await portalApi.getMyDonations({ limit: 5 });
                if (response.data.success) {
                    setCounts(response.data.counts);
                    setRecentDonations(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch donations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const statusCards = [
        {
            title: 'Accepted',
            count: counts?.accepted || 0,
            description: 'Committed donations pending action',
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Submitted',
            count: (counts?.submitted || 0) + (counts?.pickup_requested || 0) + (counts?.pickup_accepted || 0),
            description: 'Awaiting verification',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Completed',
            count: counts?.completed || 0,
            description: 'Successfully delivered',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            accepted: { variant: 'secondary', label: 'Accepted' },
            submitted: { variant: 'outline', label: 'Submitted' },
            pickup_requested: { variant: 'outline', label: 'Pickup Requested' },
            pickup_accepted: { variant: 'default', label: 'Pickup Accepted' },
            completed: { variant: 'default', label: 'Completed' },
            cancelled: { variant: 'destructive', label: 'Cancelled' },
        };
        const config = variants[status] || { variant: 'secondary' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="container py-8">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                <p className="text-muted-foreground mt-1">
                    Track your donations and make a difference today.
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statusCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${card.bgColor}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : card.count}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Browse Donation Requests
                        </CardTitle>
                        <CardDescription>
                            Find causes that need your help and make a donation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/requests">
                                View Requests
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Donate to Relief Fund
                        </CardTitle>
                        <CardDescription>
                            Contribute to our general relief fund for emergency responses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/donate/wallet">
                                Donate Now
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Donations */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Recent Donations
                        </CardTitle>
                        <CardDescription>Your latest donation activity</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/my-donations">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : recentDonations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No donations yet</p>
                            <p className="text-sm">Start by browsing donation requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentDonations.map((donation, index) => (
                                <div key={donation._id}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {donation.donationRequest?.title || 'Direct Donation'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {donation.donationType === 'cash'
                                                    ? `₹${donation.amount?.toLocaleString()}`
                                                    : 'Item Donation'
                                                }
                                                {' · '}
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {getStatusBadge(donation.status)}
                                    </div>
                                    {index < recentDonations.length - 1 && <Separator className="mt-4" />}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
