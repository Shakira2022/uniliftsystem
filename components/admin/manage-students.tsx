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
import { Search, Plus, Edit, Trash2, User, Phone, Mail, MapPin, Loader2, ArrowUpDown } from "lucide-react"
import type { Student } from "@/lib/types"

export function ManageStudents() {
    const [students, setStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isTableLoading, setIsTableLoading] = useState(true);

    const [formData, setFormData] = useState({
        student_number: "",
        name: "",
        surname: "",
        res_address: "",
        contact_details: "",
        email: "",
        res_name: "",
        street_name: "",
        house_number: ""
    })

    const validateFormData = (data: typeof formData, isUpdate: boolean): string | null => {
        // Validate required fields
        if (!data.student_number.trim()) return "Student number is required.";
        if (!data.name.trim()) return "First name is required.";
        if (!data.surname.trim()) return "Last name is required.";
        if (!data.contact_details.trim()) return "Contact number is required.";
        if (!data.email.trim()) return "Email is required.";
        if (!data.res_name.trim()) return "Residence name is required.";
        if (!data.street_name.trim()) return "Street name is required.";
        if (!data.house_number.trim()) return "House number is required.";
    
        // Specific validation rules
        // Email must end with @student.com
        if (!data.email.endsWith("@gmail.com")) {
            return "Email must end with @gmail.com";
        }
    
        // Contact number must be 10 digits and start with 0
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(data.contact_details)) {
            return "Contact number must be exactly 10 digits and start with '0'.";
        }
    
        // Student number must be 8 digits
        const studentNumberRegex = /^\d{8}$/;
        if (!studentNumberRegex.test(data.student_number)) {
            return "Student number must be exactly 8 digits.";
        }
    
        return null; // No validation errors
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_number.includes(searchTerm) ||
            student.res_address.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortDirection === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });

    useEffect(() => {
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        setIsTableLoading(true);
        try {
            const response = await fetch("/api/students")
            if (response.ok) {
                const data = await response.json()
                setStudents(data)
            }
        } catch (error) {
            console.error("[v0] Error fetching students:", error)
        } finally {
            setIsTableLoading(false);
        }
    }

    const handleAddStudent = async () => {
        const validationError = validateFormData(formData, false);
        if (validationError) {
            setAddError(validationError);
            return;
        }

        setIsLoading(true)
        setAddError(null)
        try {
            const fullAddress = `${formData.res_name}, ${formData.house_number} ${formData.street_name}`;
            const studentData = { ...formData, res_address: fullAddress };

            const response = await fetch("/api/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(studentData),
            })

            if (response.ok) {
                const newStudent = await response.json()
                setStudents([...students, newStudent])
                setFormData({ student_number: "", name: "", surname: "", contact_details: "", email: "", res_name: "", street_name: "", house_number: "", res_address: ""})
                fetchStudents();
                setConfirmationMessage("Student added successfully! 🎉");
                setTimeout(() => setConfirmationMessage(null), 3000);
                setIsAddDialogOpen(false)
            } else {
                const errorData = await response.json();
                setAddError(errorData.message || "Failed to add student.");
            }
        } catch (error) {
            console.error("[v0] Error adding student:", error)
            setAddError("Failed to add student due to a network or server issue.");
        }
        setIsLoading(false)
    }

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student)
        const [resName, rest] = student.res_address.split(',').map(s => s.trim());
        const [houseNumber, ...streetParts] = rest.split(' ').filter(Boolean);
        const streetName = streetParts.join(' ');
        setFormData({
            student_number: student.student_number,
            name: student.name,
            surname: student.surname,
            contact_details: student.contact_details,
            email: student.email,
            res_name: resName,
            street_name: streetName,
            house_number: houseNumber,
            res_address: student.res_address
        })
    }

    const handleUpdateStudent = async () => {
        if (!editingStudent) return
        const validationError = validateFormData(formData, true);
        if (validationError) {
            setUpdateError(validationError);
            return;
        }
        setUpdateError(null);
        setIsLoading(true)
        try {
            const fullAddress = `${formData.res_name}, ${formData.house_number} ${formData.street_name}`;
            const studentData = { ...formData, id: editingStudent.id, res_address: fullAddress };

            const response = await fetch(`/api/students`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(studentData),
            })

            if (response.ok) {
                const updatedStudent = await response.json()
                setStudents(students.map((s) => (s.id === editingStudent.id ? updatedStudent : s)))
                setFormData({ student_number: "", name: "", surname: "", contact_details: "", email: "", res_name: "", street_name: "", house_number: "", res_address: "" })
                fetchStudents();
                setConfirmationMessage("Student updated successfully! 🎉");
                setTimeout(() => setConfirmationMessage(null), 3000);
                setEditingStudent(null)
            } else {
                let errorData: any = {}
                try {
                    errorData = await response.json()
                } catch {
                    errorData = { message: "An unknown error occurred." };
                }

                setUpdateError(errorData.message || "Failed to update student. Please check your inputs.");
            }
        } catch (error) {
            console.error("[v0] Error updating student:", error)
            setUpdateError("Failed to update student due to a network or server issue.");
        }
        setIsLoading(false)
    }

    const handleDeleteStudent = (id: number) => {
        setStudentToDelete(id);
    };

    const confirmDelete = async () => {
        if (studentToDelete === null) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/students`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: studentToDelete }),
            });

            if (response.ok) {
                setStudents(students.filter((s) => s.id !== studentToDelete));
                setConfirmationMessage("Student deleted successfully!🗑️");
                setTimeout(() => setConfirmationMessage(null), 3000);
            } else {
                const errorData = await response.json();
                console.error("[v0] Failed to delete student:", errorData.message);
            }
        } catch (error) {
            console.error("[v0] Error deleting student:", error);
        } finally {
            setStudentToDelete(null);
            setIsLoading(false);
        }
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleAddDialogStateChange = (open: boolean) => {
        if (open) {
            setFormData({
                student_number: "",
                name: "",
                surname: "",
                contact_details: "",
                email: "",
                res_name: "",
                street_name: "",
                house_number: "",
                res_address: ""
            });
            setAddError(null);
        }
        setIsAddDialogOpen(open);
    };

    const toggleSortDirection = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Manage Students</h1>
                    <p className="text-muted-foreground">Add, edit, and manage student profiles</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogStateChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>Enter the student's information to create a new profile.</DialogDescription>
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="surname">Last Name</Label>
                                    <Input
                                        id="surname"
                                        value={formData.surname}
                                        onChange={(e) => updateFormData("surname", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_number">Student Number</Label>
                                <Input
                                    id="student_number"
                                    value={formData.student_number}
                                    onChange={(e) => updateFormData("student_number", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData("email", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_details">Contact Number</Label>
                                <Input
                                    id="contact_details"
                                    value={formData.contact_details}
                                    onChange={(e) => updateFormData("contact_details", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="res_name">Residence Name</Label>
                                    <Input
                                        id="res_name"
                                        value={formData.res_name}
                                        onChange={(e) => updateFormData("res_name", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="house_number">House Number</Label>
                                    <Input
                                        id="house_number"
                                        value={formData.house_number}
                                        onChange={(e) => updateFormData("house_number", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="street_name">Street Name</Label>
                                    <Input
                                        id="street_name"
                                        value={formData.street_name}
                                        onChange={(e) => updateFormData("street_name", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddStudent} className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Adding Student..." : "Add Student"}
                            </Button>
                            {addError && (
                                <span className="text-red-500 text-sm mt-2">{addError}</span>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Stats */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Badge variant="outline" className="text-sm">
                    {filteredStudents.length} of {students.length} students
                </Badge>
                <Button variant="outline" onClick={toggleSortDirection} className="p-2">
                    Sort by Name ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Confirmation Message */}
            {confirmationMessage && (
                <div className="flex justify-center p-4">
                    <div className="bg-green-100 text-green-700 py-2 px-4 rounded-md">
                        {confirmationMessage}
                    </div>
                </div>
            )}

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Student Directory</CardTitle>
                    <CardDescription>Complete list of registered students</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Info</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Residence</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isTableLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="mt-2 text-muted-foreground">Loading students...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedStudents.length > 0 ? (
                                sortedStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {student.name} {student.surname}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">#{student.student_number}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{student.contact_details}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{student.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{student.res_address}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingStudent} onOpenChange={() => { setEditingStudent(null); setUpdateError(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Student</DialogTitle>
                        <DialogDescription>Update the student's information.</DialogDescription>
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-surname">Last Name</Label>
                                <Input
                                    id="edit-surname"
                                    value={formData.surname}
                                    onChange={(e) => updateFormData("surname", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-student_number">Student Number</Label>
                            <Input
                                id="edit-student_number"
                                value={formData.student_number}
                                onChange={(e) => updateFormData("student_number", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateFormData("email", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-contact_details">Contact Number</Label>
                            <Input
                                id="edit-contact_details"
                                value={formData.contact_details}
                                onChange={(e) => updateFormData("contact_details", e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-res_name">Residence Name</Label>
                                <Input
                                    id="edit-res_name"
                                    value={formData.res_name}
                                    onChange={(e) => updateFormData("res_name", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-house_number">House Number</Label>
                                <Input
                                    id="edit-house_number"
                                    value={formData.house_number}
                                    onChange={(e) => updateFormData("house_number", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="edit-street_name">Street Name</Label>
                                <Input
                                    id="edit-street_name"
                                    value={formData.street_name}
                                    onChange={(e) => updateFormData("street_name", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button onClick={handleUpdateStudent} className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Updating Student..." : "Update Student"}
                        </Button>
                        {updateError && (
                            <span className="text-red-500 text-sm mt-2">{updateError}</span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={studentToDelete !== null} onOpenChange={() => setStudentToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the student from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setStudentToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}