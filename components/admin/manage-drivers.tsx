// components/ManageVehicles.tsx
// components/ManageDrivers.tsx

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
import { Switch } from "@/components/ui/switch";
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
import {
    Search,
    Plus,
    Edit,
    Trash2,
    User,
    Phone,
    CreditCard,
    Mail,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import type { Driver } from "@/lib/types";

// The Driver type has been modified based on the provided table schema.
// A password field is also added for the POST request.
type DriverWithPassword = Driver & { password?: string };

export function ManageDrivers() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<number | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    // New state for availability change confirmation
    const [driverToToggle, setDriverToToggle] = useState<Driver | null>(null);
    // New states for sorting and filtering
    const [sortByNameOrder, setSortByNameOrder] = useState<'asc' | 'desc'>('asc');
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);


    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        license: "",
        contact_details: "",
        email: "",
        availability_status: true,
        password: "12345", // Default password for new drivers
    });

    // Combined filtering and sorting logic
    const displayedDrivers = drivers
        .filter(driver => !showAvailableOnly || driver.availability_status)
        .filter(driver =>
            driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.contact_details.includes(searchTerm)
        )
        .sort((a, b) => {
            const fullNameA = `${a.name} ${a.surname}`.toLowerCase();
            const fullNameB = `${b.name} ${b.surname}`.toLowerCase();
            if (sortByNameOrder === 'asc') {
                return fullNameA.localeCompare(fullNameB);
            } else {
                return fullNameB.localeCompare(fullNameA);
            }
        });

    const validateFormData = (data: typeof formData): string | null => {
        // Validation for Name and Surname
        if (!data.name.trim()) return "First name is required.";
        if (!data.surname.trim()) return "Last name is required.";

        // Specific validation for Driver's License
        const licenseRegex = /^[a-zA-Z]{3}\d{4}$/;
        if (!data.license.trim()) return "Driver's license is required.";
        if (!licenseRegex.test(data.license)) return "Driver's license must be 3 letters followed by 4 numbers (e.g., ABC1234).";

        // Specific validation for Email
        if (!data.email.trim()) return "Email is required.";
        if (!data.email.endsWith("@gmail.com")) return "Email address must end with @gmail.com.";
        
        // Specific validation for Contact Number
        const phoneRegex = /^0\d{9}$/;
        if (!data.contact_details.trim()) return "Contact number is required.";
        if (!phoneRegex.test(data.contact_details)) return "Contact number must be exactly 10 digits and start with '0'.";

        return null; // No validation errors
    };


    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin-drivers");
            if (response.ok) {
                const data = await response.json();
                setDrivers(data);
            }
        } catch (error) {
            console.error("[v0] Error fetching drivers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDriver = async () => {
        const validationError = validateFormData(formData);
        if (validationError) {
            setAddError(validationError);
            return;
        }

        setIsLoading(true);
        setAddError(null);
        try {
            const response = await fetch("/api/admin-drivers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...formData }),
            });

            if (response.ok) {
                const newDriver = await response.json();
                setDrivers([...drivers, newDriver]);
                setFormData({
                    name: "",
                    surname: "",
                    license: "",
                    contact_details: "",
                    email: "",
                    availability_status: true,
                    password: "12345",
                });
                setConfirmationMessage("Driver added successfully!");
                setTimeout(() => setConfirmationMessage(null), 3000);
                setIsAddDialogOpen(false);
                fetchDrivers(); // Re-fetch all drivers to ensure data is up-to-date and sorted
            } else {
                const errorData = await response.json();
                setAddError(errorData.message || "Failed to add driver.");
            }
        } catch (error) {
            console.error("[v0] Error adding driver:", error);
            setAddError("Failed to add driver due to a network or server issue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditDriver = (driver: Driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            surname: driver.surname,
            license: driver.license,
            contact_details: driver.contact_details,
            email: driver.email,
            availability_status: driver.availability_status,
            password: "12345", // A default or placeholder password
        });
    };

    const handleUpdateDriver = async () => {
        if (!editingDriver) return;

        const validationError = validateFormData(formData);
        if (validationError) {
            setUpdateError(validationError);
            return;
        }

        setUpdateError(null);
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin-drivers`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingDriver.id,
                    name: formData.name,
                    surname: formData.surname,
                    license: formData.license,
                    contact_details: formData.contact_details,
                    email: formData.email,
                }),
            });

            if (response.ok) {
                const updatedDriver = await response.json();
                setDrivers(drivers.map((d) => (d.id === editingDriver.id ? updatedDriver : d)));
                setEditingDriver(null);
                setFormData({
                    name: "",
                    surname: "",
                    license: "",
                    contact_details: "",
                    email: "",
                    availability_status: true,
                    password: "12345",
                });
                setConfirmationMessage("Driver updated successfully!");
                setTimeout(() => setConfirmationMessage(null), 3000);
                fetchDrivers();
            } else {
                let errorData: any = {};
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: "An unknown error occurred." };
                }
                setUpdateError(errorData.message || "Failed to update driver. Please check your inputs.");
            }
        } catch (error) {
            console.error("[v0] Error updating driver:", error);
            setUpdateError("Failed to update driver due to a network or server issue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDriver = (id: number) => {
        setDriverToDelete(id);
    };

    const confirmDelete = async () => {
        if (driverToDelete === null) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin-drivers`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: driverToDelete }),
            });

            if (response.ok) {
                setDrivers(drivers.filter((d) => d.id !== driverToDelete));
                setConfirmationMessage("Driver deleted successfully!");
                setTimeout(() => setConfirmationMessage(null), 3000);
            } else {
                const errorData = await response.json();
                console.error("[v0] Failed to delete driver:", errorData.message);
            }
        } catch (error) {
            console.error("[v0] Error deleting driver:", error);
        } finally {
            setDriverToDelete(null);
            setIsLoading(false);
        }
    };

    // New function to prompt for confirmation before toggling status
    const promptToggleAvailability = (driver: Driver) => {
        setDriverToToggle(driver);
    };

    // New function to confirm the status toggle
    const confirmToggleAvailability = async () => {
        if (!driverToToggle) return;

        setIsLoading(true);
        const newStatus = !driverToToggle.availability_status;

        try {
            // CORRECTED URL AND METHOD: Now uses PATCH to the new endpoint
            const response = await fetch(`/api/admin-drivers/availability`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: driverToToggle.id,
                    availability_status: newStatus,
                }),
            });

            if (response.ok) {
                const updatedDriver = await response.json();
                setDrivers(drivers.map((d) => (d.id === driverToToggle.id ? updatedDriver : d)));
                setConfirmationMessage(`Driver's status updated to ${newStatus ? 'Available' : 'Not Available'}.`);
                setTimeout(() => setConfirmationMessage(null), 3000);
            } else {
                console.error("[v0] Failed to update driver availability:", await response.json());
            }
        } catch (error) {
            console.error("[v0] Error updating driver availability:", error);
        } finally {
            setIsLoading(false);
            setDriverToToggle(null); // Close the dialog
        }
    };

    const updateFormData = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddDialogStateChange = (open: boolean) => {
        if (open) {
            setFormData({
                name: "",
                surname: "",
                license: "",
                contact_details: "",
                email: "",
                availability_status: true,
                password: "12345",
            });
            setAddError(null);
        }
        setIsAddDialogOpen(open);
    };

    const availableDrivers = drivers.filter((d) => d.availability_status).length;
    
    const handleSortByName = () => {
        setSortByNameOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    };

    const toggleShowAvailableOnly = () => {
        setShowAvailableOnly(prevState => !prevState);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Manage Drivers</h1>
                    <p className="text-muted-foreground">Add, edit, and manage driver profiles and availability</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogStateChange}>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Driver
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Driver</DialogTitle>
                            <DialogDescription>Enter the driver's information to create a new profile.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">First Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => updateFormData("name", e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="surname">Last Name</Label>
                                    <Input
                                        id="surname"
                                        value={formData.surname}
                                        onChange={(e) => updateFormData("surname", e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData("email", e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="license">Driver's License</Label>
                                <Input
                                    id="license"
                                    value={formData.license}
                                    onChange={(e) => updateFormData("license", e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_details">Contact Number</Label>
                                <Input
                                    id="contact_details"
                                    value={formData.contact_details}
                                    onChange={(e) => updateFormData("contact_details", e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="availability">Available for assignments</Label>
                                <Switch
                                    id="availability"
                                    checked={formData.availability_status}
                                    onCheckedChange={(checked) => updateFormData("availability_status", checked)}
                                    disabled={isLoading}
                                />
                            </div>
                            {addError && <span className="text-red-500 text-sm mt-2">{addError}</span>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                            <Button onClick={handleAddDriver} disabled={isLoading}>
                                {isLoading ? "Adding Driver..." : "Add Driver"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search, Stats, and Sorting/Filtering */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search drivers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                        disabled={isLoading}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                        {availableDrivers} Available Drivers
                    </Badge>
                    <Button
                        variant="outline"
                        onClick={handleSortByName}
                        disabled={isLoading}
                    >
                        Sort by Name
                        {sortByNameOrder === 'asc' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />}
                    </Button>
                    <Button
                        variant={showAvailableOnly ? "default" : "outline"}
                        onClick={toggleShowAvailableOnly}
                        disabled={isLoading}
                    >
                        Show Available
                    </Button>
                </div>
            </div>


            {/* Confirmation Message */}
            {confirmationMessage && (
                <div className="flex justify-center p-4">
                    <div className="bg-green-100 text-green-700 py-2 px-4 rounded-md animate-fade-in-down">
                        {confirmationMessage}
                    </div>
                </div>
            )}

            {/* Drivers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Driver Directory</CardTitle>
                    <CardDescription>Complete list of registered drivers</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <p className="text-muted-foreground animate-pulse">Loading drivers...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>License</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedDrivers.length > 0 ? (
                                    displayedDrivers.map((driver) => (
                                        <TableRow key={driver.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {driver.name} {driver.surname}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{driver.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{driver.license}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{driver.contact_details}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={driver.availability_status}
                                                        onCheckedChange={() => promptToggleAvailability(driver)}
                                                        disabled={isLoading}
                                                        className="h-4 w-8"
                                                    />
                                                    <Badge variant={driver.availability_status ? "default" : "secondary"}>
                                                        {driver.availability_status ? "Available" : "Not Available"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEditDriver(driver)} disabled={isLoading}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteDriver(driver.id)} disabled={isLoading}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No drivers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingDriver} onOpenChange={() => { setEditingDriver(null); setUpdateError(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Driver</DialogTitle>
                        <DialogDescription>Update the driver's information.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">First Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => updateFormData("name", e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-surname">Last Name</Label>
                                <Input
                                    id="edit-surname"
                                    value={formData.surname}
                                    onChange={(e) => updateFormData("surname", e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateFormData("email", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-license">Driver's License</Label>
                            <Input
                                id="edit-license"
                                value={formData.license}
                                onChange={(e) => updateFormData("license", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-contact_details">Contact Number</Label>
                            <Input
                                id="edit-contact_details"
                                value={formData.contact_details}
                                onChange={(e) => updateFormData("contact_details", e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {/* Note: The availability switch is deliberately not in the edit dialog */}
                        {updateError && <span className="text-red-500 text-sm mt-2">{updateError}</span>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingDriver(null)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleUpdateDriver} disabled={isLoading}>
                            {isLoading ? "Updating Driver..." : "Update Driver"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={driverToDelete !== null} onOpenChange={() => setDriverToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the driver from the database together with requests associated with this driver.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDriverToDelete(null)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Status Confirmation Dialog */}
            <Dialog open={!!driverToToggle} onOpenChange={() => setDriverToToggle(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to change the availability status for {driverToToggle?.name} {driverToToggle?.surname}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDriverToToggle(null)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={confirmToggleAvailability} disabled={isLoading}>
                            {isLoading ? "Updating..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}