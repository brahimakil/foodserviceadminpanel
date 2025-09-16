import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts, useCategories } from "@/hooks/useFirebase";
import { Product, Category, PDFCatalog } from "@/types";
import { Download, FileText, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { generatePDF } from "@/services/pdfGenerator";

interface PDFPreviewProps {
  catalog: PDFCatalog;
}

const PDFPreview = ({ catalog }: PDFPreviewProps) => {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  // Force re-render when catalog changes
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [catalog, catalog.categories, catalog.coverPage, catalog.backPage]);

  const downloadPDF = async () => {
    if (!catalog.categories?.length) {
      alert('Please add some categories and products first');
      return;
    }
    
    setIsDownloading(true);
    try {
      await generatePDF(catalog, products, categories);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const getSelectedProductsCount = () => {
    return catalog.categories?.reduce((total, cat) => {
      return total + (cat.products?.filter(p => p.included).length || 0);
    }, 0) || 0;
  };

  const getCategoriesCount = () => {
    return catalog.categories?.length || 0;
  };

  const getSelectedProducts = () => {
    const selectedProducts: { category: Category; products: Product[] }[] = [];
    
    catalog.categories?.forEach(catOrder => {
      const category = categories.find(c => c.id === catOrder.categoryId);
      if (!category) return;
      
      const categoryProducts = catOrder.products
        ?.filter(p => p.included)
        .map(prodOrder => products.find(p => p.id === prodOrder.productId))
        .filter(Boolean) as Product[];
      
      if (categoryProducts.length > 0) {
        selectedProducts.push({ category, products: categoryProducts });
      }
    });
    
    return selectedProducts;
  };

  const selectedData = getSelectedProducts();

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>PDF Preview</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{getCategoriesCount()} categories</span>
                <span>{getSelectedProductsCount()} products</span>
                {catalog.coverPage && <Badge variant="outline">Cover</Badge>}
                {catalog.backPage && <Badge variant="outline">Back Page</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={downloadPDF}
              disabled={isDownloading || getCategoriesCount() === 0}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Preview Content */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[800px]">
            <div className="p-8 bg-gray-50">
              {selectedData.length > 0 ? (
                <div className="space-y-8">
                  {/* Cover Page Preview */}
                  <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
                    <div className="text-center">
                      {catalog.coverPage ? (
                        <div className="mb-8">
                          <img 
                            src={catalog.coverPage} 
                            alt="Cover" 
                            className="w-full max-w-md mx-auto rounded-lg shadow-md"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div className="mb-8 p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No cover image</p>
                        </div>
                      )}
                      
                      <h1 className="text-4xl font-bold mb-4 text-gray-800">{catalog.name}</h1>
                      <p className="text-xl text-gray-600 mb-4">Version {catalog.version}</p>
                      <p className="text-lg text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Back Page Preview */}
                  {catalog.backPage && (
                    <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
                      <div className="text-center">
                        <h2 className="text-3xl font-bold mb-8 text-gray-800">About Us</h2>
                        <img 
                          src={catalog.backPage} 
                          alt="About Us" 
                          className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                          style={{ maxHeight: '400px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Categories and Products Preview */}
                  {selectedData.map((categoryData, catIndex) => (
                    <div key={categoryData.category.id} className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
                      {/* Category Header */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                          {catIndex + 1}. {categoryData.category.name}
                        </h2>
                        {categoryData.category.description && (
                          <p className="text-gray-600 mb-4">{categoryData.category.description}</p>
                        )}
                        <hr className="border-gray-300" />
                      </div>

                      {/* Products */}
                      <div className="space-y-6">
                        {categoryData.products.map((product, prodIndex) => (
                          <div key={product.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.title}
                                  className="w-20 h-20 object-cover rounded-md border"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-grow">
                              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                                {catIndex + 1}.{prodIndex + 1} {product.title}
                              </h3>
                              {product.description && (
                                <p className="text-gray-600 mb-2 text-sm leading-relaxed">
                                  {product.description.length > 150 
                                    ? product.description.substring(0, 150) + '...'
                                    : product.description
                                  }
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                {product.price && (
                                  <span className="font-bold text-lg text-green-600">
                                    ${product.price}
                                  </span>
                                )}
                                {product.isBestSeller && (
                                  <Badge className="bg-yellow-500 text-white">
                                    BEST SELLER
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Page Footer */}
                      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                        Page {catIndex + (catalog.backPage ? 3 : 2)} - {catalog.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow-lg mx-auto text-center py-16" style={{ width: '210mm', minHeight: '297mm' }}>
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">No Content Selected</h3>
                  <p className="text-gray-500 mb-6">
                    Go to the Builder tab to add categories and products to your catalog.
                  </p>
                  <div className="text-sm text-gray-400">
                    Current catalog: {catalog.name} v{catalog.version}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFPreview;
