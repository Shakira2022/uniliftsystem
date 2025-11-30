// /components/request-ride-form.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, ArrowRightLeft, RefreshCcw, Home } from "lucide-react"
import { AuthService, AuthUser } from "@/lib/auth"

interface AuthUserWithResDetails extends AuthUser {
    res_name?: string;
    street_name?: string;
    house_number?: string;
}

export function RequestRideForm() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        pickup_location: "",
        route_type: "to_campus",
        pickup_date: "",
        pickup_time: "",
        notes: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useState<AuthUserWithResDetails | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [isMyResSelected, setIsMyResSelected] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser || currentUser.role !== "student" || !currentUser.stud_id) {
                router.push("/login");
                setLoadingUser(false);
                return;
            }
            try {
                const response = await fetch(`/api/student-profile/${currentUser.stud_id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch user profile.");
                }
                const profileData = await response.json();
                setUser({ ...currentUser, ...profileData });
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setUser(currentUser);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUserProfile();
    }, [router]);

    useEffect(() => {
        if (formData.route_type === "from_campus") {
            // Automatically set pickup location to NWU Campus
            updateFormData("pickup_location", "NWU Campus");
            setIsMyResSelected(false);
        } else {
            // Clear location for 'to_campus' route
            updateFormData("pickup_location", "");
        }
    }, [formData.route_type]);

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleMyResClick = () => {
        if (user?.res_name && user?.street_name && user?.house_number) {
            const fullAddress = `${user.res_name}, ${user.street_name}, ${user.house_number}`;
            updateFormData("pickup_location", fullAddress);
            setIsMyResSelected(true);
        } else {
            setError("Your residence address is not available. Please update your profile.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        const student_id = user?.stud_id || user?.id;
        if (!student_id) {
            setError("User not authenticated. Please log in again.");
            setIsLoading(false);
            return;
        }

        if (!formData.pickup_location || !formData.pickup_date || !formData.pickup_time) {
            setError("Please fill in all required fields.");
            setIsLoading(false);
            return;
        }

        const combinedPickupTime = `${formData.pickup_date} ${formData.pickup_time}:00`;

        // Determine destination based on route_type and user's residence
        let destination = "Campus"; // Default for 'to_campus'
        if (formData.route_type === "from_campus") {
            if (user?.res_name && user?.street_name && user?.house_number) {
                // Set destination to user's full residence address
                destination = `${user.res_name}, ${user.street_name}, ${user.house_number}`;
            } else {
                setError("Your residence address is not available for the destination.");
                setIsLoading(false);
                return;
            }
        }

        try {
            const response = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id,
                    pickup_location: formData.pickup_location,
                    pickup_time: combinedPickupTime,
                    destination,
                    notes: formData.notes,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit request");
            }

            const result = await response.json();
            setSuccess(result.message);
            setFormData({
                pickup_location: "",
                route_type: "to_campus",
                pickup_date: "",
                pickup_time: "",
                notes: "",
            });
            setIsMyResSelected(false);
        } catch (apiError: any) {
            setError(apiError.message);
            console.error("API Error:", apiError);
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingUser) {
        return (
            <div className="flex justify-center items-center h-48">
                <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading user data...</span>
            </div>
        );
    }

    if (!user || user.role !== "student") {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request a Ride</CardTitle>
                <CardDescription>
                    Fill out the details below to request a ride from a driver.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert
                            variant="default"
                            className="bg-green-500/10 border-green-500/30 text-green-600"
                        >
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Route Type */}
                    <div className="space-y-2">
                        <Label htmlFor="route_type">Route</Label>
                        <Select
                            value={formData.route_type}
                            onValueChange={(value: "to_campus" | "from_campus") =>
                                updateFormData("route_type", value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="to_campus">Residence → Campus</SelectItem>
                                <SelectItem value="from_campus">Campus → Residence</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pickup Location */}
                    <div className="space-y-2">
                        <Label htmlFor="pickup_location">Pickup Location</Label>
                        {formData.route_type === "to_campus" ? (
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                                <Button
                                    type="button"
                                    onClick={handleMyResClick}
                                    variant={isMyResSelected ? "default" : "outline"}
                                    className="w-full sm:w-auto flex-shrink-0"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Use My Residence Address
                                </Button>
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="pickup_location"
                                        placeholder="e.g., Student Village, NWU"
                                        value={formData.pickup_location}
                                        onChange={(e) => {
                                            updateFormData("pickup_location", e.target.value);
                                            setIsMyResSelected(false);
                                        }}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="pickup_location"
                                    value={formData.pickup_location}
                                    onChange={(e) => updateFormData("pickup_location", e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pickup_date">Pickup Date</Label>
                            <Input
                                id="pickup_date"
                                type="date"
                                value={formData.pickup_date}
                                onChange={(e) => updateFormData("pickup_date", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pickup_time">Pickup Time</Label>
                            <Input
                                id="pickup_time"
                                type="time"
                                value={formData.pickup_time}
                                onChange={(e) => updateFormData("pickup_time", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any special requirements or additional information..."
                            value={formData.notes}
                            onChange={(e) => updateFormData("notes", e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Submitting Request..." : "Submit Ride Request"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}