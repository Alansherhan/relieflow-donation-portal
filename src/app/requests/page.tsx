'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    CircleDollarSign,
    Package,
    MapPin,
    Calendar,
    Loader2,
    Search,
    Filter
} from 'lucide-react';

interface DonationRequest {
    _id: string;
    title: string;
    description: string;
    donationType: 'cash' | 'item';
    amount?: number;
    fulfilledAmount?: number;
    itemDetails?: Array<{ category: string; quantity: string; unit?: string }>;
    priority: 'low' | 'medium' | 'high';
    status: string;
    deadline?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
    };
    createdAt: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<DonationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'cash' | 'item'>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            try {
                const params: { page: number; limit: number; donationType?: string; search?: string } = {
                    page,
                    limit: 12,
                };
                if (filter !== 'all') {
                    params.donationType = filter;
                }
                if (searchTerm.trim()) {
                    params.search = searchTerm.trim();
                }

                const response = await portalApi.getPublicDonationRequests(params);
                if (response.data.success) {
                    setRequests(response.data.data);
                    setTotalPages(response.data.pagination?.pages || 1);
                }
            } catch (error) {
                console.error('Failed to fetch requests:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [page, filter, searchTerm]);

    // Reset page when search or filter changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filter]);

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
            high: { variant: 'destructive', label: 'Urgent' },
            medium: { variant: 'default', label: 'Medium' },
            low: { variant: 'secondary', label: 'Low' },
        };
        const config = variants[priority] || { variant: 'secondary' as const, label: priority };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getProgress = (request: DonationRequest) => {
        if (request.donationType !== 'cash' || !request.amount) return null;
        const fulfilled = request.fulfilledAmount || 0;
        const percentage = Math.min((fulfilled / request.amount) * 100, 100);
        return { fulfilled, total: request.amount, percentage };
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 lg:px-12">
            {/* Header Section with Green Gradient */}
            <div className="bg-gradient-to-br from-green-400 to-green-500 relative overflow-hidden rounded-[2.5rem]">
                {/* Grid Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="container relative py-8 px-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Donation Requests</h1>
                    <p className="text-green-100 text-lg mb-8">
                        Browse active requests and help those in need
                    </p>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 rounded-full bg-white border-0 shadow-lg"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'secondary'}
                                onClick={() => setFilter('all')}
                                className={`rounded-full px-6 ${filter === 'all' ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30 border-0'}`}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'cash' ? 'default' : 'secondary'}
                                onClick={() => setFilter('cash')}
                                className={`rounded-full px-6 ${filter === 'cash' ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30 border-0'}`}
                            >
                                Cash
                            </Button>
                            <Button
                                variant={filter === 'item' ? 'default' : 'secondary'}
                                onClick={() => setFilter('item')}
                                className={`rounded-full px-6 ${filter === 'item' ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-white/20 text-white hover:bg-white/30 border-0'}`}
                            >
                                Items
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container py-8">
                {/* Loading State */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                        <p className="text-gray-500 mt-1">
                            {searchTerm ? 'Try a different search term' : 'Check back later for new requests'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Request Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((request) => {
                                const progress = getProgress(request);
                                const priorityColors: Record<string, string> = {
                                    high: 'border-l-red-500',
                                    medium: 'border-l-yellow-500',
                                    low: 'border-l-green-500',
                                };
                                const priorityBorderColor = priorityColors[request.priority] || 'border-l-gray-300';

                                return (
                                    <div
                                        key={request._id}
                                        className={`bg-white rounded-xl border-l-4 ${priorityBorderColor} shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            {getPriorityBadge(request.priority)}
                                            <div className="flex flex-col items-center bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                                    {request.createdAt ? new Date(request.createdAt).toLocaleString('default', { month: 'short' }) : '--'}
                                                </span>
                                                <span className="text-lg font-bold text-gray-700 leading-tight">
                                                    {request.createdAt ? new Date(request.createdAt).getDate() : '--'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                                            {request.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                            {request.description}
                                        </p>

                                        {/* Goal/Raised for Cash or Item Count */}
                                        {request.donationType === 'cash' && request.amount ? (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <div>
                                                        <span className="text-gray-500">Goal:</span>
                                                        <span className="font-semibold text-gray-900 ml-1">₹{request.amount.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Raised:</span>
                                                        <span className="font-semibold text-gray-900 ml-1">₹{(request.fulfilledAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {progress && (
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full transition-all"
                                                            style={{ width: `${progress.percentage}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <span className="text-sm text-gray-500">Items needed:</span>
                                                <span className="text-sm font-semibold text-gray-900 ml-1">{request.itemDetails?.length || 0}</span>
                                            </div>
                                        )}

                                        {/* Location & Deadline */}
                                        <div className="text-sm text-gray-500 mb-4 space-y-1">
                                            {request.address?.addressLine1 && (
                                                <p className="line-clamp-1">{request.address.addressLine1}</p>
                                            )}
                                            {request.deadline && (
                                                <p>
                                                    {(() => {
                                                        const now = new Date();
                                                        const end = new Date(request.deadline);
                                                        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                        return diff > 0 ? `${diff} days left` : 'Deadline passed';
                                                    })()}
                                                </p>
                                            )}
                                        </div>

                                        {/* View Details Button */}
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-full border-gray-300 hover:bg-gray-50 mt-auto cursor-pointer"
                                            asChild
                                        >
                                            <Link href={`/requests/${request._id}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="rounded-full"
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="rounded-full"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
