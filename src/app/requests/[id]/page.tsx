'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CircleDollarSign,
    Package,
    MapPin,
    Calendar,
    Loader2,
    ArrowLeft,
    Clock,
    User,
    CheckCircle,
    Minus,
    Plus,
    Truck,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface DonationRequest {
    _id: string;
    title: string;
    description: string;
    donationType: 'cash' | 'item';
    amount?: number;
    fulfilledAmount?: number;
    itemDetails?: Array<{ _id?: string; category: string; description?: string; quantity: number; fulfilledQuantity?: number; unit?: string }>;
    priority: 'low' | 'medium' | 'high';
    status: string;
    deadline?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
    };
    upiNumber?: string;
    createdAt: string;
    requestedUser?: {
        name: string;
    };
}

// User's active (in-progress) donation for this request
interface MyActiveDonation {
    _id: string;
    status: 'pending_payment' | 'pending_delivery' | 'awaiting_volunteer' | 'pickup_scheduled';
    deliveryMethod?: 'self_delivery' | 'pickup';
    itemDetails?: Array<{ category: string; quantity: number; unit?: string }>;
}

// Active pickup information for this request
interface ActivePickupInfo {
    status: 'awaiting_volunteer' | 'pickup_scheduled';
    volunteerName?: string;
    volunteerPhone?: string;
}

export default function RequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [request, setRequest] = useState<DonationRequest | null>(null);
    const [myActiveDonation, setMyActiveDonation] = useState<MyActiveDonation | null>(null);
    const [activePickupInfo, setActivePickupInfo] = useState<ActivePickupInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    // Partial donation states
    const [donationMode, setDonationMode] = useState<'full' | 'partial'>('full');
    const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({});

    // Delivery method states (for item donations)
    const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
    const [showSelfDeliveryConfirm, setShowSelfDeliveryConfirm] = useState(false);

    const id = params.id as string;

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await portalApi.getPublicDonationRequest(id);
                if (response.data.success) {
                    const requestData = response.data.data;
                    setRequest(requestData);

                    // Set active donation if present (for authenticated users)
                    if (response.data.myActiveDonation) {
                        setMyActiveDonation(response.data.myActiveDonation);
                    }

                    // Set active pickup info if present
                    if (response.data.activePickupInfo) {
                        setActivePickupInfo(response.data.activePickupInfo);
                    }

                    // Try to restore saved quantities from sessionStorage (after login redirect)
                    const savedDataKey = `donation_form_${id}`;
                    const savedData = sessionStorage.getItem(savedDataKey);
                    
                    if (savedData) {
                        try {
                            const { quantities, mode } = JSON.parse(savedData);
                            setCustomQuantities(quantities);
                            setDonationMode(mode);
                            // Clear saved data after restoration
                            sessionStorage.removeItem(savedDataKey);
                            toast.success('Your selections have been restored');
                        } catch (e) {
                            console.error('Failed to restore saved data:', e);
                        }
                    } else {
                        // Initialize customQuantities with remaining quantities
                        if (requestData.itemDetails) {
                            const initialQuantities: Record<number, number> = {};
                            requestData.itemDetails.forEach((item: { quantity: number; fulfilledQuantity?: number }, idx: number) => {
                                const remaining = item.quantity - (item.fulfilledQuantity || 0);
                                initialQuantities[idx] = Math.max(0, remaining);
                            });
                            setCustomQuantities(initialQuantities);
                        }
                    }
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

    const handleAccept = async (deliveryMethod?: 'self_delivery' | 'pickup', overrideMode?: 'full' | 'partial') => {
        if (!isAuthenticated) {
            // Save current state before redirecting to login
            const savedDataKey = `donation_form_${id}`;
            sessionStorage.setItem(savedDataKey, JSON.stringify({
                quantities: customQuantities,
                mode: overrideMode || donationMode
            }));
            toast.info('Please log in to accept this request');
            router.push(`/login?redirect=/requests/${id}`);
            return;
        }

        // For item donations, require delivery method selection first
        if (request?.donationType === 'item' && !deliveryMethod) {
            setShowDeliveryOptions(true);
            return;
        }

        setIsAccepting(true);
        try {
            // Use override mode if provided, otherwise use current donationMode
            const effectiveMode = overrideMode || donationMode;
            
            // Build itemDetails with correct quantities (remaining for "full", custom for "partial")
            let itemDetails = undefined;
            if (request?.donationType === 'item' && request.itemDetails) {
                itemDetails = request.itemDetails
                    .map((item, idx) => {
                        // In partial mode use customQuantities, in full mode use remaining
                        const remaining = item.quantity - (item.fulfilledQuantity || 0);
                        const qty = effectiveMode === 'partial'
                            ? (customQuantities[idx] ?? remaining)
                            : remaining;
                        return {
                            ...item,
                            // Pass the original request item _id so the backend can
                            // match fulfilled quantities to the correct item even
                            // when multiple items share the same category
                            requestItemId: item._id,
                            quantity: qty
                        };
                    })
                    .filter(item => item.quantity > 0); // Only include items with quantity > 0
            }

            // For pickup: create donation with self_delivery first, then redirect to pickup page
            // This avoids the need to collect pickup details inline without a map picker
            const actualDeliveryMethod = deliveryMethod === 'pickup' ? 'self_delivery' : deliveryMethod;

            const response = await portalApi.acceptDonationRequest({
                donationRequestId: id,
                donationType: request!.donationType,
                amount: request?.amount,
                itemDetails,
                deliveryMethod: request?.donationType === 'item' ? actualDeliveryMethod : undefined,
            });

            if (response.data.success) {
                const donationId = response.data.data._id;

                // Show appropriate success message
                if (request?.donationType === 'cash') {
                    // Redirect to cash donation page where user can enter custom amount
                    toast.success('Request accepted! Proceed with your payment.');
                    router.push(`/donate/${donationId}/cash?from=requests`);
                } else if (deliveryMethod === 'pickup') {
                    // Redirect to pickup page with map picker for full experience
                    toast.success('Donation accepted! Please provide pickup details.');
                    router.push(`/donate/${donationId}/pickup?from=requests`);
                } else {
                    // Self-delivery - redirect to completion page
                    toast.success('Donation accepted! Please complete your delivery.');
                    router.push(`/donate/${donationId}/self-delivery?from=requests`);
                }
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
            toast.error('Failed to accept request. Please try again.');
        } finally {
            setIsAccepting(false);
            setShowDeliveryOptions(false);
        }
    };

    const handleQuickDonate = () => {
        // For guests - redirect to guest donation flow
        router.push(`/donate/guest/${id}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="container py-8">
                <div className="text-center py-20">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium">Request not found</h3>
                    <Button asChild className="mt-4">
                        <Link href="/requests">Back to Requests</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const progress = request.donationType === 'cash' && request.amount
        ? {
            fulfilled: request.fulfilledAmount || 0,
            total: request.amount,
            percentage: Math.min(((request.fulfilledAmount || 0) / request.amount) * 100, 100),
        }
        : null;

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
            high: { variant: 'destructive', label: 'Urgent' },
            medium: { variant: 'default', label: 'Medium Priority' },
            low: { variant: 'secondary', label: 'Low Priority' },
        };
        const config = variants[priority] || { variant: 'secondary' as const, label: priority };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="container py-8">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/requests">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Requests
                </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl">{request.title}</CardTitle>
                                    <CardDescription className="mt-2 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Requested by {request.requestedUser?.name || 'Anonymous'}
                                    </CardDescription>
                                </div>
                                {getPriorityBadge(request.priority)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="font-medium mb-2">About this request</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {request.description}
                                </p>
                            </div>

                            <Separator />

                            {/* Request Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    {request.donationType === 'cash' ? (
                                        <div className="p-2 rounded-full bg-green-100">
                                            <CircleDollarSign className="h-5 w-5 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="p-2 rounded-full bg-blue-100">
                                            <Package className="h-5 w-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Donation Type</p>
                                        <p className="font-medium capitalize">{request.donationType}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-purple-100">
                                        <Clock className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Posted</p>
                                        <p className="font-medium">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {request.deadline && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-orange-100">
                                            <Calendar className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Needed By</p>
                                            <p className="font-medium">
                                                {new Date(request.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {request.address?.addressLine1 && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-pink-100">
                                            <MapPin className="h-5 w-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{request.address.addressLine1}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Items List for Item Donations */}
                            {request.donationType === 'item' && request.itemDetails && request.itemDetails.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-medium mb-3">Items Needed</h3>
                                        <div className="space-y-3">
                                            {request.itemDetails.map((item, index) => {
                                                const fulfilled = item.fulfilledQuantity || 0;
                                                const total = item.quantity;
                                                const percentage = total > 0 ? Math.min((fulfilled / total) * 100, 100) : 0;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="p-3 bg-muted rounded-lg space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium capitalize">{item.description || item.category}</p>
                                                                <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                                                            </div>
                                                            <Badge variant={fulfilled >= total ? "default" : "outline"}>
                                                                {fulfilled}/{total} {item.unit || 'pieces'}
                                                            </Badge>
                                                        </div>
                                                        {/* Progress bar */}
                                                        <div className="h-2 bg-background rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${fulfilled >= total ? 'bg-green-500' : 'bg-primary'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Donation Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Make a Donation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Active Pickup Status Banner (for all users) */}
                            {activePickupInfo && !myActiveDonation && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <Truck className="h-5 w-5" />
                                        <span className="font-medium">
                                            {activePickupInfo.status === 'pickup_scheduled'
                                                ? 'Volunteer Assigned'
                                                : 'Pickup Requested'}
                                        </span>
                                    </div>
                                    {activePickupInfo.status === 'pickup_scheduled' && activePickupInfo.volunteerName && (
                                        <div className="text-sm text-blue-700">
                                            <p>{activePickupInfo.volunteerName} will reach the donor for pickup.</p>
                                            {activePickupInfo.volunteerPhone && (
                                                <p className="mt-1">Contact: {activePickupInfo.volunteerPhone}</p>
                                            )}
                                        </div>
                                    )}
                                    {activePickupInfo.status === 'awaiting_volunteer' && (
                                        <p className="text-sm text-blue-700">
                                            Waiting for a volunteer to accept this pickup request.
                                        </p>
                                    )}
                                </div>
                            )}
                            {/* Active Donation Banner */}
                            {myActiveDonation && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <Truck className="h-5 w-5" />
                                        <span className="font-medium">
                                            {myActiveDonation.status === 'pending_payment'
                                                ? 'You have a pending payment'
                                                : myActiveDonation.status === 'pending_delivery'
                                                ? 'You have a pending delivery'
                                                : myActiveDonation.status === 'pickup_scheduled'
                                                ? 'Volunteer assigned - pickup scheduled'
                                                : 'Pickup requested - awaiting volunteer'}
                                        </span>
                                    </div>

                                    {/* Items committed */}
                                    {myActiveDonation.itemDetails && myActiveDonation.itemDetails.length > 0 && (
                                        <div className="text-sm text-amber-700">
                                            <p className="mb-1">Items you committed:</p>
                                            <ul className="list-disc list-inside">
                                                {myActiveDonation.itemDetails.map((item, idx) => (
                                                    <li key={idx} className="capitalize">
                                                        {item.quantity} {item.unit || 'pieces'} {item.category}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {myActiveDonation.status === 'pending_payment' ? (
                                        <Button
                                            className="w-full"
                                            onClick={() => router.push(`/donate/${myActiveDonation._id}/cash?from=requests`)}
                                        >
                                            <ArrowRight className="h-4 w-4 mr-2" />
                                            Complete Payment
                                        </Button>
                                    ) : myActiveDonation.status === 'pending_delivery' ? (
                                        <Button
                                            className="w-full"
                                            onClick={() => router.push(`/donate/${myActiveDonation._id}/self-delivery?from=requests`)}
                                        >
                                            <ArrowRight className="h-4 w-4 mr-2" />
                                            Continue Delivery
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => router.push('/my-donations')}
                                        >
                                            View My Donations
                                        </Button>
                                    )}
                                </div>
                            )}
                            {/* Amount & Progress */}
                            {request.donationType === 'cash' && (
                                <div>
                                    <div className="text-3xl font-bold">
                                        ₹{request.amount?.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Goal amount</p>

                                    {progress && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-muted-foreground">
                                                    ₹{progress.fulfilled.toLocaleString()} raised
                                                </span>
                                                <span className="font-medium">
                                                    {Math.round(progress.percentage)}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {request.status === 'completed' || (request.donationType === 'cash' && request.amount && (request.fulfilledAmount || 0) >= request.amount) ? (
                                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">This request has been fulfilled</span>
                                </div>
                            ) : (
                                <>
                                    {/* Item Donation Mode Toggle */}
                                    {request.donationType === 'item' && request.itemDetails && request.itemDetails.length > 0 && (
                                        <div className="space-y-4">
                                            {/* Full/Partial Toggle */}
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setDonationMode('full');
                                                        handleAccept(undefined, 'full');
                                                    }}
                                                    disabled={isAccepting}
                                                >
                                                    {isAccepting && donationMode === 'full' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                    Donate All
                                                </Button>
                                                <Button
                                                    variant={donationMode === 'partial' ? 'default' : 'outline'}
                                                    className="flex-1"
                                                    onClick={() => setDonationMode(donationMode === 'partial' ? 'full' : 'partial')}
                                                >
                                                    Customize
                                                </Button>
                                            </div>

                                            {/* Quantity Inputs for Partial Mode */}
                                            {donationMode === 'partial' && (
                                                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-sm font-medium">Select quantities:</p>
                                                    {request.itemDetails.map((item, idx) => {
                                                        const currentQty = customQuantities[idx] ?? item.quantity;
                                                        const maxQty = item.quantity - (item.fulfilledQuantity || 0);
                                                        return (
                                                            <div key={idx} className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium capitalize truncate">{item.description || item.category}</p>
                                                                    <p className="text-xs text-muted-foreground capitalize">
                                                                        {item.category} • {item.fulfilledQuantity || 0}/{item.quantity} fulfilled
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => setCustomQuantities(prev => ({
                                                                            ...prev,
                                                                            [idx]: Math.max(0, (prev[idx] ?? item.quantity) - 1)
                                                                        }))}
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </Button>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        max={maxQty}
                                                                        value={currentQty}
                                                                        onChange={(e) => setCustomQuantities(prev => ({
                                                                            ...prev,
                                                                            [idx]: Math.min(maxQty, Math.max(0, parseInt(e.target.value) || 0))
                                                                        }))}
                                                                        className="w-14 h-7 text-center text-sm px-1"
                                                                    />
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => setCustomQuantities(prev => ({
                                                                            ...prev,
                                                                            [idx]: Math.min(maxQty, (prev[idx] ?? item.quantity) + 1)
                                                                        }))}
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <Button
                                                        className="w-full mt-2"
                                                        onClick={() => handleAccept()}
                                                        disabled={isAccepting}
                                                    >
                                                        {isAccepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                        Proceed with Selected Items
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Delivery Method Selection (shown after clicking Donate) */}
                                    {showDeliveryOptions && request.donationType === 'item' && (
                                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                                            <p className="font-medium text-center">How will you deliver?</p>

                                            <div className="space-y-3">
                                                <Button
                                                    className="w-full justify-start h-auto py-3"
                                                    variant="outline"
                                                    onClick={() => setShowSelfDeliveryConfirm(true)}
                                                    disabled={isAccepting}
                                                >
                                                    <div className="text-left">
                                                        <div className="font-medium">🚗 Confirm Self Delivery</div>
                                                        <div className="text-xs text-muted-foreground">I&apos;ll drop off the items myself</div>
                                                    </div>
                                                </Button>

                                                <Button
                                                    className="w-full justify-start h-auto py-3"
                                                    variant="outline"
                                                    onClick={() => handleAccept('pickup')}
                                                    disabled={isAccepting}
                                                >
                                                    <div className="text-left">
                                                        <div className="font-medium">🚐 Request Pickup</div>
                                                        <div className="text-xs text-muted-foreground">A volunteer will collect from your location</div>
                                                    </div>
                                                </Button>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="w-full"
                                                onClick={() => setShowDeliveryOptions(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}

                                    {/* Accept button for cash donations */}
                                    {request.donationType === 'cash' && (
                                        <Button
                                            className="w-full"
                                            size="lg"
                                            onClick={() => handleAccept()}
                                            disabled={isAccepting}
                                        >
                                            {isAccepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            {isAuthenticated ? 'Accept & Donate' : 'Login to Donate'}
                                        </Button>
                                    )}

                                    {request.donationType === 'cash' && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleQuickDonate}
                                        >
                                            Quick Donate (Guest)
                                        </Button>
                                    )}

                                    <p className="text-xs text-center text-muted-foreground">
                                        {isAuthenticated
                                            ? 'You can track your donation after accepting'
                                            : 'Create an account to track your donations'
                                        }
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* UPI Info for Cash */}
                    {request.donationType === 'cash' && request.upiNumber && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">UPI Payment Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-mono text-sm bg-muted p-2 rounded">
                                    {request.upiNumber}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Self Delivery Confirmation Dialog */}
            <Dialog open={showSelfDeliveryConfirm} onOpenChange={setShowSelfDeliveryConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Self Delivery</DialogTitle>
                        <DialogDescription>
                            You are committing to deliver the items yourself to the following address:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    {request?.address && (
                                        <div>
                                            {request.address.addressLine1}
                                            {request.address.addressLine2 && <div>{request.address.addressLine2}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-2">Please note:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>You will need to upload proof of delivery</li>
                                <li>Make sure you deliver to the correct address</li>
                                <li>After delivery, submit the proof for verification</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSelfDeliveryConfirm(false)}
                            disabled={isAccepting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowSelfDeliveryConfirm(false);
                                handleAccept('self_delivery');
                            }}
                            disabled={isAccepting}
                        >
                            {isAccepting ? 'Processing...' : 'Confirm & Proceed'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
