import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts, useCategories } from "@/hooks/useFirebase";
import { Product, Category, PDFCatalog, PDFCategoryOrder, PDFProductOrder } from "@/types";
import { FileText, Image, Download, Upload, X, RefreshCw } from "lucide-react";
import { pdfCatalogService } from "@/services/firebase";
import { generatePDF } from "@/services/pdfGenerator";

interface SimplePDFBuilderProps {
  catalog: PDFCatalog;
  onUpdate: (updates: Partial<PDFCatalog>) => void;
}

const SimplePDFBuilder = ({ catalog, onUpdate }: SimplePDFBuilderProps) => {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  
  const [selectedCategories, setSelectedCategories] = useState<PDFCategoryOrder[]>(
    catalog.categories || []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingSecond, setIsUploadingSecond] = useState(false);
  
  // Local state to track current images for immediate UI updates
  const [currentCoverPage, setCurrentCoverPage] = useState<string | undefined>(catalog.coverPage);
  const [currentSecondPage, setCurrentSecondPage] = useState<string | undefined>(catalog.backPage);
  
  const coverFileRef = useRef<HTMLInputElement>(null);
  const secondFileRef = useRef<HTMLInputElement>(null);

  // Helper function to get products for a category (handles both ID and name)
  const getProductsForCategory = (category: Category) => {
    return products.filter(product => {
      if (product.status !== 'active') return false;
      
      // Handle both cases: product.category could be either category ID or category name
      return product.category === category.id || product.category === category.name;
    });
  };

  // Replace the problematic useEffect with a simple, safe one
  useEffect(() => {
    // Only initialize if we have no selected categories and we have data
    if (selectedCategories.length === 0 && categories.length > 0 && products.length > 0) {
      console.log('🔄 Initial PDF catalog setup...');
      
      const activeCategories = categories.filter(cat => cat.status === 'active');
      
      const initialCategories = activeCategories.map((cat, index) => {
        const categoryProducts = getProductsForCategory(cat);
        
        const productOrders = categoryProducts.map((product, idx) => ({
          productId: product.id,
          order: idx + 1,
          included: true,
        }));
        
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          order: index + 1,
          newPageStart: true,
          products: productOrders
        };
      });
      
      console.log('✅ Initialized PDF catalog with', initialCategories.length, 'categories');
      setSelectedCategories(initialCategories);
      onUpdate({ categories: initialCategories });
    }
  }, [categories, products]); // Remove onUpdate from dependencies to prevent loops

  // Add a separate useEffect to handle updates when data changes
  useEffect(() => {
    // Only update if we already have selected categories and the data has changed
    if (selectedCategories.length > 0 && categories.length > 0 && products.length > 0) {
      console.log('🔄 Checking for data changes...');
      
      const activeCategories = categories.filter(cat => cat.status === 'active');
      
      // Check if we need to update by comparing current data with selected categories
      const needsUpdate = activeCategories.some(cat => {
        const existingCategory = selectedCategories.find(sc => sc.categoryId === cat.id);
        if (!existingCategory) return true; // New category
        
        const categoryProducts = getProductsForCategory(cat);
        const existingProductIds = existingCategory.products.map(p => p.productId);
        const currentProductIds = categoryProducts.map(p => p.id);
        
        // Check if products changed
        return JSON.stringify(existingProductIds.sort()) !== JSON.stringify(currentProductIds.sort());
      });
      
      if (needsUpdate) {
        console.log('🔄 Updating PDF catalog due to data changes...');
        
        // Update existing categories and add new ones
        const updatedCategories = activeCategories.map((cat, index) => {
          const categoryProducts = getProductsForCategory(cat);
          
          // Find existing category configuration
          const existingCategory = selectedCategories.find(sc => sc.categoryId === cat.id);
          
          const productOrders = categoryProducts.map((product, idx) => {
            // Try to preserve existing product configuration
            const existingProduct = existingCategory?.products.find(p => p.productId === product.id);
            return {
              productId: product.id,
              order: existingProduct?.order || idx + 1,
              included: existingProduct?.included !== undefined ? existingProduct.included : true,
            };
          });
          
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            order: existingCategory?.order || index + 1,
            newPageStart: existingCategory?.newPageStart !== undefined ? existingCategory.newPageStart : true,
            products: productOrders
          };
        });
        
        console.log('✅ Updated catalog with', updatedCategories.length, 'categories');
        setSelectedCategories(updatedCategories);
        onUpdate({ categories: updatedCategories });
      }
    }
  }, [categories, products, selectedCategories]); // Keep selectedCategories but add change detection

  // Manual refresh function for when you add/edit categories or products
  const refreshCatalogStructure = () => {
    console.log('🔄 Manual refresh of catalog structure...');
    
    const activeCategories = categories.filter(cat => cat.status === 'active');
    
    const refreshedCategories = activeCategories.map((cat, index) => {
      const categoryProducts = getProductsForCategory(cat);
      
      console.log(`📦 Category "${cat.name}" has ${categoryProducts.length} products`);
      
      const productOrders = categoryProducts.map((product, idx) => ({
        productId: product.id,
        order: idx + 1,
        included: true,
      }));
      
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        order: index + 1,
        newPageStart: true,
        products: productOrders
      };
    });
    
    console.log('✅ Refreshed catalog with', refreshedCategories.length, 'categories');
    setSelectedCategories(refreshedCategories);
    onUpdate({ categories: refreshedCategories });
  };


  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const imageUrl = await pdfCatalogService.uploadCoverPage(file);
      
      // Update local state immediately for UI feedback
      setCurrentCoverPage(imageUrl);
      
      // Update the database
      onUpdate({ coverPage: imageUrl });
    } catch (error) {
      console.error('Error uploading cover page:', error);
      alert('Failed to upload cover page');
    } finally {
      setIsUploadingCover(false);
      if (coverFileRef.current) {
        coverFileRef.current.value = '';
      }
    }
  };

  const handleSecondPageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingSecond(true);
      const imageUrl = await pdfCatalogService.uploadBackPage(file);
      
      // Update local state immediately for UI feedback
      setCurrentSecondPage(imageUrl);
      
      // Update the database
      onUpdate({ backPage: imageUrl });
    } catch (error) {
      console.error('Error uploading second page:', error);
      alert('Failed to upload second page');
    } finally {
      setIsUploadingSecond(false);
      if (secondFileRef.current) {
        secondFileRef.current.value = '';
      }
    }
  };

  const handleRemoveCoverPage = async () => {
    if (currentCoverPage) {
      try {
        await pdfCatalogService.deleteCoverPage(currentCoverPage);
        
        // Update local state immediately
        setCurrentCoverPage(undefined);
        
        // Update the database
        onUpdate({ coverPage: undefined });
      } catch (error) {
        console.error('Error removing cover page:', error);
      }
    }
  };

  const handleRemoveSecondPage = async () => {
    if (currentSecondPage) {
      try {
        await pdfCatalogService.deleteBackPage(currentSecondPage);
        
        // Update local state immediately
        setCurrentSecondPage(undefined);
        
        // Update the database
        onUpdate({ backPage: undefined });
      } catch (error) {
        console.error('Error removing second page:', error);
      }
    }
  };

  const handleCategoryOrderChange = (categoryId: string, newOrder: number) => {
    const updated = selectedCategories.map(cat => {
      if (cat.categoryId === categoryId) {
        return { ...cat, order: newOrder };
      }
      return cat;
    }).sort((a, b) => a.order - b.order);
    
    setSelectedCategories(updated);
    onUpdate({ categories: updated });
  };

  const handleProductIncludeToggle = (categoryId: string, productId: string) => {
    const updated = selectedCategories.map(cat => {
      if (cat.categoryId === categoryId) {
        return {
          ...cat,
          products: cat.products.map(p => {
            if (p.productId === productId) {
              return { ...p, included: !p.included };
            }
            return p;
          })
        };
      }
      return cat;
    });
    
    setSelectedCategories(updated);
    onUpdate({ categories: updated });
  };

  const handleProductOrderChange = (categoryId: string, productId: string, newOrder: number) => {
    const updated = selectedCategories.map(cat => {
      if (cat.categoryId === categoryId) {
        return {
          ...cat,
          products: cat.products.map(p => {
            if (p.productId === productId) {
              return { ...p, order: newOrder };
            }
            return p;
          }).sort((a, b) => a.order - b.order)
        };
      }
      return cat;
    });
    
    setSelectedCategories(updated);
    onUpdate({ categories: updated });
  };

  const handleNewPageToggle = (categoryId: string) => {
    const updated = selectedCategories.map(cat => {
      if (cat.categoryId === categoryId) {
        return { ...cat, newPageStart: !cat.newPageStart };
      }
      return cat;
    });
    
    setSelectedCategories(updated);
    onUpdate({ categories: updated });
  };

  const generateCatalogPDF = async () => {
    try {
      setIsGenerating(true);
      // Use the current local state for the most up-to-date catalog
      const updatedCatalog = {
        ...catalog,
        coverPage: currentCoverPage,
        backPage: currentSecondPage,
        categories: selectedCategories
      };
      await generatePDF(updatedCatalog, products, categories);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getProductById = (id: string) => products.find(p => p.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="space-y-6">
      {/* PDF Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Catalog: {catalog.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Version: {catalog.version}</Label>
            </div>
            <div>
              <Label>Status: </Label>
              <Badge variant={catalog.isActive ? 'default' : 'secondary'}>
                {catalog.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={generateCatalogPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover & Second Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Cover & Second Page (About Us)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Page */}
            <div>
              <Label className="text-sm font-medium">Cover Page</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                {currentCoverPage ? (
                  <div className="relative">
                    <img 
                      src={currentCoverPage} 
                      alt="Cover" 
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Error loading cover image');
                        setCurrentCoverPage(undefined);
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveCoverPage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Image className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Upload Cover Page</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
                
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {currentCoverPage ? 'Change' : 'Upload'} Cover
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Second Page (About Us) */}
            <div>
              <Label className="text-sm font-medium">Second Page (About Us)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                {currentSecondPage ? (
                  <div className="relative">
                    <img 
                      src={currentSecondPage} 
                      alt="Second Page" 
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Error loading second page image');
                        setCurrentSecondPage(undefined);
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveSecondPage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Image className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Upload Second Page</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
                
                <input
                  ref={secondFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSecondPageUpload}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => secondFileRef.current?.click()}
                  disabled={isUploadingSecond}
                >
                  {isUploadingSecond ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {currentSecondPage ? 'Change' : 'Upload'} Second Page
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories and Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories & Products Organization</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCatalogStructure}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Categories
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {selectedCategories
                .sort((a, b) => a.order - b.order)
                .map((categoryOrder) => {
                  const category = getCategoryById(categoryOrder.categoryId);
                  if (!category) return null;

                  return (
                    <Card key={categoryOrder.categoryId} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">Order:</Label>
                              <Input
                                type="number"
                                value={categoryOrder.order}
                                onChange={(e) => handleCategoryOrderChange(categoryOrder.categoryId, parseInt(e.target.value) || 1)}
                                className="w-16 h-8"
                                min={1}
                              />
                            </div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <Badge variant="outline">
                              {categoryOrder.products.filter(p => p.included).length} products
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`newpage-${categoryOrder.categoryId}`}
                                checked={categoryOrder.newPageStart}
                                onCheckedChange={() => handleNewPageToggle(categoryOrder.categoryId)}
                              />
                              <Label htmlFor={`newpage-${categoryOrder.categoryId}`} className="text-sm">
                                Start New Page
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {categoryOrder.products
                            .sort((a, b) => a.order - b.order)
                            .map((productOrder) => {
                              const product = getProductById(productOrder.productId);
                              if (!product) return null;

                              return (
                                <div key={productOrder.productId} className="flex items-center gap-3 p-2 border rounded">
                                  <Checkbox
                                    checked={productOrder.included}
                                    onCheckedChange={() => handleProductIncludeToggle(categoryOrder.categoryId, productOrder.productId)}
                                  />
                                  
                                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {product.image ? (
                                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        No Img
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{product.title}</h4>
                                    <p className="text-xs text-gray-500 truncate">{product.description}</p>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Label className="text-xs">Order:</Label>
                                    <Input
                                      type="number"
                                      value={productOrder.order}
                                      onChange={(e) => handleProductOrderChange(categoryOrder.categoryId, productOrder.productId, parseInt(e.target.value) || 1)}
                                      className="w-16 h-6 text-xs"
                                      min={1}
                                      disabled={!productOrder.included}
                                    />
                                  </div>

                                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {product.status}
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePDFBuilder;
