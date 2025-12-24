import { useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin, Navigation, Phone, AlertCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

declare global {
  interface Window {
    google: any;
  }
}

interface Hospital {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  opening_hours?: {
    open_now: boolean;
  };
  formatted_phone_number?: string;
}

export default function NearbyHospitals() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("Locating...");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPhone, setLoadingPhone] = useState<string | null>(null);
  
  const searchHospitals = useAction(api.hospitals.searchNearby);
  const getHospitalDetails = useAction(api.hospitals.getDetails);
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    // Check if script is already loaded
    if (window.google?.maps && mapRef.current && !googleMapRef.current) {
      initMap();
    } else if (!window.google?.maps) {
      // Try to load script if API key is available in env (Vite)
      // Note: This requires VITE_GOOGLE_MAPS_API_KEY to be set
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDPWPSRYwKY4uszWVQ2mz5cpUGIRquzAGY";
      if (apiKey) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => initMap();
        document.body.appendChild(script);
      }
    }
  }, [location]);

  const initMap = () => {
    if (!location || !mapRef.current || !window.google?.maps) return;
    
    try {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 13,
        styles: [
          {
            featureType: "poi.medical",
            stylers: [{ color: "#ff5252" }]
          }
        ]
      });

      // Add user marker
      new window.google.maps.Marker({
        position: location,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
        },
        title: "You are here"
      });
    } catch (e) {
      console.error("Error initializing map:", e);
    }
  };

  const updateMarkers = (places: Hospital[]) => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    places.forEach(place => {
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: googleMapRef.current,
        title: place.name,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" // Simple red pin
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: black; padding: 5px;">
            <strong>${place.name}</strong><br/>
            ${place.vicinity}
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const fetchLocation = (query?: string) => {
    setIsLoading(true);
    setError(null);
    if (!query) setAddress("Locating...");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (!location) {
          setLocation({ lat: latitude, lng: longitude });
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        
        try {
          const data = await searchHospitals({ 
            latitude, 
            longitude,
            keyword: query || searchQuery || "emergency"
          });
          if (data.error) {
            setError(data.error);
          } else {
            setHospitals(data.results);
            updateMarkers(data.results);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to fetch hospitals. Please check your connection.");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Location access denied. Please enable location services.");
        setIsLoading(false);
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocation(searchQuery);
  };

  const handleCall = async (hospital: Hospital) => {
    if (hospital.formatted_phone_number) {
      window.open(`tel:${hospital.formatted_phone_number}`);
      return;
    }

    setLoadingPhone(hospital.place_id);
    try {
      const details = await getHospitalDetails({ place_id: hospital.place_id });
      if (details.formatted_phone_number) {
        setHospitals(prev => prev.map(h => 
          h.place_id === hospital.place_id 
            ? { ...h, formatted_phone_number: details.formatted_phone_number } 
            : h
        ));
        window.open(`tel:${details.formatted_phone_number}`);
      } else {
        toast.error("Phone number not available for this location");
      }
    } catch (error) {
      toast.error("Failed to fetch contact details");
    } finally {
      setLoadingPhone(null);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleGetDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <PatientLayout>
      <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Location</p>
              <p className="font-medium">{address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchLocation()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search (e.g. Dentist, Clinic)..." 
                className="pl-9 w-[250px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid md:grid-cols-2 gap-4 min-h-0">
          {/* Map View */}
          <div className="relative h-[300px] md:h-auto">
            <Card className="overflow-hidden border-0 shadow-none md:border md:shadow-sm h-full relative">
              <div ref={mapRef} className="w-full h-full bg-muted" />
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur p-2 rounded-lg text-xs text-muted-foreground text-center border z-20">
                Important: Distances are estimates. Call ahead to confirm services.
              </div>
            </Card>
            {!window.google?.maps && (
              <div className="absolute inset-0 md:col-start-1 md:col-end-2 flex items-center justify-center bg-muted/50 z-10 pointer-events-none">
                <div className="text-center p-4 bg-background/80 backdrop-blur rounded-xl border shadow-sm">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading Map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Hospital List */}
          <Card className="flex flex-col h-full overflow-hidden border-0 shadow-none md:border md:shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Nearby Facilities
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {error ? (
                    <div className="text-center py-8 text-destructive">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>{error}</p>
                      <Button variant="outline" className="mt-4" onClick={() => fetchLocation()}>Retry</Button>
                    </div>
                  ) : hospitals.length === 0 && !isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No facilities found nearby.
                    </div>
                  ) : (
                    hospitals.map((hospital) => (
                      <div key={hospital.place_id} className="p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{hospital.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{hospital.vicinity}</p>
                            {location && (
                              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {calculateDistance(location.lat, location.lng, hospital.geometry.location.lat, hospital.geometry.location.lng)} km away
                              </p>
                            )}
                          </div>
                          {hospital.rating && (
                            <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">
                              ★ {hospital.rating}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="flex-1 h-8" 
                            onClick={() => handleGetDirections(hospital.geometry.location.lat, hospital.geometry.location.lng)}
                          >
                            <Navigation className="mr-2 h-3 w-3" /> Directions
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3"
                            onClick={() => handleCall(hospital)}
                            disabled={loadingPhone === hospital.place_id}
                          >
                            {loadingPhone === hospital.place_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Phone className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Action Bar */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button 
            variant="destructive" 
            className="h-12 text-lg shadow-lg shadow-red-500/20"
            onClick={() => {
              // Trigger SOS with nearest hospital info if available
              const nearest = hospitals[0];
              const locationInfo = nearest 
                ? `Near ${nearest.name} (${nearest.vicinity})` 
                : undefined;
              // Navigate to home and trigger SOS (simulated by passing state or just navigating)
              navigate("/patient", { state: { triggerSOS: true, locationInfo } });
              toast.info("Redirecting to SOS...");
            }}
          >
            <AlertCircle className="mr-2 h-5 w-5" /> Use in SOS Mode
          </Button>
          <Button variant="secondary" className="h-12 text-lg border shadow-sm">
            Save for Later
          </Button>
        </div>
      </div>
    </PatientLayout>
  );
}