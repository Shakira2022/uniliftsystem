"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, MapPin, Loader2, ArrowUpDown, User } from "lucide-react"
import { toast } from "react-hot-toast"; // Assuming you have a toast notification library
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Placeholder for a Request type
type Request = {
    id: number;
    student_name: string;
    student_number: string;
    pickup_location: string;
    destination: string;
    status: "Pending" | "Assigned" | "In_progress" | "Completed" | "Cancelled";
    created_at: string;
    // Add other fields from the API response
    student_id: number;
    pickup_time: string;
};

export function ManageRequests() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [addError, setAddError] = useState<string | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortKey, setSortKey] = useState<'created_at' | 'status'>('created_at');
    const [selectedStatus, setSelectedStatus] = useState<string>("All");

    const [formData, setFormData] = useState({
        student_id: "",
        pickup_location: "",
        destination: "",
        pickup_time: new Date().toISOString().slice(0, 16), // Pre-fill with current time
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsTableLoading(true);
        try {
            const response = await fetch("/api/admin-request");
            if (response.ok) {
                const data = await response.json();
                const formattedData = data.map((req: any) => ({
                    id: req.id,
                    student_name: `${req.student.name} ${req.student.surname}`,
                    student_number: req.student.student_number,
                    pickup_location: req.pickup_location,
                    destination: req.destination,
                    status: req.status,
                    created_at: req.created_at,
                    student_id: req.student_id,
                    pickup_time: req.pickup_time,
                }));
                setRequests(formattedData);
            } else {
                console.error("Failed to fetch requests:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setIsTableLoading(false);
        }
    };

    const handleAddRequest = async () => {
        setIsLoading(true);
        setAddError(null);

        if (!formData.student_id || !formData.pickup_location || !formData.destination || !formData.pickup_time) {
            setAddError("All fields are required.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/admin-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: parseInt(formData.student_id),
                    pickup_location: formData.pickup_location,
                    destination: formData.destination,
                    pickup_time: formData.pickup_time,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setConfirmationMessage("Request added successfully! 🎉");
                setTimeout(() => setConfirmationMessage(null), 3000);
                setIsAddDialogOpen(false);
                setFormData({ student_id: "", pickup_location: "", destination: "", pickup_time: new Date().toISOString().slice(0, 16) });
                fetchRequests();
            } else {
                setAddError(result.error || "Failed to add request.");
            }
        } catch (error) {
            setAddError("Failed to add request due to a network or server issue.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequests = requests.filter(
        (request) =>
            (selectedStatus === "All" || request.status === selectedStatus) &&
            (request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.student_number.includes(searchTerm) ||
                request.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.destination.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sortKey === 'created_at') {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortKey === 'status') {
            const statusOrder = ["Pending", "Assigned", "In_progress", "Completed", "Cancelled"];
            const statusA = statusOrder.indexOf(a.status);
            const statusB = statusOrder.indexOf(b.status);
            return sortDirection === 'asc' ? statusA - statusB : statusB - statusA;
        }
        return 0;
    });

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddDialogStateChange = (open: boolean) => {
        if (open) {
            setFormData({
                student_id: "",
                pickup_location: "",
                destination: "",
                pickup_time: new Date().toISOString().slice(0, 16),
            });
            setAddError(null);
        }
        setIsAddDialogOpen(open);
    };

    const toggleSortDirection = (key: 'created_at' | 'status') => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const getStatusColor = (status: Request['status']) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Assigned":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "In_progress":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "Completed":
                return "bg-green-100 text-green-800 border-green-200";
            case "Cancelled":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-ZA", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">View Requests</h1>
                    <p className="text-muted-foreground">View and manage all ride requests</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogStateChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Request</DialogTitle>
                            <DialogDescription>
                                Create a new ride request on behalf of a student.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="student_id">Student ID</Label>
                                <Input
                                    id="student_id"
                                    value={formData.student_id}
                                    onChange={(e) => updateFormData("student_id", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pickup_location">Pickup Location</Label>
                                <Input
                                    id="pickup_location"
                                    value={formData.pickup_location}
                                    onChange={(e) => updateFormData("pickup_location", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination</Label>
                                <Input
                                    id="destination"
                                    value={formData.destination}
                                    onChange={(e) => updateFormData("destination", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pickup_time">Pickup Time</Label>
                                <Input
                                    id="pickup_time"
                                    type="datetime-local"
                                    value={formData.pickup_time}
                                    onChange={(e) => updateFormData("pickup_time", e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddRequest} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? "Adding Request..." : "Add Request"}
                                </Button>
                            </DialogFooter>
                            {addError && (
                                <span className="text-red-500 text-sm mt-2">{addError}</span>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Confirmation Message */}
            {confirmationMessage && (
                <div className="flex justify-center p-4">
                    <div className="bg-green-100 text-green-700 py-2 px-4 rounded-md">
                        {confirmationMessage}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Badge variant="outline" className="text-sm">
                    {filteredRequests.length} of {requests.length} requests
                </Badge>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In_progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => toggleSortDirection('created_at')} className="p-2">
                    Sort by Date ({sortKey === 'created_at' ? (sortDirection === 'asc' ? 'Oldest' : 'Newest') : 'Date'})
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Requests Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Request Log</CardTitle>
                    <CardDescription>A complete log of all ride requests</CardDescription>
                </CardHeader>
                {/* Wrap TableBody in a scrollable div */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isTableLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <span className="mt-2 text-muted-foreground">Loading requests...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedRequests.length > 0 ? (
                                    sortedRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div className="space-y-1">
                                                        <span className="font-medium">{request.student_name}</span>
                                                        <div className="text-xs text-muted-foreground">#{request.student_number}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1 text-sm">
                                                    <span><MapPin className="inline h-3 w-3 mr-1 text-green-500" /> {request.pickup_location}</span>
                                                    <span><MapPin className="inline h-3 w-3 mr-1 text-red-500" /> {request.destination}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(request.status)}>
                                                    {request.status.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDateTime(request.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    {/* Actions like "Assign" or "Cancel" would go here */}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}