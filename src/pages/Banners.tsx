import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Edit, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Info,
  Plus
} from "lucide-react";
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from "@/hooks/useFirebase";
import { uploadImage } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import type { Banner } from "@/types";

const PREDEFINED_BANNER_SLOTS = [
  {
    id: 'home-hero',
    name: 'Home Hero Banner',
    type: 'hero' as const,
    page: 'home' as const,
    position: 'Main Hero',
    description: 'Main hero section on homepage',
    dimensions: '1400×600px',
    location: 'Homepage top section'
  },
  {
    id: 'products-hero', 
    name: 'Products Page Hero',
    type: 'hero' as const,
    page: 'products' as const,
    position: 'Products Hero',
    description: 'Hero banner on products page',
    dimensions: '1400×480px',
    location: 'Products page header'
  },
  {
    id: 'brands-hero',
    name: 'Brands Page Hero',
    type: 'hero' as const,
    page: 'brands' as const,
    position: 'Brands Hero',
    description: 'Hero banner on brands page',
    dimensions: '1400×480px',
    location: 'Brands page header'
  },
  {
    id: 'about-hero',
    name: 'About Page Hero',
    type: 'hero' as const,
    page: 'about' as const, 
    position: 'About Hero',
    description: 'Hero banner on about page',
    dimensions: '1400×480px',
    location: 'About page header'
  },
  {
    id: 'contact-hero',
    name: 'Contact Page Hero', 
    type: 'hero' as const,
    page: 'contact' as const,
    position: 'Contact Hero',
    description: 'Hero banner on contact page',
    dimensions: '1400×480px',
    location: 'Contact page header'
  },
  {
    id: 'home-promotion',
    name: 'Best Sellers Promotion',
    type: 'promotion' as const,
    page: 'home' as const,
    position: 'Best Sellers',
    description: 'Promotional content in best sellers section',
    dimensions: '800×300px',
    location: 'Homepage best sellers area'
  },
  {
    id: 'footer-banners',
    name: 'Footer Banners',
    type: 'footer' as const,
    page: 'all' as const,
    position: 'Footer Banners', 
    description: 'Banner content in footer section',
    dimensions: '300×200px each',
    location: 'Footer section (up to 3 banners)'
  }
];

const Banners = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<typeof PREDEFINED_BANNER_SLOTS[0] | null>(null);
  
  // Update the state to handle multiple images
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "hero" as "hero" | "promotion" | "sidebar" | "footer",
    page: "home" as "home" | "products" | "about" | "contact" | "all",
    position: "",
    isActive: true,
    order: 1,
    link: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Add multiple images
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Add multiple previews

  // Queries and mutations
  const { data: banners = [], isLoading: bannersLoading } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  // Filter banners
  const filteredBanners = banners.filter(banner => 
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Banner title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const bannerData = {
        ...formData,
        link: formData.link?.trim() || "",
        description: formData.description?.trim() || "",
        image: "",
        images: [] as string[],
      };

      if (selectedBanner) {
        // Update existing banner
        if (formData.type === 'footer' && imageFiles.length > 0) {
          // Upload multiple images for footer
          const imageUrls = await Promise.all(
            imageFiles.map(file => uploadImage(file, 'banners'))
          );
          bannerData.images = imageUrls;
        } else if (imageFile) {
          // Single image for other types
          const imageUrl = await uploadImage(imageFile, 'banners');
          bannerData.image = imageUrl;
        }

        await updateBanner.mutateAsync({
          id: selectedBanner.id,
          data: bannerData,
        });
        toast({
          title: "Success",
          description: "Banner updated successfully",
        });
      } else {
        // Create new banner
        if (formData.type === 'footer') {
          if (imageFiles.length === 0) {
            toast({
              title: "Error",
              description: "Please upload at least one image (up to 3)",
              variant: "destructive",
            });
            return;
          }
          // Upload multiple images for footer
          const imageUrls = await Promise.all(
            imageFiles.map(file => uploadImage(file, 'banners'))
          );
          bannerData.images = imageUrls;
        } else {
          if (!imageFile) {
            toast({
              title: "Error",
              description: "Please upload a banner image",
              variant: "destructive",
            });
            return;
          }
          const imageUrl = await uploadImage(imageFile, 'banners');
          bannerData.image = imageUrl;
        }

        await createBanner.mutateAsync({
          data: bannerData,
        });
        toast({
          title: "Success",
          description: "Banner created successfully",
        });
      }

      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({
        title: "Error",
        description: selectedBanner ? "Failed to update banner" : "Failed to create banner",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setSelectedSlot(null);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      type: banner.type,
      page: banner.page,
      position: banner.position,
      isActive: banner.isActive,
      order: banner.order,
      link: banner.link || "",
    });
    setImagePreview(banner.image || "");
    setImagePreviews(banner.images || []); // Set multiple previews
    setImageFile(null); // Clear single image file
    setImageFiles([]); // Clear multiple image files
    setIsEditOpen(true);
  };

  const handleCreateForSlot = (slot: typeof PREDEFINED_BANNER_SLOTS[0]) => {
    setSelectedBanner(null);
    setSelectedSlot(slot);
    setFormData({
      title: slot.name,
      description: slot.description,
      type: slot.type,
      page: slot.page,
      position: slot.position,
      isActive: true,
      order: 1,
      link: "",
    });
    setImagePreview("");
    setImagePreviews([]);
    setImageFile(null);
    setImageFiles([]);
    setIsEditOpen(true);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBanner.mutateAsync({
        id: banner.id,
        data: { isActive: !banner.isActive }
      });
      
      toast({
        title: "Success",
        description: `Banner ${!banner.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update banner status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      await deleteBanner.mutateAsync(id);
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For footer banners, allow multiple images (up to 3)
    if (formData.type === 'footer') {
      const newFiles = Array.from(files);
      
      // Add to existing files, but limit to 3 total
      const combinedFiles = [...imageFiles, ...newFiles].slice(0, 3);
      setImageFiles(combinedFiles);
      
      // Generate previews for all files
      const previews = combinedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
      
      // Clear the input so the same file can be selected again
      e.target.value = '';
    } else {
      // Single image for other banner types
      const file = files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setSelectedBanner(null);
    setSelectedSlot(null);
    setFormData({
      title: "",
      description: "",
      type: "hero",
      page: "home",
      position: "",
      isActive: true,
      order: 1,
      link: "",
    });
    setImageFile(null);
    setImageFiles([]);
    setImagePreview("");
    setImagePreviews([]);
  };

  return (
    <div className="space-y-6">
      {/* Header - NO ADD BANNER BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
          <p className="text-muted-foreground">Manage your website banners for each page and section</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Banner Slots System</AlertTitle>
        <AlertDescription>
          Your website has 6 predefined banner slots. Each slot has a specific location, size, and purpose. 
          You can only create/edit banners for these existing slots.
        </AlertDescription>
      </Alert>

      {/* Predefined Banner Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Website Banner Slots</CardTitle>
          <CardDescription>
            These are the fixed banner positions in your website. Click to edit each banner slot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREDEFINED_BANNER_SLOTS.map((slot) => {
              const existingBanner = banners.find(banner => 
                banner.type === slot.type && 
                banner.page === slot.page && 
                banner.position === slot.position
              );
              
              return (
                <Card key={slot.id} className={`border-2 transition-colors ${
                  existingBanner ? 'border-green-200 bg-green-50/50' : 'border-dashed border-muted-foreground/30'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm">{slot.name}</h4>
                      {existingBanner ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Empty</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p><strong>Location:</strong> {slot.location}</p>
                      <p><strong>Size:</strong> {slot.dimensions}</p>
                      <p><strong>Type:</strong> {slot.type} • <strong>Page:</strong> {slot.page}</p>
                    </div>
                    
                    {existingBanner ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium truncate">{existingBanner.title}</p>
                        {existingBanner.image && (
                          <img 
                            src={existingBanner.image} 
                            alt={existingBanner.title}
                            className="w-full h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(existingBanner)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleActive(existingBanner)}
                          >
                            {existingBanner.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCreateForSlot(slot)}
                        className="w-full mt-3"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Banner
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Banners Table (for reference) */}
      <Card>
        <CardHeader>
          <CardTitle>All Active Banners</CardTitle>
          <CardDescription>
            Overview of all your website banners
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bannersLoading ? (
            <div className="text-center py-8">Loading banners...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBanners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      {banner.image ? (
                        <img 
                          src={banner.image} 
                          alt={banner.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{banner.title}</div>
                        {banner.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {banner.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {banner.page} • {banner.type}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {banner.position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={banner.isActive ? 'default' : 'destructive'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(banner)}
                      >
                        {banner.isActive ? (
                          <><Eye className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(banner.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBanners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No banners found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Banner Edit/Create Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBanner ? 'Edit Banner' : `Create ${selectedSlot?.name}`}
            </DialogTitle>
            <DialogDescription>
              {selectedSlot ? (
                <div className="space-y-2">
                  <p>Location: {selectedSlot.location}</p>
                  <p>Recommended size: {selectedSlot.dimensions}</p>
                </div>
              ) : (
                'Update banner information.'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Banner Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter banner title"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter banner description"
                rows={2}
              />
            </div>

            {/* Banner Location (Read-only) */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div><strong>Type:</strong> {formData.type}</div>
                <div><strong>Page:</strong> {formData.page}</div>
                <div><strong>Position:</strong> {formData.position}</div>
              </div>
            </div>

            {/* Link */}
            <div>
              <Label htmlFor="link">Link URL (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({...formData, link: e.target.value})}
                placeholder="https://example.com"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">
                {formData.type === 'footer' ? 'Banner Images (up to 3)' : 'Banner Image'}
              </Label>
              
              {formData.type === 'footer' ? (
                // Multiple image upload for footer
                <>
                  {/* Show existing images when editing */}
                  {selectedBanner?.images && selectedBanner.images.length > 0 && imagePreviews.length === 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Current Images:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedBanner.images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={img}
                              alt={`Current ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multiple Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Selected Images ({imagePreviews.length}/3):
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                const newFiles = imageFiles.filter((_, i) => i !== index);
                                const newPreviews = imagePreviews.filter((_, i) => i !== index);
                                setImageFiles(newFiles);
                                setImagePreviews(newPreviews);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button - Only show if less than 3 images */}
                  {imagePreviews.length < 3 && (
                    <div>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {imagePreviews.length > 0 
                          ? `Add ${3 - imagePreviews.length} more image(s). Recommended: 300×200px each`
                          : 'Upload 1-3 images. Recommended: 300×200px each'
                        }
                      </p>
                    </div>
                  )}

                  {imagePreviews.length === 3 && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Maximum 3 images selected
                    </p>
                  )}
                </>
              ) : (
                // Single image upload for other types
                <>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {selectedSlot && (
                    <p className="text-xs text-muted-foreground">
                      Recommended size: {selectedSlot.dimensions}
                    </p>
                  )}
                  
                  {/* Single Image Preview */}
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border mt-2"
                    />
                  )}
                  {selectedBanner?.image && !imagePreview && (
                    <img
                      src={selectedBanner.image}
                      alt="Current banner"
                      className="w-full h-32 object-cover rounded border mt-2"
                    />
                  )}
                </>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="active">Banner is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createBanner.isPending || updateBanner.isPending}
            >
              {createBanner.isPending || updateBanner.isPending 
                ? "Saving..." 
                : selectedBanner ? "Update Banner" : "Create Banner"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banners;
