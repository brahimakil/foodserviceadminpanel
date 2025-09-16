import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Upload file to Firebase Storage
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload image with automatic path generation
export const uploadImage = async (file: File, folder: string, filename?: string): Promise<string> => {
  const timestamp = Date.now();
  const name = filename || `${timestamp}_${file.name}`;
  const path = `${folder}/${name}`;
  return uploadFile(file, path);
};

// Delete file from Firebase Storage
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Upload functions for different types
export const uploadProductImage = (file: File, productId?: string) => {
  const filename = productId ? `product_${productId}_${Date.now()}` : undefined;
  return uploadImage(file, 'products', filename);
};

export const uploadCategoryImage = (file: File, categoryId?: string) => {
  const filename = categoryId ? `category_${categoryId}_${Date.now()}` : undefined;
  return uploadImage(file, 'categories', filename);
};

export const uploadBrandImage = (file: File, brandId?: string) => {
  const filename = brandId ? `brand_${brandId}_${Date.now()}` : undefined;
  return uploadImage(file, 'brands', filename);
};

export const uploadBannerImage = (file: File, bannerId?: string) => {
  const filename = bannerId ? `banner_${bannerId}_${Date.now()}` : undefined;
  return uploadImage(file, 'banners', filename);
};
