// app/driver-dashboard/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Clock, MapPin, Car, Navigation, Bell, RefreshCcw, X, ListFilter, HelpCircle } from "lucide-react"
import { AuthService } from "@/lib/auth"
import type { Request } from "@/lib/types"
import { useNotifications } from "@/components/ui/notification-provider"
import { realtimeService } from "@/lib/realtime"
import { toast } from 'react-hot-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Driver = {
    id: number;
    name?: string;
    surname?: string;
    contact_details?: string;
    email?: string;
    driver_id: number;
}

type Vehicle = {
    Vehicle_ID: number;
    Model: string;
    Plate_Number: string;
    Capacity: number;
    Driver_ID: number;
}

// Added new props for the help function
type DriverDashboardProps = {
    showHelp: boolean;
    onHelpClose: () => void;
}

export function DriverDashboard({ showHelp, onHelpClose }: DriverDashboardProps) {
    const [requests, setRequests] = useState<Request[]>([])
    const [isAvailable, setIsAvailable] = useState(false)
    const [user, setUser] = useState<Driver | null>(null);
    const { addNotification } = useNotifications()
    const [isLoading, setIsLoading] = useState(true);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [todaysSummary, setTodaysSummary] = useState({
        totalRides: 0,
        totalEarnings: 0
    });
    const [pendingNotifications, setPendingNotifications] = useState<Request[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const hasNotifiedPendingRef = useRef(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [activeSort, setActiveSort] = useState<"pickup_time_asc" | "pickup_time_desc">("pickup_time_asc");
    const [activeStatusSort, setActiveStatusSort] = useState<string | null>(null);

    const fetchDriverData = async () => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser || typeof currentUser.driver_id !== "number") {
            setIsLoading(false);
            return;
        }

        setUser(currentUser);
        setIsLoading(true);

        try {
            const [requestsResponse, vehicleResponse, summaryResponse] = await Promise.all([
                fetch(`/api/requests?driverId=${currentUser.driver_id}`),
                fetch(`/api/vehicles?driverId=${currentUser.driver_id}`),
                fetch(`/api/driver-summary/today?driverId=${currentUser.driver_id}`)
            ]);

            if (requestsResponse.ok) {
                const data: Request[] = await requestsResponse.json();
                setRequests(data);

                const pendingRequests = data.filter(r => r.status === "Pending");
                setPendingNotifications(pendingRequests);

                if (pendingRequests.length > 0 && !hasNotifiedPendingRef.current) {
                    const firstPending = pendingRequests[0];
                    addNotification({
                        title: "New Ride Request",
                        message: `Ride #${firstPending.id} is pending. Pickup at ${firstPending.pickup_location}`,
                        type: "info",
                    });
                    hasNotifiedPendingRef.current = true;
                }
            } else {
                console.error("Failed to fetch driver requests:", requestsResponse.statusText);
                toast.error("Failed to load your ride requests.");
            }

            if (vehicleResponse.ok) {
                const vehicleData = await vehicleResponse.json();
                setVehicle(vehicleData.length > 0 ? vehicleData[0] : null);
            } else {
                console.error("Failed to fetch vehicle data:", vehicleResponse.statusText);
                toast.error("Failed to load vehicle information.");
            }

            if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                setTodaysSummary(summaryData);
            } else {
                console.error("Failed to fetch summary data:", summaryResponse.statusText);
                toast.error("Failed to load today's summary.");
            }

            console.log("[v1] Fetched driver data successfully.");
        } catch (error) {
            console.error("[v1] Error fetching driver data:", error);
            toast.error("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDriverData();

        const unsubscribeNewRequests = realtimeService.subscribe("new-requests", (newRequest) => {
            if (isAvailable) {
                addNotification({
                    title: "New Ride Request",
                    message: `New ride request at ${newRequest.pickup_location}`,
                    type: "info",
                });
                fetchDriverData();
            }
        });

        const unsubscribeAssignments = realtimeService.subscribe("request-assigned", (assignment) => {
            if (assignment.driverId === user?.driver_id) {
                addNotification({
                    title: "New Assignment",
                    message: `You've been assigned to a ride request`,
                    type: "success",
                });
                fetchDriverData();
            }
        });

        const handleOutsideClick = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            unsubscribeNewRequests();
            unsubscribeAssignments();
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isAvailable, addNotification, user?.driver_id]);

    const handleStatusUpdate = async (requestId: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setRequests(prev =>
                    prev.map(req => req.id === requestId ? { ...req, status: newStatus as any } : req)
                );
                toast.success(`Ride status updated to ${newStatus.replace("_", " ")}.`);
                if (newStatus === "Completed") fetchDriverData();
            } else {
                const errorData = await response.json();
                toast.error(`Failed to update status: ${errorData.error}`);
            }
        } catch (error) {
            toast.error("Network error. Could not update ride status.");
        }
    };

    const handleAvailabilityToggle = async (available: boolean) => {
        if (!user || typeof user.driver_id !== 'number') return;

        const newStatus = available ? 'Available' : 'Not Available';

        try {
            const response = await fetch(`/api/drivers/${user.driver_id}/availability`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setIsAvailable(available);
                addNotification({
                    title: "Availability Updated",
                    message: `You are now ${available ? "available" : "offline"} for new rides`,
                    type: available ? "success" : "info",
                });
            } else {
                const errorData = await response.json();
                toast.error(`Failed to update availability: ${errorData.error}`);
            }
        } catch (error) {
            toast.error("Network error. Could not update your status.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Assigned": return "bg-blue-100 text-blue-800 border-blue-200";
            case "In_progress": return "bg-purple-100 text-purple-800 border-purple-200";
            case "Completed": return "bg-green-100 text-green-800 border-green-200";
            case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const formatStatus = (status: string) => status?.replace(/_/g, ' ') || 'Unknown';

    const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString("en-ZA", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const sortRequests = (data: Request[], sortCriteria: "pickup_time_asc" | "pickup_time_desc", statusSort: string | null): Request[] => {
        const sortedData = [...data];

        if (statusSort) {
            const prioritized = sortedData.filter(req => req.status.toLowerCase() === statusSort.toLowerCase());
            const others = sortedData.filter(req => req.status.toLowerCase() !== statusSort.toLowerCase());
            const sortedOthers = others.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return [...prioritized, ...sortedOthers];
        }

        switch (sortCriteria) {
            case "pickup_time_asc":
                return sortedData.sort((a, b) => new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime());
            case "pickup_time_desc":
                return sortedData.sort((a, b) => new Date(b.pickup_time).getTime() - new Date(a.pickup_time).getTime());
            default:
                return sortedData;
        }
    };

    const activeRequests = sortRequests(
        requests.filter(r => ["Assigned", "In_progress", "Pending"].includes(r.status)),
        activeSort,
        activeStatusSort
    );

    return (
        <div className="space-y-6 relative">
            {isLoading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading dashboard...</span>
                </div>
            ) : (
                <>
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-primary mb-2">
                                    Welcome, {user?.name} {user?.surname}!
                                </h1>
                                <p className="text-muted-foreground">Manage your assigned rides and track your performance.</p>
                            </div>
                            <div className="flex items-center space-x-3 relative">
                                <div className="relative">
                                    <Bell className="h-4 w-4 text-primary cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
                                    {pendingNotifications.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                            {pendingNotifications.length}
                                        </span>
                                    )}
                                </div>
                                {showNotifications && (
                                    <div ref={notificationRef} className="absolute top-8 right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                                            <h3 className="font-semibold text-sm">New Requests</h3>
                                            <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-800"  aria-label="Close notifications">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        {pendingNotifications.length === 0 ? (
                                            <div className="p-4 text-sm text-gray-500">No new notifications</div>
                                        ) : (
                                            <div className="max-h-48 overflow-y-auto">
                                                {pendingNotifications.map(req => (
                                                    <div key={req.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                                                        <p className="font-medium">Ride #{req.id}</p>
                                                        <p className="text-xs text-gray-600">Pickup: {req.pickup_location}</p>
                                                        <p className="text-xs text-gray-600">Time: {formatDateTime(req.pickup_time)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span className="text-sm font-medium">Available</span>
                                <Switch checked={isAvailable} onCheckedChange={handleAvailabilityToggle} />
                                <Badge variant={isAvailable ? "default" : "secondary"}>{isAvailable ? "Online" : "Offline"}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Active Rides</p>
                                        <p className="text-2xl font-bold text-primary">{activeRequests.length}</p>
                                        <p className="text-xs text-muted-foreground">Rides currently in progress or waiting to be accepted</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Completed Today</p>
                                        <p className="text-2xl font-bold text-green-600">{todaysSummary.totalRides}</p>
                                        <p className="text-xs text-muted-foreground">Daily rides completed </p>

                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Car className="h-5 w-5 text-secondary" />
                                    <div>
                                    <p className="text-sm font-medium">Vehicle</p>
                                      {vehicle ? (
                                          <>
                                              <p className="text-lg font-semibold text-secondary">
                                                  {vehicle.Model} ({vehicle.Plate_Number})
                                              </p>
                                              <p className="text-xs text-muted-foreground">Your currently assigned vehicle details</p>
                                          </>
                                      ) : (
                                          <>
                                              <p className="text-lg font-semibold text-secondary">No vehicle assigned</p>
                                              <p className="text-xs text-muted-foreground">Please check back later</p>
                                          </>
                                      )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Navigation className="h-5 w-5" />
                                Active Rides
                            </CardTitle>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="ml-2">
                                            <ListFilter className="h-4 w-4 mr-2" />
                                            Status
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setActiveStatusSort("pending"); }}>Pending</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setActiveStatusSort("assigned"); }}>Assigned</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setActiveStatusSort("in_progress"); }}>In Progress</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setActiveStatusSort(null); }}>Show All</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <ListFilter className="h-4 w-4 mr-2" />
                                            Sort
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Sort Active Requests</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setActiveSort("pickup_time_asc"); }}>Pickup Time (Earliest)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setActiveSort("pickup_time_desc"); }}>Pickup Time (Latest)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {activeRequests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>
                                        No active rides.{" "}
                                        {isAvailable ? "Waiting for new assignments..." : "Set yourself as available to receive rides."}
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-4">
                                    {activeRequests.map((request) => (
                                        <div key={request.id} className="border rounded-lg p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Badge className={getStatusColor(request.status)}>{formatStatus(request.status)}</Badge>
                                                <span className="text-sm text-muted-foreground">Ride #{request.id}</span>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <h4 className="font-medium mb-2">Student Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-medium">Name:</span> {request.student?.name} {request.student?.surname}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Student #:</span> {request.student?.student_number}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Contact:</span> {request.student?.contact_details}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">Pickup:</span>
                                                        <span className="text-muted-foreground">{request.pickup_location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="h-4 w-4 text-secondary" />
                                                        <span className="font-medium">Destination:</span>
                                                        <span className="text-muted-foreground">{request.destination}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-4 w-4 text-accent" />
                                                        <span className="font-medium">Pickup Time:</span>
                                                        <span className="text-muted-foreground">{formatDateTime(request.pickup_time)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                {request.status === "Pending" && (
                                                    <Button onClick={() => handleStatusUpdate(request.id, "Assigned")} className="flex-1">
                                                        Accept Ride
                                                    </Button>
                                                )}
                                                {request.status === "Assigned" && (
                                                    <Button onClick={() => handleStatusUpdate(request.id, "In_progress")} className="flex-1">
                                                        Start Ride
                                                    </Button>
                                                )}
                                                {request.status === "In_progress" && (
                                                    <Button onClick={() => handleStatusUpdate(request.id, "Completed")} className="flex-1">
                                                        Complete Ride
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Summary</CardTitle>
                            <CardDescription>Your performance metrics for today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-primary/5 rounded-lg">
                                    <div className="text-2xl font-bold text-primary">{todaysSummary.totalRides}</div>
                                    <div className="text-sm text-muted-foreground">Total Rides</div>
                                </div>
                                <div className="text-center p-4 bg-accent/5 rounded-lg">
                                    <div className="text-2xl font-bold text-accent">R {todaysSummary.totalEarnings}</div>
                                    <div className="text-sm text-muted-foreground">Earnings</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* The corrected help dialog */}
                    <AlertDialog open={showHelp} onOpenChange={onHelpClose}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5 text-primary" />
                                    UniLift Driver Help
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-4 pt-2">
                                    <p>Welcome to your UniLift Driver Dashboard! Here's a quick guide to help you get started:</p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li>
                                            <strong>Availability Switch:</strong> Use the "Available" switch in the top-right corner to go online and receive new ride requests.
                                        </li>
                                        <li>
                                            <strong>Active Rides:</strong> This section shows all your current and pending ride requests. You can sort or filter them by status.
                                        </li>
                                        <li>
                                            <strong>Update Status:</strong> Click the buttons under each ride card to update its status from "Pending" to "Assigned," then "In Progress," and finally "Completed."
                                        </li>
                                        <li>
                                            <strong>Notifications:</strong> The bell icon will show you new ride requests. Click it to view pending requests.
                                        </li>
                                    </ul>
                                    <p className="font-semibold text-sm">
                                        Your profile and performance reports can be found in the sidebar menu.
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogAction onClick={onHelpClose}>Got it</AlertDialogAction>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    );
}