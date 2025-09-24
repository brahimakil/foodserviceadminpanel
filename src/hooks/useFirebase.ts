import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  productService, 
  categoryService, 
  brandService, 
  bannerService,
  adminService,
  contactMessageService,
  getBannersByType,
  getBestSellers,
  pdfCatalogService  // Add this import
} from '@/services/firebase';
import { Product, Category, Brand, Banner, Admin, ContactMessage, PDFCatalog } from '@/types';

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, imageFile }: { data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; imageFile?: File }) =>
      productService.createWithImage(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      data, 
      imageFile, 
      oldImageUrl 
    }: { 
      id: string; 
      data: Partial<Omit<Product, 'id' | 'createdAt'>>; 
      imageFile?: File;
      oldImageUrl?: string;
    }) => productService.updateWithImage(id, data, imageFile, oldImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    },
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, imageFile }: { data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>; imageFile?: File }) =>
      categoryService.createWithImage(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      data, 
      imageFile, 
      oldImageUrl 
    }: { 
      id: string; 
      data: Partial<Omit<Category, 'id' | 'createdAt'>>; 
      imageFile?: File;
      oldImageUrl?: string;
    }) => categoryService.updateWithImage(id, data, imageFile, oldImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    },
  });
};

export const useRecalculateProductCounts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => categoryService.recalculateProductCounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Product counts recalculated successfully');
    },
    onError: (error) => {
      console.error('Failed to recalculate product counts:', error);
      toast.error('Failed to recalculate product counts');
    },
  });
};

export const useRecalculateCategoryProductCount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryId: string) => categoryService.recalculateProductCount(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category product count updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update category product count:', error);
      toast.error('Failed to update category product count');
    },
  });
};

// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getAll(),
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, imageFile }: { data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>; imageFile?: File }) =>
      brandService.createWithImage(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
    },
    onError: (error) => {
      console.error('Failed to create brand:', error);
      toast.error('Failed to create brand');
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      data, 
      imageFile, 
      oldImageUrl 
    }: { 
      id: string; 
      data: Partial<Omit<Brand, 'id' | 'createdAt'>>; 
      imageFile?: File;
      oldImageUrl?: string;
    }) => brandService.updateWithImage(id, data, imageFile, oldImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update brand:', error);
      toast.error('Failed to update brand');
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => brandService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete brand:', error);
      toast.error('Failed to delete brand');
    },
  });
};

// Banners
export const useBanners = () => {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerService.getAll(),
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, imageFile }: { data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>; imageFile?: File }) =>
      bannerService.createWithImage(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner created successfully');
    },
    onError: (error) => {
      console.error('Failed to create banner:', error);
      toast.error('Failed to create banner');
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      data, 
      imageFile, 
      oldImageUrl 
    }: { 
      id: string; 
      data: Partial<Omit<Banner, 'id' | 'createdAt'>>; 
      imageFile?: File;
      oldImageUrl?: string;
    }) => bannerService.updateWithImage(id, data, imageFile, oldImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update banner:', error);
      toast.error('Failed to update banner');
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => bannerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    },
  });
};

// Admins
export const useAdmins = () => {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => adminService.getAll(),
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>) => adminService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Admin created successfully');
    },
    onError: (error) => {
      console.error('Failed to create admin:', error);
      toast.error('Failed to create admin');
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Admin, 'id' | 'createdAt'>> }) => 
      adminService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Admin updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update admin:', error);
      toast.error('Failed to update admin');
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast.success('Admin deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete admin:', error);
      toast.error('Failed to delete admin');
    },
  });
};

// Contact Messages
export const useContactMessages = () => {
  return useQuery({
    queryKey: ['contactMessages'],
    queryFn: () => contactMessageService.getAll(),
  });
};

export const useUpdateContactMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<ContactMessage, 'id' | 'createdAt'>> }) => 
      contactMessageService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      toast.success('Message updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update message:', error);
      toast.error('Failed to update message');
    },
  });
};

export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => contactMessageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      toast.success('Message deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    },
  });
};

// PDF Catalogs hooks
export const usePDFCatalogs = () => {
  return useQuery({
    queryKey: ['pdfCatalogs'],
    queryFn: () => pdfCatalogService.getAll(),
  });
};

export const usePDFCatalog = (id: string) => {
  return useQuery({
    queryKey: ['pdfCatalog', id],
    queryFn: () => pdfCatalogService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePDFCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<PDFCatalog, 'id' | 'createdAt' | 'updatedAt'>) => 
      pdfCatalogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfCatalogs'] });
      toast({
        title: "Success",
        description: "PDF catalog created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create PDF catalog",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePDFCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<PDFCatalog, 'id' | 'createdAt'>> }) =>
      pdfCatalogService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfCatalogs'] });
      toast({
        title: "Success",
        description: "PDF catalog updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update PDF catalog",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePDFCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pdfCatalogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfCatalogs'] });
      toast({
        title: "Success",
        description: "PDF catalog deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete PDF catalog",
        variant: "destructive",
      });
    },
  });
};

