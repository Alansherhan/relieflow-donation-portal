'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { portalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    MapPin,
    Loader2,
    ArrowLeft,
    Image as ImageIcon,
    X,
    Calendar,
    Phone,
    CheckCircle,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import('@/components/location-picker').then((mod) => mod.LocationPicker),
    { ssr: false, loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse" /> }
);

interface DonationStatus {
    _id: string;
    status: string;
    pickupAddress?: {
        addressLine1?: string;
    };
    pickupDate?: string;
}

function PickupRequestContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [donation, setDonation] = useState<DonationStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        pinCode: '',
        pickupDate: '',
        pickupNotes: '',
        contactPhone: '',
    });

    // Location state for GPS coordinates
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string>('');

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
        if (!isAuthenticated) {
            router.push('/login');
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

        // Pre-fill phone if available
        if (user?.phoneNumber) {
            setFormData(prev => ({ ...prev, contactPhone: user.phoneNumber || '' }));
        }
    }, [id, isAuthenticated, router, user]);

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

    const handleSubmit = async () => {
        if (!formData.addressLine1 || !formData.city) {
            toast.error('Please enter your pickup address');
            return;
        }

        if (!formData.contactPhone) {
            toast.error('Please enter a contact phone number');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();

            // Add pickup address with location coordinates
            const pickupAddressData: any = {
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                addressLine3: formData.city,
                pinCode: formData.pinCode ? parseInt(formData.pinCode) : undefined,
            };

            // Add GPS coordinates if available
            if (location) {
                pickupAddressData.location = {
                    type: 'Point',
                    coordinates: [location.longitude, location.latitude]
                };
            }

            formDataToSend.append('pickupAddress', JSON.stringify(pickupAddressData));

            // Send pickupLocation separately for the Task (volunteer navigation)
            if (location) {
                formDataToSend.append('pickupLocation', JSON.stringify({
                    type: 'Point',
                    coordinates: [location.longitude, location.latitude]
                }));
            }

            if (formData.pickupDate) {
                formDataToSend.append('pickupDate', formData.pickupDate);
            }

            formDataToSend.append('pickupNotes', `Contact: ${formData.contactPhone}. ${formData.pickupNotes}`);

            if (proofImage) {
                formDataToSend.append('proofImage', proofImage);
            }

            const response = await portalApi.requestPickup(id, formDataToSend);

            if (response.data.success) {
                toast.success('Pickup requested! A volunteer will contact you soon.');
                router.push(`/success?type=pickup&donationId=${id}`);
            } else {
                toast.error('Request failed. Please try again.');
            }
        } catch (error) {
            console.error('Request failed:', error);
            toast.error('Request failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If pickup has already been requested or completed, show appropriate message
    if (donation?.status === 'awaiting_volunteer' || donation?.status === 'pickup_scheduled' || donation?.status === 'completed') {
        const isCompleted = donation.status === 'completed';
        const isScheduled = donation.status === 'pickup_scheduled';
        
        return (
            <div className="container py-8 max-w-2xl">
                {/* Back Button */}
                <Button variant="ghost" className="mb-6" onClick={() => router.push(getBackUrl())}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardContent className="pt-8 text-center space-y-6">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                            {isCompleted ? (
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            ) : (
                                <Clock className="h-10 w-10 text-amber-600" />
                            )}
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                                {isCompleted 
                                    ? 'Pickup Completed!' 
                                    : isScheduled 
                                        ? 'Pickup Scheduled'
                                        : 'Pickup Requested'}
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                {isCompleted 
                                    ? 'Your donation has been picked up. Thank you!'
                                    : isScheduled
                                        ? 'A volunteer has been assigned and will contact you soon.'
                                        : 'Your pickup request is being processed. A volunteer will contact you soon.'}
                            </p>
                        </div>

                        {donation.pickupAddress?.addressLine1 && (
                            <div className="text-left bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium mb-1">Pickup Address:</p>
                                <p className="text-sm text-muted-foreground">{donation.pickupAddress.addressLine1}</p>
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

    // Get tomorrow's date as minimum for pickup
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

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
                        <div className="p-3 rounded-full bg-purple-100">
                            <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Request Pickup</CardTitle>
                            <CardDescription>
                                A volunteer will pick up the items from your location
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Location Picker */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Pickup Location</h3>
                        <LocationPicker
                            onLocationSelect={(loc) => {
                                setLocation({
                                    latitude: loc.latitude,
                                    longitude: loc.longitude,
                                });
                                setSelectedAddress(loc.address);
                                // Auto-fill address fields
                                setFormData(prev => ({
                                    ...prev,
                                    addressLine1: loc.addressLine1 || prev.addressLine1,
                                    addressLine2: loc.addressLine2 || prev.addressLine2,
                                    city: loc.city || prev.city,
                                    pinCode: loc.pinCode || prev.pinCode,
                                }));
                            }}
                        />
                        {selectedAddress && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <MapPin className="h-4 w-4 inline mr-1" />
                                    {selectedAddress}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Address Details (Editable) */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground">Address Details (auto-filled, editable)</h3>

                        <div className="space-y-2">
                            <Label htmlFor="addressLine1">Address Line 1 *</Label>
                            <Input
                                id="addressLine1"
                                placeholder="House/Flat number, Building name"
                                value={formData.addressLine1}
                                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressLine2">Address Line 2</Label>
                            <Input
                                id="addressLine2"
                                placeholder="Street, Area"
                                value={formData.addressLine2}
                                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pinCode">Pin Code</Label>
                                <Input
                                    id="pinCode"
                                    placeholder="Pin Code"
                                    value={formData.pinCode}
                                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Contact Phone *
                            </Label>
                            <Input
                                id="contactPhone"
                                type="tel"
                                placeholder="+91 9876543210"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pickupDate" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Preferred Pickup Date
                            </Label>
                            <Input
                                id="pickupDate"
                                type="date"
                                min={minDate}
                                value={formData.pickupDate}
                                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="pickupNotes">Additional Notes</Label>
                        <Textarea
                            id="pickupNotes"
                            placeholder="Any instructions for the volunteer (e.g., landmark, best time to call)..."
                            value={formData.pickupNotes}
                            onChange={(e) => setFormData({ ...formData, pickupNotes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {/* Optional Proof Image */}
                    <div className="space-y-2">
                        <Label>Item Photo (Optional)</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />

                        {proofPreview ? (
                            <div className="relative">
                                <img
                                    src={proofPreview}
                                    alt="Item preview"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={removeImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                            >
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Add a photo of items (helps volunteers)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!formData.addressLine1 || !formData.city || !formData.contactPhone || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <MapPin className="h-4 w-4 mr-2" />
                                Request Pickup
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        A volunteer will be assigned and will contact you for pickup
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PickupRequestPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PickupRequestContent />
        </Suspense>
    );
}
