import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Mail
} from "lucide-react";
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from "@/hooks/useFirebase";
import { toast } from "@/hooks/use-toast";
import type { Admin } from "@/types";

const AdminManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "active" as "active" | "inactive"
  });

  // Queries and mutations
  const { data: admins = [], isLoading: adminsLoading } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || admin.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Helper function to format date properly
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Never';
    
    try {
      // Handle Firestore Timestamp
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString();
      }
      // Handle regular Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      // Handle date string
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
      }
      return 'Never';
    } catch (error) {
      return 'Never';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <p className="text-muted-foreground">Manage admin users and permissions</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {admins.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Admins</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {admins.filter(a => a.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admins ({filteredAdmins.length})</CardTitle>
          <CardDescription>
            Manage admin users and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="text-center py-8">Loading admins...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={admin.status === 'active' ? 'default' : 'destructive'}
                      >
                        {admin.status === 'active' ? (
                          <><Eye className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(admin.lastLogin)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setFormData({
                                name: admin.name,
                                email: admin.email,
                                password: "",
                                status: admin.status
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(admin.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Add a new admin user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createAdmin.isPending}>
              {createAdmin.isPending ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="pl-10 bg-muted cursor-not-allowed opacity-60"
                  placeholder="Email cannot be changed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Email addresses cannot be modified for security reasons
              </p>
            </div>
            <div>
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep the current password unchanged
              </p>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateAdmin.isPending}>
              {updateAdmin.isPending ? "Updating..." : "Update Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper functions
  async function handleCreate() {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAdmin.mutateAsync({
        ...formData,
        lastLogin: undefined // Don't set lastLogin on creation
      });

      toast({
        title: "Success",
        description: "Admin created successfully",
      });

      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      });
    }
  }

  async function handleUpdate() {
    if (!selectedAdmin || !formData.name.trim()) return;

    try {
      const updateData: any = {
        name: formData.name,
        status: formData.status,
        // Don't include email in updates
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await updateAdmin.mutateAsync({
        id: selectedAdmin.id,
        data: updateData
      });

      toast({
        title: "Success",
        description: "Admin updated successfully",
      });

      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      await deleteAdmin.mutateAsync(id);
      toast({
        title: "Success",
        description: "Admin deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      password: "",
      status: "active"
    });
    setSelectedAdmin(null);
  }
};

export default AdminManagement;
