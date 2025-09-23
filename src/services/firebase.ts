import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadProductImage, uploadCategoryImage, uploadBrandImage, uploadBannerImage, uploadFile, deleteFile } from "@/lib/storage";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { GripVertical, Edit, Check, X } from 'lucide-react';
import { useDrag } from 'react-dnd';

// Helper function to clean undefined values
const cleanData = (data: any): any => {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Helper to convert Firestore data
const convertFirestoreData = <T>(doc: any): T => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : data.lastLogin,
  } as T;
};

// Generic Firebase service class
class FirebaseService<T> {
  constructor(private collectionName: string) {}

  async getAll(): Promise<T[]> {
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as T[];
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate(),
      } as T;
    }
    return null;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const cleanedData = cleanData(data);
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...cleanedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    const cleanedData = cleanData(data);
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async query(field: string, operator: any, value: any): Promise<T[]> {
    const q = query(
      collection(db, this.collectionName), 
      where(field, operator, value),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as T[];
  }

  // Add bulk import method
  async bulkCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    items.forEach((item) => {
      const cleanedData = cleanData(item);
      const docRef = doc(collection(db, this.collectionName));
      batch.set(docRef, {
        ...cleanedData,
        createdAt: now,
        updatedAt: now,
      });
    });
    
    await batch.commit();
  }
}

// Product Service
export class ProductService extends FirebaseService<Product> {
  constructor() {
    super('products');
  }

  async createWithImage(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File): Promise<string> {
    let imageUrl = data.image || "";
    
    if (imageFile) {
      const productId = `temp_${Date.now()}`;
      imageUrl = await uploadProductImage(imageFile, productId);
    }

    const productData = cleanData({
      ...data,
      image: imageUrl || undefined, // Only include if not empty
    });

    return this.create(productData);
  }

  async updateWithImage(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>, imageFile?: File): Promise<void> {
    let updateData = { ...data };
    
    if (imageFile) {
      const imageUrl = await uploadProductImage(imageFile, id);
      updateData.image = imageUrl;
    }

    return this.update(id, updateData);
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    return this.query('category', '==', categoryId);
  }

  async getBestSellers(): Promise<Product[]> {
    return this.query('isBestSeller', '==', true);
  }
}

// Category Service
export class CategoryService extends FirebaseService<Category> {
  constructor() {
    super('categories');
  }

  async createWithImage(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File): Promise<string> {
    let imageUrl = data.image || "";
    
    if (imageFile) {
      imageUrl = await uploadCategoryImage(imageFile);
    }

    const categoryData = cleanData({
      ...data,
      image: imageUrl || undefined, // Only include if not empty
    });

    return this.create(categoryData);
  }

  async updateWithImage(id: string, data: Partial<Category>, imageFile?: File): Promise<void> {
    let updateData = { ...data };
    
    if (imageFile) {
      const imageUrl = await uploadCategoryImage(imageFile);
      updateData.image = imageUrl;
    }

    updateData.updatedAt = new Date();
    return this.update(id, updateData);
  }
}

// Brand Service - Fix the field names from 'image' to 'logo'
export class BrandService extends FirebaseService<Brand> {
  constructor() {
    super('brands');
  }

  async createWithImage(data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File): Promise<string> {
    let logoUrl = data.logo || "";
    
    if (imageFile) {
      logoUrl = await uploadBrandImage(imageFile);
    }

    const brandData = cleanData({
      ...data,
      logo: logoUrl || undefined, // Changed from 'image' to 'logo'
    });

    return this.create(brandData);
  }

  async updateWithImage(id: string, data: Partial<Brand>, imageFile?: File): Promise<void> {
    let updateData = { ...data };
    
    if (imageFile) {
      const logoUrl = await uploadBrandImage(imageFile);
      updateData.logo = logoUrl; // Changed from 'image' to 'logo'
    }

    return this.update(id, updateData);
  }
}

// Banner Service
export class BannerService extends FirebaseService<Banner> {
  constructor() {
    super('banners');
  }

  async createWithImage(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File): Promise<string> {
    let imageUrl = data.image || "";
    
    if (imageFile) {
      imageUrl = await uploadBannerImage(imageFile);
    }

    const bannerData = cleanData({
      ...data,
      image: imageUrl || undefined, // Only include if not empty
      link: data.link || undefined, // Only include if not empty
      description: data.description || undefined, // Only include if not empty
    });

    return this.create(bannerData);
  }

  async updateWithImage(id: string, data: Partial<Banner>, imageFile?: File): Promise<void> {
    let updateData = { ...data };
    
    if (imageFile) {
      const imageUrl = await uploadBannerImage(imageFile);
      updateData.image = imageUrl;
    }

    return this.update(id, updateData);
  }

  async getByPage(page: string): Promise<Banner[]> {
    const q = query(
      collection(db, 'banners'),
      where('page', 'in', [page, 'all']),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Banner[];
  }
}

// Admin Service
export class AdminService extends FirebaseService<Admin> {
  constructor() {
    super('admins');
  }

  async getByEmail(email: string): Promise<Admin | null> {
    const admins = await this.query('email', '==', email);
    return admins.length > 0 ? admins[0] : null;
  }
}

// Contact Message Service
export class ContactMessageService extends FirebaseService<ContactMessage> {
  constructor() {
    super('contactMessages');
  }

  async create(data: Omit<ContactMessage, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const now = Timestamp.now();
    const cleanedData = cleanData({
      ...data,
      createdAt: now,
      updatedAt: now,
      status: 'new',
    });
    return this.create(cleanedData);
  }

  async updateStatus(id: string, status: 'new' | 'read' | 'replied'): Promise<void> {
    const docRef = doc(db, 'contactMessages', id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }
}

// PDF Catalog Service
export class PDFCatalogService extends FirebaseService<PDFCatalog> {
  constructor() {
    super('pdfCatalogs');
  }

  async create(data: Omit<PDFCatalog, 'id' | 'createdAt' | 'updatedAt'>): Promise<PDFCatalog> {
    const cleanedData = cleanData({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const docRef = await addDoc(collection(db, this.collectionName), cleanedData);
    return { id: docRef.id, ...cleanedData } as PDFCatalog;
  }

  async update(id: string, data: Partial<Omit<PDFCatalog, 'id' | 'createdAt'>>): Promise<void> {
    const cleanedData = cleanData({
      ...data,
      updatedAt: new Date(),
    });

    await updateDoc(doc(db, this.collectionName, id), cleanedData);
  }

  async uploadCoverPage(file: File): Promise<string> {
    const filename = `cover_${Date.now()}_${file.name}`;
    return uploadFile(file, `catalogs/covers/${filename}`);
  }

  async uploadBackPage(file: File): Promise<string> {
    const filename = `second_${Date.now()}_${file.name}`;
    return uploadFile(file, `catalogs/seconds/${filename}`);
  }

  async deleteCoverPage(url: string): Promise<void> {
    return deleteFile(url);
  }

  async deleteBackPage(url: string): Promise<void> {
    return deleteFile(url);
  }
}

// Service instances
export const productService = new ProductService();
export const categoryService = new CategoryService();
export const brandService = new BrandService();
export const bannerService = new BannerService();
export const adminService = new AdminService();
export const contactMessageService = new ContactMessageService();
export const pdfCatalogService = new PDFCatalogService();

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
