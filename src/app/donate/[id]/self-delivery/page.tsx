'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Truck,
    Loader2,
    ArrowLeft,
    Upload,
    Image as ImageIcon,
    X,
    MapPin,
    CheckCircle,
    Copy,
    Navigation,
    Package
} from 'lucide-react';
import { toast } from 'sonner';

interface DonationDetails {
    _id: string;
    status: string;
    proofImage?: string;
    notes?: string;
    donationRequest?: {
        title: string;
        address?: {
            addressLine1?: string;
            addressLine2?: string;
            addressLine3?: string;
            pinCode?: number;
            location?: {
                type: string;
                coordinates: [number, number]; // [lng, lat]
            };
        };
        location?: {
            type: string;
            coordinates: [number, number]; // [lng, lat]
        };
    };
    itemDetails?: Array<{ category: string; description?: string; quantity: number; unit?: string }>;
}

function SelfDeliveryContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [donation, setDonation] = useState<DonationDetails | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const id = params.id as string;
    const fromPage = searchParams.get('from');

    // Determine back navigation - context-aware
    const getBackUrl = useCallback(() => {
        if (fromPage === 'delivery-method') return `/donate/${id}?from=my-donations`;
        if (fromPage === 'requests') return '/requests';
        if (fromPage === 'my-donations') return '/my-donations';
        return '/my-donations'; // default
    }, [fromPage, id]);

    useEffect(() => {
        // Wait for auth to finish loading before checking authentication
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(`/donate/${id}/self-delivery`)}`);
            return;
        }

        const fetchDonation = async () => {
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

        fetchDonation();
    }, [id, isAuthenticated, authLoading, router]);

    // Get the formatted full address
    const getFullAddress = () => {
        const address = donation?.donationRequest?.address;
        if (!address) return '';

        const parts = [
            address.addressLine1,
            address.addressLine2,
            address.addressLine3,
            address.pinCode ? `PIN: ${address.pinCode}` : null
        ].filter(Boolean);

        return parts.join(', ');
    };

    // Get coordinates for map
    const getCoordinates = (): [number, number] | null => {
        // Try to get coordinates from address.location first
        const addressLocation = donation?.donationRequest?.address?.location;
        if (addressLocation?.coordinates && addressLocation.coordinates.length === 2) {
            return addressLocation.coordinates;
        }

        // Fallback to donationRequest.location
        const location = donation?.donationRequest?.location;
        if (location?.coordinates && location.coordinates.length === 2) {
            return location.coordinates;
        }

        return null;
    };

    // Copy address to clipboard
    const handleCopyAddress = async () => {
        const fullAddress = getFullAddress();
        if (fullAddress) {
            try {
                await navigator.clipboard.writeText(fullAddress);
                toast.success('Address copied to clipboard!');
            } catch {
                toast.error('Failed to copy address');
            }
        }
    };

    // Open Google Maps with directions
    const handleGetDirections = () => {
        const coords = getCoordinates();
        const fullAddress = getFullAddress();

        if (coords) {
            // Use coordinates for precise directions
            const [lng, lat] = coords;
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(mapsUrl, '_blank');
        } else if (fullAddress) {
            // Fallback to address search
            const encodedAddress = encodeURIComponent(fullAddress);
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
            window.open(mapsUrl, '_blank');
        } else {
            toast.error('No location available for directions');
        }
    };

    // Generate static map URL
    const getStaticMapUrl = () => {
        const coords = getCoordinates();
        if (!coords) return null;

        const [lng, lat] = coords;
        // Using OpenStreetMap static map (free, no API key needed)
        return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x200&markers=${lat},${lng},red-pushpin`;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setProofImage(null);
        setProofPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitClick = () => {
        if (!proofImage) {
            toast.error('Please upload proof of delivery');
            return;
        }
        setShowSubmitConfirm(true);
    };

    const handleSubmit = async () => {
        setShowSubmitConfirm(false);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('proofImage', proofImage!);
            if (notes) {
                formData.append('notes', notes);
            }

            const response = await portalApi.submitItemDonation(id, formData);

            if (response.data.success) {
                toast.success('Donation submitted! Pending admin verification.');
                router.push(`/success?type=self-delivery&donationId=${id}`);
            } else {
                toast.error('Submission failed. Please try again.');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            toast.error('Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const staticMapUrl = getStaticMapUrl();
    const hasCoordinates = getCoordinates() !== null;
    const hasAddress = Boolean(donation?.donationRequest?.address?.addressLine1);

    if (isLoading || authLoading) {
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
                <Button variant="ghost" className="mb-6" onClick={() => router.push(getBackUrl())}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardContent className="pt-8 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-600">Delivery Completed!</h2>
                            <p className="text-muted-foreground mt-2">
                                Your donation has been submitted and is pending admin verification.
                            </p>
                        </div>

                        {/* Show proof image if available */}
                        {donation.proofImage && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Proof of Delivery:</p>
                                <img 
                                    src={donation.proofImage.startsWith('http') ? donation.proofImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${donation.proofImage}`}
                                    alt="Delivery proof"
                                    className="max-w-xs mx-auto rounded-lg border"
                                />
                            </div>
                        )}

                        {/* Show notes if available */}
                        {donation.notes && (
                            <div className="text-left bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium mb-1">Your Notes:</p>
                                <p className="text-sm text-muted-foreground">{donation.notes}</p>
                            </div>
                        )}

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

    return (
        <div className="container py-8 max-w-2xl">
            {/* Back Button */}
            <Button variant="ghost" className="mb-6" onClick={() => router.push(getBackUrl())}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-100">
                            <Truck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle>Self Delivery</CardTitle>
                            <CardDescription>
                                Deliver the items and upload proof of delivery
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Delivery Location Section */}
                    {hasAddress ? (
                        <div className="border rounded-xl overflow-hidden">
                            {/* Address Details */}
                            <div className="p-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                        <MapPin className="h-5 w-5 text-red-500" />
                                        Delivery Address
                                    </h3>
                                    <div className="text-foreground space-y-1 pl-7">
                                        {donation?.donationRequest?.address?.addressLine1 && (
                                            <p className="font-medium">{donation.donationRequest.address.addressLine1}</p>
                                        )}
                                        {donation?.donationRequest?.address?.addressLine2 && (
                                            <p>{donation.donationRequest.address.addressLine2}</p>
                                        )}
                                        {donation?.donationRequest?.address?.addressLine3 && (
                                            <p>{donation.donationRequest.address.addressLine3}</p>
                                        )}
                                        {donation?.donationRequest?.address?.pinCode && (
                                            <p className="text-muted-foreground">PIN: {donation.donationRequest.address.pinCode}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="default"
                                        className="flex-1"
                                        onClick={handleCopyAddress}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Address
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="default"
                                        className="flex-1"
                                        onClick={handleGetDirections}
                                    >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Get Directions
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-xl p-4 bg-amber-50/50 border-amber-200">
                            <div className="flex items-center gap-2 text-amber-800">
                                <MapPin className="h-5 w-5" />
                                <span className="font-medium">Delivery address not specified</span>
                            </div>
                            <p className="text-sm text-amber-700 mt-2 ml-7">
                                Please contact the requester for delivery location details.
                            </p>
                        </div>
                    )}

                    {/* Items to Deliver */}
                    {donation?.itemDetails && donation.itemDetails.length > 0 && (
                        <div className="border rounded-xl p-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                <Package className="h-5 w-5 text-primary" />
                                Items to Deliver
                            </h3>
                            <div className="space-y-2">
                                {donation.itemDetails.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="capitalize font-medium">{item.category}</span>
                                            {item.description && (
                                                <span className="text-sm text-muted-foreground">
                                                    - {item.description}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                            ×{item.quantity} {item.unit || 'pieces'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Proof Upload */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium">Proof of Delivery *</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                            Upload a photo showing the delivered items at the location
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />

                        {proofPreview ? (
                            <div className="relative rounded-xl overflow-hidden">
                                <img
                                    src={proofPreview}
                                    alt="Proof preview"
                                    className="w-full h-56 object-cover"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-3 right-3 rounded-full"
                                    onClick={removeImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <ImageIcon className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
                                <p className="font-medium text-lg">Click to upload proof image</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Take a clear photo showing the delivered items
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    JPG, PNG up to 10MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-base font-medium">Additional Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional information about the delivery..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        className="w-full h-12 text-lg"
                        size="lg"
                        onClick={handleSubmitClick}
                        disabled={!proofImage || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 mr-2" />
                                Submit Delivery Proof
                            </>
                        )}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Your submission will be reviewed and verified by an admin
                    </p>
                </CardContent>
            </Card>

            {/* Submit Confirmation Dialog */}
            <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Self Delivery Submission</DialogTitle>
                        <DialogDescription>
                            Please confirm that you have successfully delivered the items to the recipient.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="font-medium">Ready to submit?</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Make sure you have uploaded clear proof of delivery. This submission will be sent for admin verification.
                            </p>
                        </div>
                        {donation?.donationRequest?.address && (
                            <div className="text-sm">
                                <p className="font-medium mb-1">Delivery Address:</p>
                                <div className="text-muted-foreground">
                                    {donation.donationRequest.address.addressLine1}
                                    {donation.donationRequest.address.addressLine2 && (
                                        <div>{donation.donationRequest.address.addressLine2}</div>
                                    )}
                                    {donation.donationRequest.address.addressLine3 && (
                                        <div>{donation.donationRequest.address.addressLine3}</div>
                                    )}
                                    {donation.donationRequest.address.pinCode && (
                                        <div>PIN: {donation.donationRequest.address.pinCode}</div>
                                    )}
                                </div>
                            </div>
                        )}
                        {proofImage && (
                            <div className="text-sm">
                                <p className="font-medium mb-1">Proof uploaded:</p>
                                <p className="text-muted-foreground">{proofImage.name}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSubmitConfirm(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Confirm & Submit'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function SelfDeliveryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SelfDeliveryContent />
        </Suspense>
    );
}
