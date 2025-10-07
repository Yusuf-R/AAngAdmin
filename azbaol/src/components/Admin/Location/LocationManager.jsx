// components/Admin/Location/LocationManager.js
'use client';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from "sonner";
import {MapPin, Save, ArrowLeft, Navigation, RotateCcw} from 'lucide-react';
import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import AdminUtils from "@/utils/AdminUtils";
import {queryClient} from "@/lib/queryClient";

const libraries = ['places', 'marker'];
const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
};

const defaultCenter = {
    lat: 6.5244, // Lagos, Nigeria
    lng: 3.3792
};

const LocationManager = ({mode, userId, userData, locationData}) => {
    const router = useRouter();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const autocompleteInputRef = useRef(null);

    // Phone validation helper
    const validatePhone = (phone) => {
        if (!phone || phone.trim() === '') return {isValid: true, error: null};
        const phoneRegex = /^(\+234|0)[7-9][0-1]\d{8}$/;
        return {
            isValid: phoneRegex.test(phone.trim()),
            error: phoneRegex.test(phone.trim()) ? null : 'Please enter a valid Nigerian phone number'
        };
    };

    // Form state
    const [formData, setFormData] = useState({
        address: locationData?.address || '',
        coordinates: locationData?.coordinates || defaultCenter,
        landmark: locationData?.landmark || '',
        contactPerson: {
            name: locationData?.contactPerson?.name || '',
            phone: locationData?.contactPerson?.phone || '',
            alternatePhone: locationData?.contactPerson?.alternatePhone || ''
        },
        extraInformation: locationData?.extraInformation || '',
        locationType: locationData?.locationType || 'residential',
        building: {
            name: locationData?.building?.name || '',
            floor: locationData?.building?.floor || '',
            unit: locationData?.building?.unit || ''
        }
    });

    const [mapCenter, setMapCenter] = useState(formData.coordinates);
    const [mapZoom, setMapZoom] = useState(15);
    const [addressInput, setAddressInput] = useState(formData.address);

    // Google Maps loader
    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: libraries,
        version: "weekly"
    });

    // Mutations
    const addLocationMutation = useMutation({
        mutationFn: AdminUtils.addUserLocation,
        queryKey: ['addUserLocation'],
    });

    const updateLocationMutation = useMutation({
        mutationFn: AdminUtils.updateUserLocations,
        queryKey: ['updateUserLocation'],
    });

    // Handle marker drag with coordinates directly
    const handleMarkerDragEnd = useCallback((newCoords) => {
        // Reverse geocoding to get address from coordinates
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({location: newCoords}, (results, status) => {
            if (status === 'OK' && results[0]) {
                setFormData(prev => ({
                    ...prev,
                    address: results[0].formatted_address,
                    coordinates: newCoords
                }));
                setAddressInput(results[0].formatted_address);
            } else {
                setFormData(prev => ({
                    ...prev,
                    coordinates: newCoords
                }));
            }
        });
    }, []);


    // Legacy autocomplete initialization
    const initializeLegacyAutocomplete = useCallback(() => {
        if (autocompleteInputRef.current && window.google?.maps?.places?.Autocomplete) {
            const autocomplete = new window.google.maps.places.Autocomplete(
                autocompleteInputRef.current,
                {
                    componentRestrictions: {country: 'ng'},
                    fields: ['formatted_address', 'geometry', 'name']
                }
            );

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    const newCoords = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };

                    setFormData(prev => ({
                        ...prev,
                        address: place.formatted_address,
                        coordinates: newCoords
                    }));
                    setMapCenter(newCoords);
                    setAddressInput(place.formatted_address);
                    setMapZoom(16);
                }
            });
        }
    }, []);


    // Replace the onMapLoad function with this corrected version:
    const onMapLoad = useCallback((map) => {
        mapRef.current = map;

        // Try to use modern PlaceAutocompleteElement first
        if (window.google?.maps?.places?.PlaceAutocompleteElement) {
            try {
                const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
                    requestedRegionCode: 'ng',
                    locationRestriction: {country: 'ng'}
                });

                autocompleteElement.addEventListener('gmp-placeselect', (event) => {
                    const place = event.place;
                    if (place.geometry && place.geometry.location) {
                        const newCoords = {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        };

                        setFormData(prev => ({
                            ...prev,
                            address: place.formattedAddress || place.displayName,
                            coordinates: newCoords
                        }));
                        setMapCenter(newCoords);
                        setAddressInput(place.formattedAddress || place.displayName);
                        setMapZoom(16);
                    }
                });

                // Replace the input with the new element
                if (autocompleteInputRef.current && autocompleteInputRef.current.parentNode) {
                    autocompleteInputRef.current.style.display = 'none';
                    autocompleteInputRef.current.parentNode.appendChild(autocompleteElement);
                }
            } catch (error) {
                console.warn('Failed to create PlaceAutocompleteElement, falling back to legacy Autocomplete');
                initializeLegacyAutocomplete();
            }
        } else {
            // Fallback to legacy autocomplete
            initializeLegacyAutocomplete();
        }

        // Try to use AdvancedMarkerElement first
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            try {
                const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
                    position: formData.coordinates,
                    map: map,
                    gmpDraggable: true,
                });

                // FIXED: Correct event listener for advanced marker
                advancedMarker.addListener('dragend', (event) => {
                    const newCoords = {
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng()
                    };
                    handleMarkerDragEnd(newCoords);
                });

                markerRef.current = advancedMarker;
                markerRef.current.isAdvanced = true; // Flag to identify marker type
            } catch (error) {
                console.warn('Failed to create AdvancedMarkerElement, falling back to legacy Marker');
                createLegacyMarker(map);
            }
        } else {
            // Fallback to legacy marker
            createLegacyMarker(map);
        }
    }, [formData.coordinates, handleMarkerDragEnd, initializeLegacyAutocomplete]);

// Update the createLegacyMarker function:
    const createLegacyMarker = useCallback((map) => {
        if (window.google?.maps?.Marker) {
            const legacyMarker = new window.google.maps.Marker({
                position: formData.coordinates,
                map: map,
                draggable: true,
            });

            // FIXED: Correct event listener for legacy marker
            legacyMarker.addListener('dragend', (event) => {
                const newCoords = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                };
                handleMarkerDragEnd(newCoords);
            });

            markerRef.current = legacyMarker;
            markerRef.current.isAdvanced = false; // Flag to identify marker type
        }
    }, [formData.coordinates, handleMarkerDragEnd]);

    // Update the marker position effect:
    useEffect(() => {
        if (markerRef.current) {
            if (markerRef.current.isAdvanced && window.google?.maps?.marker?.AdvancedMarkerElement) {
                // For AdvancedMarkerElement
                markerRef.current.position = formData.coordinates;
            } else if (markerRef.current.setPosition) {
                // For legacy Marker
                markerRef.current.setPosition(formData.coordinates);
            }
        }
    }, [formData.coordinates]);

    // Form handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleNestedInputChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {...prev[parent], [field]: value}
        }));
    };

    // Validation
    const validateForm = () => {
        const errors = [];

        if (!formData.address.trim()) {
            errors.push('Address is required');
        }

        if (!formData.coordinates.lat || !formData.coordinates.lng) {
            errors.push('Coordinates are required');
        }

        const phoneValidation = validatePhone(formData.contactPerson.phone);
        const altPhoneValidation = validatePhone(formData.contactPerson.alternatePhone);

        if (!phoneValidation.isValid) {
            errors.push('Primary phone number is invalid');
        }

        if (!altPhoneValidation.isValid) {
            errors.push('Alternate phone number is invalid');
        }

        return errors;
    };

    // Submit handlers
    const handleSubmit = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            toast.error('Please fix validation errors');
            return;
        }

        const payload = {
            userId: userId,
            locationData: formData
        };

        if (mode === 'edit' && locationData?._id) {
            payload.locationId = locationData._id;

            updateLocationMutation.mutate(payload, {
                onSuccess: async (result) => {
                    if (result.success) {
                        toast.success('Location updated successfully');
                        await queryClient.invalidateQueries({queryKey: ['allUserData']});
                        router.refresh();
                        setTimeout(() => {
                            router.push(`/admin/users/edit/${userId}`);
                        }, 1000);
                    }
                },
                onError: (error) => {
                    toast.error(`Update failed: ${error.message}`);
                }
            });
        } else {
            addLocationMutation.mutate(payload, {
                onSuccess: async (result) => {
                    if (result.success) {
                        toast.success('Location added successfully');
                        await queryClient.invalidateQueries({queryKey: ['allUserData']});
                        router.refresh();
                        setTimeout(() => {
                            router.push(`/admin/users/edit/${userId}`);
                        }, 1000);
                    }
                },
                onError: (error) => {
                    toast.error(`Add failed: ${error.message}`);
                }
            });
        }
    };

    const resetForm = () => {
        if (mode === 'edit' && locationData) {
            setFormData({
                address: locationData.address || '',
                coordinates: locationData.coordinates || defaultCenter,
                landmark: locationData.landmark || '',
                contactPerson: {
                    name: locationData.contactPerson?.name || '',
                    phone: locationData.contactPerson?.phone || '',
                    alternatePhone: locationData.contactPerson?.alternatePhone || ''
                },
                extraInformation: locationData.extraInformation || '',
                locationType: locationData.locationType || 'residential',
                building: {
                    name: locationData.building?.name || '',
                    floor: locationData.building?.floor || '',
                    unit: locationData.building?.unit || ''
                }
            });
            setMapCenter(locationData.coordinates || defaultCenter);
            setAddressInput(locationData.address || '');
        } else {
            setFormData({
                address: '',
                coordinates: defaultCenter,
                landmark: '',
                contactPerson: {name: '', phone: '', alternatePhone: ''},
                extraInformation: '',
                locationType: 'residential',
                building: {name: '', floor: '', unit: ''}
            });
            setMapCenter(defaultCenter);
            setAddressInput('');
            setMapZoom(10);
        }
    };

    const isSubmitting = addLocationMutation.isPending || updateLocationMutation.isPending;
    const validationErrors = validateForm();

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl backdrop-blur-sm transition bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50"
                    >
                        <ArrowLeft className="h-5 w-5"/>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {mode === 'edit' ? 'Edit Location' : 'Add New Location'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {userData ? `For ${userData.fullName}` : 'Manage saved location'}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5"/>
                        Location Details
                    </CardTitle>
                    <CardDescription>
                        Use the address search to find the location, then drag the marker to fine-tune the position
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Address Search */}
                    <div className="space-y-2">
                        <Label>Search Address</Label>
                        <div className="w-full">
                            <Input
                                ref={autocompleteInputRef}
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                placeholder="Start typing an address in Nigeria..."
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Map */}
                    <div className="space-y-2">
                        <Label>Location on Map</Label>
                        <div className="border rounded-lg overflow-hidden">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    onLoad={onMapLoad}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                        fullscreenControl: true,
                                        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || 'DEMO_MAP_ID',
                                    }}
                                />
                            ) : (
                                <div className="h-96 bg-gray-100 flex items-center justify-center">
                                    <p>Loading map...</p>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            Current
                            coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                        </p>
                    </div>

                    {/* Location Type and Landmark */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Location Type</Label>
                            <Select
                                value={formData.locationType}
                                onValueChange={(value) => handleInputChange('locationType', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="residential">Residential</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="mall">Mall</SelectItem>
                                    <SelectItem value="hospital">Hospital</SelectItem>
                                    <SelectItem value="school">School</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Landmark</Label>
                            <Input
                                value={formData.landmark}
                                onChange={(e) => handleInputChange('landmark', e.target.value)}
                                placeholder="Nearby landmark"
                            />
                        </div>
                    </div>

                    {/* Extra Information */}
                    <div className="space-y-2">
                        <Label>Extra Information</Label>
                        <Textarea
                            value={formData.extraInformation}
                            onChange={(e) => handleInputChange('extraInformation', e.target.value)}
                            placeholder="Additional delivery instructions or notes"
                            rows={3}
                        />
                    </div>

                    {/* Contact Person */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Contact Person</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.contactPerson.name}
                                    onChange={(e) => handleNestedInputChange('contactPerson', 'name', e.target.value)}
                                    placeholder="Contact name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.contactPerson.phone}
                                    onChange={(e) => handleNestedInputChange('contactPerson', 'phone', e.target.value)}
                                    placeholder="Primary phone"
                                    className={!validatePhone(formData.contactPerson.phone).isValid ? 'border-red-500' : ''}
                                />
                                {!validatePhone(formData.contactPerson.phone).isValid && (
                                    <p className="text-red-500 text-xs">
                                        {validatePhone(formData.contactPerson.phone).error}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Alternate Phone</Label>
                                <Input
                                    value={formData.contactPerson.alternatePhone}
                                    onChange={(e) => handleNestedInputChange('contactPerson', 'alternatePhone', e.target.value)}
                                    placeholder="Secondary phone"
                                    className={!validatePhone(formData.contactPerson.alternatePhone).isValid ? 'border-red-500' : ''}
                                />
                                {!validatePhone(formData.contactPerson.alternatePhone).isValid && (
                                    <p className="text-red-500 text-xs">
                                        {validatePhone(formData.contactPerson.alternatePhone).error}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Building Details */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Building Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Building Name</Label>
                                <Input
                                    value={formData.building.name}
                                    onChange={(e) => handleNestedInputChange('building', 'name', e.target.value)}
                                    placeholder="Building name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Floor</Label>
                                <Input
                                    value={formData.building.floor}
                                    onChange={(e) => handleNestedInputChange('building', 'floor', e.target.value)}
                                    placeholder="Floor number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit/Apartment</Label>
                                <Input
                                    value={formData.building.unit}
                                    onChange={(e) => handleNestedInputChange('building', 'unit', e.target.value)}
                                    placeholder="Unit/Apartment"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={resetForm}
                            disabled={isSubmitting}
                        >
                            <RotateCcw className="w-4 h-4 mr-2"/>
                            Reset
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || validationErrors.length > 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <div
                                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    {mode === 'edit' ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2"/>
                                    {mode === 'edit' ? 'Update Location' : 'Add Location'}
                                    {validationErrors.length > 0 && (
                                        <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                            {validationErrors.length} error(s)
                                        </span>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LocationManager;