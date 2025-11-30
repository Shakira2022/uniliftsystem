"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Car, Users, ArrowUp, ArrowDown } from "lucide-react";

// Local declaration of the Vehicle type to avoid conflicts
type Vehicle = {
    driver: any;
    Vehicle_ID: number;
    Model: string;
    Plate_Number: string;
    Capacity: number;
    Driver_ID: number | null;
};

export function ManageVehicles() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
    const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [formError, setFormError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        Model: "",
        Plate_Number: "",
        Capacity: "",
    });

    // Filtering logic
    const displayedVehicles = showUnassignedOnly
        ? vehicles.filter(vehicle => vehicle.Driver_ID === null)
        : vehicles;

    // Sorting and searching logic
    const sortedAndFilteredVehicles = [...displayedVehicles]
        .filter(
            (vehicle) =>
                vehicle.Plate_Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.Model.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.Capacity - b.Capacity;
            } else {
                return b.Capacity - a.Capacity;
            }
        });

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Effect to auto-hide the success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000); // Hide after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const validatePlateNumber = (plate: string): boolean => {
        const hasTwoDigits = /(.*\d){2,}.*/.test(plate);
        const hasTwoLetters = /(.*[a-zA-Z]){2,}.*/.test(plate);
        return hasTwoDigits && hasTwoLetters;
    };

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/vehicles/driver-vehicle");
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            } else {
                console.error("Error fetching vehicles:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVehicle = async () => {
        setFormError(null); // Clear previous errors
        if (!validatePlateNumber(formData.Plate_Number)) {
            setFormError("Plate number must contain at least 2 digits and 2 letters.");
            return;
        }

        if (formData.Plate_Number.length > 9) {
            setFormError("Plate number cannot be more than 9 characters.");
            return;
        }

        setIsLoading(true);
        try {
            const vehicleData = {
                Model: formData.Model,
                Plate_Number: formData.Plate_Number,
                Capacity: Number.parseInt(formData.Capacity),
            };

            const response = await fetch("/api/vehicles/manage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(vehicleData),
            });

            if (response.ok) {
                await fetchVehicles();
                setFormData({ Model: "", Plate_Number: "", Capacity: "" });
                setIsAddDialogOpen(false);
                setSuccessMessage("Vehicle added successfully!");
            } else {
                const errorData = await response.json();
                setFormError(errorData.error || "Failed to add vehicle.");
            }
        } catch (error) {
            console.error("Error adding vehicle:", error);
            setFormError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            Model: vehicle.Model,
            Plate_Number: vehicle.Plate_Number,
            Capacity: vehicle.Capacity.toString(),
        });
        setFormError(null);
    };

    const handleUpdateVehicle = async () => {
        if (!editingVehicle) return;

        setFormError(null); // Clear previous errors
        if (!validatePlateNumber(formData.Plate_Number)) {
            setFormError("Plate number must contain at least 2 digits and 2 letters.");
            return;
        }

        if (formData.Plate_Number.length > 9) {
            setFormError("Plate number cannot be more than 9 characters.");
            return;
        }

        setIsLoading(true);
        try {
            const vehicleData = {
                Vehicle_ID: editingVehicle.Vehicle_ID,
                Model: formData.Model,
                Plate_Number: formData.Plate_Number,
                Capacity: Number.parseInt(formData.Capacity),
            };

            const response = await fetch(`/api/vehicles/manage`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(vehicleData),
            });

            if (response.ok) {
                await fetchVehicles();
                setEditingVehicle(null);
                setFormData({ Model: "", Plate_Number: "", Capacity: "" });
                setSuccessMessage("Vehicle updated successfully!");
            } else {
                const errorData = await response.json();
                setFormError(errorData.error || "Failed to update vehicle.");
            }
        } catch (error) {
            console.error("Error updating vehicle:", error);
            setFormError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVehicle = (id: number) => {
        setVehicleToDelete(id);
    };

    const confirmDelete = async () => {
        if (vehicleToDelete === null) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/vehicles/manage`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ Vehicle_ID: vehicleToDelete }),
            });

            if (response.ok) {
                await fetchVehicles();
                setSuccessMessage("Vehicle deleted successfully!");
            } else {
                console.error("Failed to delete vehicle");
            }
        } catch (error) {
            console.error("Error deleting vehicle:", error);
        } finally {
            setVehicleToDelete(null);
            setIsLoading(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSortByCapacity = () => {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    };

    const toggleUnassignedFilter = () => {
        setShowUnassignedOnly(prevState => !prevState);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Manage Vehicles</h1>
                    <p className="text-muted-foreground">Add, edit, and manage fleet vehicles</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vehicle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Vehicle</DialogTitle>
                            <DialogDescription>Enter the vehicle information to add it to the fleet.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="Model">Vehicle Model</Label>
                                <Input
                                    id="Model"
                                    placeholder="e.g., Mercedes Sprinter"
                                    value={formData.Model}
                                    onChange={(e) => updateFormData("Model", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="Plate_Number">Plate Number</Label>
                                <Input
                                    id="Plate_Number"
                                    placeholder="e.g., NWU005GP"
                                    value={formData.Plate_Number}
                                    onChange={(e) => updateFormData("Plate_Number", e.target.value)}
                                    required
                                />
                                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="Capacity">Capacity</Label>
                                <Input
                                    id="Capacity"
                                    type="number"
                                    placeholder="e.g., 14"
                                    value={formData.Capacity}
                                    onChange={(e) => updateFormData("Capacity", e.target.value)}
                                    required
                                />
                            </div>
                            <Button onClick={handleAddVehicle} className="w-full" disabled={isLoading}>
                                {isLoading ? "Adding Vehicle..." : "Add Vehicle"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            {successMessage && (
                <div className="flex justify-center p-4">
                    <Badge className="bg-green-100 text-green-700 py-2 px-4 rounded-md">
                        {successMessage}
                    </Badge>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by plate number or model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                        disabled={isLoading}
                    />
                    <Badge variant="outline" className="text-sm">
                        {sortedAndFilteredVehicles.length} of {vehicles.length} vehicles available
                    </Badge>
                    <Button variant="outline" onClick={handleSortByCapacity} disabled={isLoading}>
                        {sortOrder === 'asc' ? <ArrowDown className="h-4 w-4 mr-2" /> : <ArrowUp className="h-4 w-4 mr-2" />}
                        Sort by Capacity
                    </Button>
                    <Button variant={showUnassignedOnly ? "default" : "outline"} onClick={toggleUnassignedFilter} disabled={isLoading}>
                        Show Unassigned
                    </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Fleet Overview</CardTitle>
                    <CardDescription>Complete list of vehicles in the fleet</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <p className="text-muted-foreground animate-pulse">Loading vehicles...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Plate Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Assigned Driver ID</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAndFilteredVehicles.map((vehicle) => (
                                    <TableRow key={vehicle.Vehicle_ID}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{vehicle.Model}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{vehicle.Plate_Number}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                {vehicle.Capacity} passengers
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {vehicle.driver ? `${vehicle.driver.name} ${vehicle.driver.surname}` : "Unassigned"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditVehicle(vehicle)} disabled={isLoading}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteVehicle(vehicle.Vehicle_ID)} disabled={isLoading}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingVehicle} onOpenChange={() => {
                setEditingVehicle(null);
                setFormData({ Model: "", Plate_Number: "", Capacity: "" });
                setFormError(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Vehicle</DialogTitle>
                        <DialogDescription>Update the vehicle information.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-Model">Vehicle Model</Label>
                            <Input
                                id="edit-Model"
                                value={formData.Model}
                                onChange={(e) => updateFormData("Model", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-Plate_Number">Plate Number</Label>
                            <Input
                                id="edit-Plate_Number"
                                value={formData.Plate_Number}
                                onChange={(e) => updateFormData("Plate_Number", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-Capacity">Capacity</Label>
                            <Input
                                id="edit-Capacity"
                                type="number"
                                value={formData.Capacity}
                                onChange={(e) => updateFormData("Capacity", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button onClick={handleUpdateVehicle} className="w-full" disabled={isLoading}>
                            {isLoading ? "Updating Vehicle..." : "Update Vehicle"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={vehicleToDelete !== null} onOpenChange={() => setVehicleToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the vehicle from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVehicleToDelete(null)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}