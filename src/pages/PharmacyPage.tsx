/**
 * PharmacyPage.tsx - Integrated with Backend API & Geolocation
 * 
 * Features:
 * 1. Fetches pharmacies from backend API with geolocation support
 * 2. Falls back to text-based search if geolocation is denied
 * 3. Loading skeleton and empty state handling
 * 4. Functional Call, Directions, and View Details buttons
 * 5. Real-time isOpen calculation based on hours
 * 6. Error handling with toast notifications
 */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import EmptyState from "../components/EmptyState";
import { MapPin, Phone, Clock, Star, Search, Navigation, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { Pharmacy } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

/**
 * Check if pharmacy is currently open based on hours string
 * Supports formats like "8:00 AM - 10:00 PM" and "24/7"
 */
const checkIsOpen = (hours: string): boolean => {
  if (hours === "24/7") return true;
  
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Parse hours like "8:00 AM - 10:00 PM"
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = hours.match(timeRegex);
    
    if (!match) return true; // Default to open if can't parse

    let openHour = parseInt(match[1]);
    const openMinute = parseInt(match[2]);
    const openPeriod = match[3].toUpperCase();
    
    let closeHour = parseInt(match[4]);
    const closeMinute = parseInt(match[5]);
    const closePeriod = match[6].toUpperCase();

    // Convert to 24-hour format
    if (openPeriod === "PM" && openHour !== 12) openHour += 12;
    if (openPeriod === "AM" && openHour === 12) openHour = 0;
    if (closePeriod === "PM" && closeHour !== 12) closeHour += 12;
    if (closePeriod === "AM" && closeHour === 12) closeHour = 0;

    const openTimeMinutes = openHour * 60 + openMinute;
    const closeTimeMinutes = closeHour * 60 + closeMinute;

    // Handle schedules that span midnight (e.g., "10:00 PM - 2:00 AM")
    if (closeTimeMinutes < openTimeMinutes) {
      // Open from openTime to midnight, and from midnight to closeTime
      return currentTimeMinutes >= openTimeMinutes || currentTimeMinutes < closeTimeMinutes;
    }

    // Same-day schedule
    return currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes;
  } catch {
    return true; // Default to open on error
  }
};

/**
 * Loading skeleton for pharmacy cards
 */
const PharmacyCardSkeleton = () => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default function PharmacyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied" | "unavailable">("pending");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /**
   * Fetch pharmacies from backend API
   */
  const fetchPharmacies = useCallback(async (lat?: number, lng?: number, query?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string | number> = {};
      if (lat !== undefined && lng !== undefined) {
        params.lat = lat;
        params.lng = lng;
      }
      if (query) {
        params.search = query;
      }

      const response = await api.get("/pharmacies", { params });
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Process pharmacies and calculate isOpen
        const processedPharmacies = response.data.data.map((pharmacy: Pharmacy) => ({
          ...pharmacy,
          isOpen: pharmacy.isOpen ?? checkIsOpen(pharmacy.hours),
        }));
        setPharmacies(processedPharmacies);
      } else if (Array.isArray(response.data)) {
        const processedPharmacies = response.data.map((pharmacy: Pharmacy) => ({
          ...pharmacy,
          isOpen: pharmacy.isOpen ?? checkIsOpen(pharmacy.hours),
        }));
        setPharmacies(processedPharmacies);
      } else {
        setPharmacies([]);
      }
    } catch (err) {
      console.error("Failed to fetch pharmacies:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "Failed to load pharmacies. Please try again.");
      } else {
        setError("Failed to load pharmacies. Please try again.");
      }
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request geolocation on mount
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      notify.warning("Geolocation is not supported by your browser");
      fetchPharmacies();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus("granted");
        fetchPharmacies(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        let status: "denied" | "unavailable" = "unavailable";
        let message = "Unable to access location. Showing all pharmacies.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = "denied";
            message = "Location access denied. Showing all pharmacies.";
            break;
          case error.POSITION_UNAVAILABLE:
            status = "unavailable";
            message = "Location unavailable. Showing all pharmacies.";
            break;
          case error.TIMEOUT:
            status = "unavailable";
            message = "Location request timed out. Showing all pharmacies.";
            break;
          default:
            status = "unavailable";
            message = "Unable to access location. Showing all pharmacies.";
            break;
        }

        setLocationStatus(status);
        notify.info(message);
        fetchPharmacies();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, [fetchPharmacies]);

  /**
   * Handle search with debounce
   * First effect: update debouncedSearch after a delay when searchQuery changes
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  /**
   * Second effect: fetch pharmacies based on debouncedSearch and location
   */
  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchPharmacies(userLocation?.lat, userLocation?.lng, debouncedSearch);
    } else if (locationStatus !== "pending") {
      fetchPharmacies(userLocation?.lat, userLocation?.lng);
    }
  }, [debouncedSearch, userLocation, locationStatus, fetchPharmacies]);

  /**
   * Use pharmacies as returned from the server (search handled server-side)
   */
  const filteredPharmacies = pharmacies;

  /**
   * Handle Call button click
   */
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  };

  /**
   * Handle Directions button click - opens Google Maps
   */
  const handleDirections = (pharmacy: Pharmacy) => {
    const destination = pharmacy.latitude && pharmacy.longitude
      ? `${pharmacy.latitude},${pharmacy.longitude}`
      : encodeURIComponent(pharmacy.address);
    
    const mapsUrl = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    
    window.open(mapsUrl, "_blank");
  };

  /**
   * Handle View Details button click
   */
  const handleViewDetails = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsDetailsOpen(true);
  };

  /**
   * Retry fetching pharmacies
   */
  const handleRetry = () => {
    fetchPharmacies(userLocation?.lat, userLocation?.lng, searchQuery || undefined);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Pharmacy Near Me
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find nearby pharmacies and medical stores for your prescription needs.
        </p>
        {locationStatus === "granted" && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Showing pharmacies near your location
          </p>
        )}
        {locationStatus === "denied" && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Location access denied - showing all pharmacies
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search pharmacies by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Loading State */}
        {isLoading && pharmacies.length === 0 && (
          <>
            <PharmacyCardSkeleton />
            <PharmacyCardSkeleton />
            <PharmacyCardSkeleton />
          </>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <EmptyState
            title="Failed to Load Pharmacies"
            description={error}
            icon={<MapPin className="h-12 w-12 text-red-400" />}
            ctaLabel="Retry"
            onCtaClick={handleRetry}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredPharmacies.length === 0 && (
          <EmptyState
            title="No Pharmacies Found"
            description={searchQuery 
              ? "Try adjusting your search criteria or clearing the search."
              : "No pharmacies are available in your area at the moment."
            }
            icon={<MapPin className="h-12 w-12 text-gray-400" />}
            ctaLabel={searchQuery ? "Clear Search" : undefined}
            onCtaClick={searchQuery ? () => setSearchQuery("") : undefined}
          />
        )}

        {/* Pharmacy Cards */}
        {!isLoading && !error && filteredPharmacies.map((pharmacy) => (
          <Card key={pharmacy.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{pharmacy.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {pharmacy.address}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pharmacy.isOpen ? "default" : "secondary"}>
                    {pharmacy.isOpen ? "Open" : "Closed"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{pharmacy.rating}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pharmacy.phone}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pharmacy.hours}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pharmacy.distance}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {pharmacy.services?.map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCall(pharmacy.phone)}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDirections(pharmacy)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Directions
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleViewDetails(pharmacy)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pharmacy Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          {selectedPharmacy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedPharmacy.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedPharmacy.address}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Badge variant={selectedPharmacy.isOpen ? "default" : "secondary"} className="text-sm">
                    {selectedPharmacy.isOpen ? "Currently Open" : "Currently Closed"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-medium">{selectedPharmacy.rating} / 5</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium">{selectedPharmacy.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hours</p>
                    <p className="font-medium">{selectedPharmacy.hours}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
                    <p className="font-medium">{selectedPharmacy.distance}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPharmacy.services?.map((service, index) => (
                      <Badge key={index} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => handleCall(selectedPharmacy.phone)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => handleDirections(selectedPharmacy)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
