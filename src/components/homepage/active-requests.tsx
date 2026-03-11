import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowRight } from 'lucide-react';

interface DonationRequest {
    _id: string;
    title: string;
    description: string;
    donationType: 'cash' | 'item';
    amount?: number;
    fulfilledAmount?: number;
    deadline?: string;
    proofImages?: string[];
}

interface ActiveRequestsProps {
    requests: DonationRequest[];
}

export function ActiveRequests({ requests }: ActiveRequestsProps) {
    const getDaysLeft = (deadline: string) => {
        const now = new Date();
        const end = new Date(deadline);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    return (
        <section className="py-20 px-4 md:px-6 lg:px-8">
            <div className="container max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <Badge variant="secondary" className="mb-4 rounded-full px-4 py-2">
                        <span className="mr-2">⭐</span>
                        Active Requests
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Support relief efforts today</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Together, we can make a real impact in communities around the world. Help us bring hope and support.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {requests.length > 0 ? (
                        requests.map((request) => (
                            <div key={request._id} className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-shadow">
                                {/* Image */}
                                <div className="h-52 bg-muted flex items-center justify-center">
                                    {request.proofImages?.[0] ? (
                                        <img
                                            src={request.proofImages[0].startsWith('http') ? request.proofImages[0] : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${request.proofImages[0]}`}
                                            alt={request.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="h-12 w-12 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {/* Category and Days Left */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs text-muted-foreground font-medium border-b border-muted-foreground/30 pb-0.5">
                                            {request.donationType === 'cash' ? 'Cash Relief' : 'Item Relief'}
                                        </span>
                                        {request.deadline && (
                                            <span className="text-xs text-muted-foreground">
                                                {getDaysLeft(request.deadline)} Days Left
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold mb-2 line-clamp-1">{request.title}</h3>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                                        {request.description}
                                    </p>

                                    {/* Goal and Raised */}
                                    {request.donationType === 'cash' && request.amount ? (
                                        <div className="flex justify-between mb-6">
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-1">Goal</span>
                                                <span className="text-lg font-bold">₹{request.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-muted-foreground block mb-1">Raised</span>
                                                <span className="text-lg font-bold">₹{(request.fulfilledAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6">
                                            <span className="text-xs text-muted-foreground block mb-1">Type</span>
                                            <span className="text-lg font-bold">Item Donation</span>
                                        </div>
                                    )}

                                    {/* View Program Button */}
                                    <Button variant="outline" className="w-full rounded-full border-gray-300 hover:bg-gray-50 cursor-pointer" asChild>
                                        <Link href={`/requests/${request._id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Placeholder cards when no requests are loaded
                        [1, 2, 3].map((i) => (
                            <div key={i} className="bg-card rounded-xl overflow-hidden border">
                                <div className="h-52 bg-muted animate-pulse" />
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between">
                                        <div className="h-3 bg-muted rounded animate-pulse w-20" />
                                        <div className="h-3 bg-muted rounded animate-pulse w-16" />
                                    </div>
                                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="space-y-2">
                                        <div className="h-3 bg-muted rounded animate-pulse" />
                                        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <div className="space-y-1">
                                            <div className="h-2 bg-muted rounded animate-pulse w-8" />
                                            <div className="h-4 bg-muted rounded animate-pulse w-20" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-2 bg-muted rounded animate-pulse w-10" />
                                            <div className="h-4 bg-muted rounded animate-pulse w-16" />
                                        </div>
                                    </div>
                                    <div className="h-10 bg-muted rounded-full animate-pulse" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="text-center mt-8">
                    <Button variant="outline" size="lg" className="rounded-full" asChild>
                        <Link href="/requests">
                            View All Requests
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
