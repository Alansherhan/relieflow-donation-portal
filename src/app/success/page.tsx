'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { portalApi } from '@/lib/api';
import {
    CheckCircle,
    Heart,
    ArrowRight,
    Home,
    History,
    Loader2
} from 'lucide-react';

interface DonationData {
    _id: string;
    donorName: string;
    donorEmail?: string;
    donationType: 'cash' | 'item';
    amount?: number;
    itemDetails?: Array<{ category: string; quantity: string; description?: string; unit?: string }>;
    transactionRef?: string;
    status: string;
    createdAt: string;
    donationRequest?: {
        title: string;
    };
    isWalletDonation?: boolean;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'donation';
    const donationId = searchParams.get('donationId');
    const [donation, setDonation] = useState<DonationData | null>(null);
    const [isLoadingDonation, setIsLoadingDonation] = useState(false);

    useEffect(() => {
        if (donationId) {
            setIsLoadingDonation(true);
            portalApi.getPublicDonationReceipt(donationId)
                .then((response) => {
                    if (response.data.success) {
                        setDonation(response.data.data);
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch donation:', error);
                })
                .finally(() => {
                    setIsLoadingDonation(false);
                });
        }
    }, [donationId]);

    const messages: Record<string, { title: string; description: string }> = {
        cash: {
            title: 'Payment Successful!',
            description: 'Your cash donation has been processed successfully. The funds will be used to help those in need.',
        },
        'self-delivery': {
            title: 'Submission Received!',
            description: 'Your donation has been submitted. Thanks for your support.',
        },
        pickup: {
            title: 'Pickup Requested!',
            description: 'A volunteer will be assigned to pick up your items. They will contact you soon to coordinate the pickup.',
        },
        wallet: {
            title: 'Thank You for Your Generosity!',
            description: 'Your donation to the Relief Fund has been received. These funds will be used for emergency disaster response.',
        },
        donation: {
            title: 'Thank You!',
            description: 'Your donation has been recorded. We appreciate your support in helping those affected by disasters.',
        },
    };

    const content = messages[type] || messages.donation;

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardContent className="pt-10 pb-8 text-center">
                    {/* Success Icon */}
                    <div className="relative inline-flex">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Heart className="h-4 w-4 text-white fill-white" />
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-2xl font-bold mt-6 mb-2">{content.title}</h1>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {content.description}
                    </p>

                    {/* Download Receipt Button */}
                    {donationId && (
                        <div className="mt-6">
                            {isLoadingDonation ? (
                                <Button variant="outline" disabled>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading Receipt...
                                </Button>
                            ) : donation ? (
                                <ReceiptGenerator donation={donation} />
                            ) : null}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
                        <Button asChild>
                            <Link href="/requests">
                                Continue Helping
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/my-donations">
                                <History className="h-4 w-4 mr-2" />
                                View My Donations
                            </Link>
                        </Button>
                    </div>

                    <Button variant="ghost" asChild className="mt-4">
                        <Link href="/">
                            <Home className="h-4 w-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>

                    {/* Social Share (Optional)
                    <div className="mt-8 pt-6 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                            Spread the word and inspire others to help
                        </p>
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm">
                                Share on Twitter
                            </Button>
                            <Button variant="outline" size="sm">
                                Share on Facebook
                            </Button>
                        </div>
                    </div> */}
                </CardContent>
            </Card>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
