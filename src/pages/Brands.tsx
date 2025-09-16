import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
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
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Loader2,
  Building2
} from "lucide-react";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/useFirebase";
import type { Brand } from "@/types";

const Brands = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive"
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Queries and mutations
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  // Filter brands
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || brand.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active"
    });
    setLogoFile(null);
    setLogoPreview("");
    setEditingBrand(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const brandData = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      logo: logoPreview || undefined, // Add this line to include the logo
    };

    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({
          id: editingBrand.id,
          data: brandData,
          imageFile: logoFile || undefined
        });
      } else {
        await createBrand.mutateAsync({
          data: brandData,
          imageFile: logoFile || undefined
        });
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description,
      status: brand.status
    });
    setLogoPreview(brand.logo || "");
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      await deleteBrand.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Brands</h1>
          <p className="text-muted-foreground">Manage your product brands and suppliers</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </DialogTitle>
              <DialogDescription>
                {editingBrand ? 'Update brand information' : 'Add a new brand or supplier to your catalog'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Coca-Cola, Nestlé, Samsung"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description about the brand, their products, or partnership details"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="logo">Brand Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo Preview" className="h-24 w-24 object-contain rounded border" />
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Inactive brands won't be available when adding new products
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBrand.isPending || updateBrand.isPending}>
                  {(createBrand.isPending || updateBrand.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingBrand ? 'Update Brand' : 'Create Brand'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.filter(b => b.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.filter(b => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(b.createdAt) > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brandsLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredBrands.length > 0 ? (
          filteredBrands.map((brand) => (
            <Card key={brand.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {brand.logo ? (
                      <img 
                        src={brand.logo} 
                        alt={brand.name}
                        className="h-12 w-12 object-contain rounded border"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <Badge variant={brand.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                        {brand.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(brand)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(brand.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 mb-3">
                  {brand.description}
                </CardDescription>
                <div className="text-xs text-muted-foreground">
                  Added {new Date(brand.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No brands found</p>
            <p className="text-sm">Add your first brand to get started</p>
          </div>
        )}
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            All Brands ({filteredBrands.length})
          </CardTitle>
          <CardDescription>
            Complete list of brands and suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="h-8 w-8 object-contain rounded border" />
                        ) : (
                          <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{brand.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                        {brand.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(brand.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(brand.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBrands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No brands found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Brands;
