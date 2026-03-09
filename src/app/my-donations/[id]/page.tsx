'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    XCircle,
    Truck,
    FileText,
    Phone,
    Mail,
    CreditCard,
    CalendarClock,
    NotebookText,
    ImageIcon,
    Wallet,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface DonationDetail {
    _id: string;
    donationType: 'cash' | 'item';
    amount?: number;
    itemDetails?: Array<{
        category: string;
        description?: string;
        quantity: number;
        unit?: string;
    }>;
    status: string;
    deliveryMethod?: 'self_delivery' | 'pickup' | 'not_applicable';
    transactionRef?: string;
    createdAt: string;
    updatedAt: string;
    donorName?: string;
    donorEmail?: string;
    donorPhone?: string;
    pickupAddress?: { addressLine1?: string; addressLine2?: string };
    pickupLocation?: { type: 'Point'; coordinates: [number, number] };
    pickupDate?: string;
    pickupNotes?: string;
    proofImage?: string;
    notes?: string;
    donationRequest?: {
        _id: string;
        title: string;
        description?: string;
        address?: { addressLine1?: string; addressLine2?: string };
        priority?: string;
    };
    pickupTask?: {
        _id: string;
        volunteer?: { name: string; phoneNumber?: string };
        status?: string;
        scheduledDate?: string;
    };
    isWalletDonation: boolean;
}

export default function DonationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [donation, setDonation] = useState<DonationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const id = params.id as string;

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchDonation = async () => {
            if (!isAuthenticated || !id) return;

            try {
                const response = await portalApi.getDonation(id);
                if (response.data.success) {
                    setDonation(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch donation:', error);
                toast.error('Failed to load donation details');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchDonation();
        }
    }, [isAuthenticated, id]);

    const handleCancel = async () => {
        if (!donation) return;

        setIsCancelling(true);
        try {
            await portalApi.cancelDonation(donation._id);
            toast.success('Donation cancelled successfully');
            router.push('/my-donations');
        } catch (error) {
            console.error('Failed to cancel donation:', error);
            toast.error('Failed to cancel donation');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode; color: string }> = {
            pending_payment: {
                variant: 'outline',
                label: 'Pending Payment',
                icon: <CircleDollarSign className="h-5 w-5" />,
                color: 'text-orange-600 bg-orange-50'
            },
            pending_delivery: {
                variant: 'outline',
                label: 'Pending Delivery',
                icon: <Truck className="h-5 w-5" />,
                color: 'text-blue-600 bg-blue-50'
            },
            awaiting_volunteer: {
                variant: 'secondary',
                label: 'Awaiting Volunteer',
                icon: <Clock className="h-5 w-5" />,
                color: 'text-yellow-600 bg-yellow-50'
            },
            pickup_scheduled: {
                variant: 'default',
                label: 'Pickup Scheduled',
                icon: <MapPin className="h-5 w-5" />,
                color: 'text-purple-600 bg-purple-50'
            },
            completed: {
                variant: 'default',
                label: 'Completed',
                icon: <CheckCircle className="h-5 w-5" />,
                color: 'text-green-600 bg-green-50'
            },
            cancelled: {
                variant: 'destructive',
                label: 'Cancelled',
                icon: <XCircle className="h-5 w-5" />,
                color: 'text-red-600 bg-red-50'
            },
        };
        return configs[status] || { variant: 'secondary' as const, label: status, icon: <Package className="h-5 w-5" />, color: 'text-gray-600 bg-gray-50' };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const canCancel = donation && ['pending_payment', 'pending_delivery', 'awaiting_volunteer'].includes(donation.status);

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!donation) {
        return (
            <div className="container py-8">
                <Button variant="ghost" asChild className="mb-6">
                    <Link href="/my-donations">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to My Donations
                    </Link>
                </Button>
                <Card>
                    <CardContent className="py-20 text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium">Donation not found</h3>
                        <p className="text-muted-foreground mt-1">
                            This donation may have been deleted or you don&apos;t have access to view it.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = getStatusConfig(donation.status);

    return (
        <div className="container py-8 max-w-4xl">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/my-donations">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Donations
                </Link>
            </Button>

            {/* Header Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-4 rounded-full ${statusConfig.color}`}>
                                {donation.donationType === 'cash' ? (
                                    <CircleDollarSign className="h-8 w-8" />
                                ) : (
                                    <Package className="h-8 w-8" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-2xl">
                                    {donation.isWalletDonation
                                        ? 'Direct Fund Donation'
                                        : donation.donationRequest?.title || 'Donation'
                                    }
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {donation.donationType === 'cash' ? 'Cash Donation' : 'Item Donation'}
                                    {donation.isWalletDonation && ' to Relief Fund'}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
                            {statusConfig.label}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Donation Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Donation Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {donation.donationType === 'cash' ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-semibold text-xl text-green-600">
                                        ₹{donation.amount?.toLocaleString()}
                                    </span>
                                </div>
                                {donation.transactionRef && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <CreditCard className="h-4 w-4" />
                                            Transaction Ref
                                        </span>
                                        <span className="font-mono text-sm">{donation.transactionRef}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="text-muted-foreground mb-2">Items Donated</div>
                                <div className="space-y-2">
                                    {donation.itemDetails?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <div>
                                                <span className="font-medium capitalize">{item.category}</span>
                                                {item.description && (
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                )}
                                            </div>
                                            <Badge variant="secondary">
                                                {item.quantity} {item.unit || 'units'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                {donation.deliveryMethod && donation.deliveryMethod !== 'not_applicable' && (
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Truck className="h-4 w-4" />
                                            Delivery Method
                                        </span>
                                        <span className="capitalize">
                                            {donation.deliveryMethod === 'self_delivery' ? 'Self Delivery' : 'Volunteer Pickup'}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        <Separator />

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created
                            </span>
                            <span className="text-sm">{formatDate(donation.createdAt)}</span>
                        </div>

                        {donation.updatedAt !== donation.createdAt && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <CalendarClock className="h-4 w-4" />
                                    Last Updated
                                </span>
                                <span className="text-sm">{formatDate(donation.updatedAt)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {statusConfig.icon}
                            Status Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`p-4 rounded-lg ${statusConfig.color}`}>
                            <div className="font-medium">{statusConfig.label}</div>
                            <p className="text-sm mt-1 opacity-80">
                                {donation.status === 'pending_payment' && 'Complete your payment to proceed with the donation.'}
                                {donation.status === 'pending_delivery' && 'Please deliver your items to the specified location.'}
                                {donation.status === 'awaiting_volunteer' && 'Waiting for a volunteer to be assigned for pickup.'}
                                {donation.status === 'pickup_scheduled' && 'A volunteer has been assigned and will pick up your donation.'}
                                {donation.status === 'completed' && 'Your donation has been received. Thank you for your generosity!'}
                                {donation.status === 'cancelled' && 'This donation has been cancelled.'}
                            </p>
                        </div>

                        {donation.notes && (
                            <div>
                                <span className="text-muted-foreground flex items-center gap-1 mb-2">
                                    <NotebookText className="h-4 w-4" />
                                    Notes
                                </span>
                                <p className="text-sm bg-muted p-3 rounded-lg">{donation.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pickup Information (if applicable) */}
                {donation.deliveryMethod === 'pickup' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Pickup Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {donation.pickupAddress && (
                                <div>
                                    <span className="text-muted-foreground text-sm">Pickup Address</span>
                                    <p className="mt-1">
                                        {donation.pickupAddress.addressLine1}
                                        {donation.pickupAddress.addressLine2 && (
                                            <>, {donation.pickupAddress.addressLine2}</>
                                        )}
                                    </p>
                                </div>
                            )}

                            {donation.pickupDate && (
                                <div>
                                    <span className="text-muted-foreground text-sm">Preferred Pickup Date</span>
                                    <p className="mt-1">{formatDate(donation.pickupDate)}</p>
                                </div>
                            )}

                            {donation.pickupNotes && (
                                <div>
                                    <span className="text-muted-foreground text-sm">Pickup Notes</span>
                                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{donation.pickupNotes}</p>
                                </div>
                            )}

                            {donation.pickupTask?.volunteer && (
                                <>
                                    <Separator />
                                    <div>
                                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            Assigned Volunteer
                                        </span>
                                        <p className="mt-1 font-medium">{donation.pickupTask.volunteer.name}</p>
                                        {donation.pickupTask.volunteer.phoneNumber && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <Phone className="h-3 w-3" />
                                                {donation.pickupTask.volunteer.phoneNumber}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Linked Donation Request */}
                {donation.donationRequest && !donation.isWalletDonation && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Linked Request
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-muted-foreground text-sm">Request Title</span>
                                <p className="mt-1 font-medium">{donation.donationRequest.title}</p>
                            </div>

                            {donation.donationRequest.description && (
                                <div>
                                    <span className="text-muted-foreground text-sm">Description</span>
                                    <p className="mt-1 text-sm">{donation.donationRequest.description}</p>
                                </div>
                            )}

                            {donation.donationRequest.address && (
                                <div>
                                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        Delivery Location
                                    </span>
                                    <p className="mt-1 text-sm">
                                        {donation.donationRequest.address.addressLine1}
                                        {donation.donationRequest.address.addressLine2 && (
                                            <>, {donation.donationRequest.address.addressLine2}</>
                                        )}
                                    </p>
                                </div>
                            )}

                            <Button variant="outline" size="sm" asChild className="w-full">
                                <Link href={`/requests/${donation.donationRequest._id}`}>
                                    View Request Details
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Wallet Donation Info */}
                {donation.isWalletDonation && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Direct Fund Donation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                This donation was made directly to the relief fund wallet. 
                                The funds will be used by administrators to support various relief efforts.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Proof Image */}
                {donation.proofImage && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Proof of Donation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={donation.proofImage.startsWith('http') ? donation.proofImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${donation.proofImage}`}
                                    alt="Proof of donation"
                                    // fill
                                    className="object-contain"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Action Buttons */}
            <Card className="mt-6">
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-3">
                        {donation.status === 'pending_payment' && (
                            <Button asChild>
                                <Link href={`/donate/${donation._id}/cash?from=my-donations`}>
                                    <CircleDollarSign className="h-4 w-4 mr-2" />
                                    Complete Payment
                                </Link>
                            </Button>
                        )}

                        {donation.status === 'pending_delivery' && (
                            <Button asChild>
                                <Link href={`/donate/${donation._id}/self-delivery?from=my-donations`}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Complete Delivery
                                </Link>
                            </Button>
                        )}

                        {donation.status === 'completed' && (
                            <Button variant="outline" asChild>
                                <Link href={`/success?donationId=${donation._id}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Receipt
                                </Link>
                            </Button>
                        )}

                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={() => setShowCancelConfirm(true)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Cancel Donation
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel donation?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this donation? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowCancelConfirm(false)}
                        >
                            Keep donation
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                setShowCancelConfirm(false);
                                await handleCancel();
                            }}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Yes, cancel donation'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
