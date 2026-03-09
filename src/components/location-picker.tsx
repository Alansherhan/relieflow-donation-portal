'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation, MapPin } from 'lucide-react';

interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    pinCode?: string;
}

interface LocationPickerProps {
    onLocationSelect: (location: LocationData) => void;
    initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [MapComponents, setMapComponents] = useState<any>(null);
    const mapRef = useRef<any>(null);

    // Default center (India)
    const defaultCenter: [number, number] = [20.5937, 78.9629];

    // Load Leaflet dynamically
    useEffect(() => {
        const loadMap = async () => {
            try {
                // Load Leaflet CSS dynamically
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.css';
                    document.head.appendChild(link);
                }

                // Import Leaflet and react-leaflet
                const L = await import('leaflet');
                const RL = await import('react-leaflet');

                // Fix default marker icon issue
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });

                setMapComponents({
                    MapContainer: RL.MapContainer,
                    TileLayer: RL.TileLayer,
                    Marker: RL.Marker,
                    useMapEvents: RL.useMapEvents,
                });
                setMapReady(true);
            } catch (error) {
                console.error('Failed to load map:', error);
            }
        };

        loadMap();
    }, []);

    // Reverse geocode to get address from coordinates
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `/api/reverse-geocode?lat=${lat}&lng=${lng}`
            );
            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;
                return {
                    address: data.display_name || '',
                    addressLine1: addr.road || addr.neighbourhood || addr.suburb || '',
                    addressLine2: addr.county || addr.state_district || '',
                    city: addr.city || addr.town || addr.village || addr.state || '',
                    pinCode: addr.postcode || '',
                };
            }
            return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
        }
    }, []);

    // Handle location change
    const handleLocationChange = useCallback(async (lat: number, lng: number) => {
        setIsLoading(true);
        const addressData = await reverseGeocode(lat, lng);

        onLocationSelect({
            latitude: lat,
            longitude: lng,
            ...addressData,
        });
        setIsLoading(false);
    }, [onLocationSelect, reverseGeocode]);

    // Get current location using browser geolocation
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setIsLoading(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);

                // Center map on current location
                if (mapRef.current) {
                    mapRef.current.setView([latitude, longitude], 16);
                }

                await handleLocationChange(latitude, longitude);
            },
            (error) => {
                setIsLoading(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Location permission denied. Please enable location access.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('Location information unavailable.');
                        break;
                    case error.TIMEOUT:
                        setLocationError('Location request timed out.');
                        break;
                    default:
                        setLocationError('An error occurred while getting location.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [handleLocationChange]);

    // Map click handler component
    const MapClickHandler = useCallback(() => {
        if (!MapComponents?.useMapEvents) return null;

        MapComponents.useMapEvents({
            click(e: any) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                handleLocationChange(lat, lng);
            },
        });

        return null;
    }, [MapComponents, handleLocationChange]);

    if (!mapReady || !MapComponents) {
        return (
            <div className="space-y-3">
                <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full"
                >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading map...
                </Button>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    const { MapContainer, TileLayer, Marker } = MapComponents;

    return (
        <div className="space-y-3">
            {/* Use Current Location Button */}
            <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting location...
                    </>
                ) : (
                    <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Use My Current Location
                    </>
                )}
            </Button>

            {locationError && (
                <p className="text-sm text-red-500">{locationError}</p>
            )}

            {/* Map */}
            <div className="h-64 rounded-lg overflow-hidden border">
                <MapContainer
                    center={position || defaultCenter}
                    zoom={position ? 16 : 5}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {position && <Marker position={position} />}
                    <MapClickHandler />
                </MapContainer>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {position
                    ? 'Click on the map to adjust your location'
                    : 'Click "Use My Current Location" or click on the map to set pickup location'
                }
            </p>
        </div>
    );
}

export default LocationPicker;
