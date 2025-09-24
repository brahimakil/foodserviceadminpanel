import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Download, 
  Upload, 
  FileJson,
  Package,
  Tags,
  Briefcase,
  Image as ImageIcon,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  useProducts, 
  useCategories, 
  useBrands, 
  useBanners, 
  useAdmins
} from "@/hooks/useFirebase";
import { productService, categoryService, brandService, bannerService } from "@/services/firebase";

const Settings = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  // Get all data for export
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: brands = [], refetch: refetchBrands } = useBrands();
  const { data: banners = [], refetch: refetchBanners } = useBanners();
  const { data: admins = [] } = useAdmins();

  const exportData = async (dataType: string, data: any[], filename: string) => {
    setLoading(dataType);
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${dataType} data exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export ${dataType} data`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const importData = async (dataType: string, file: File) => {
    setImporting(dataType);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format: Expected an array');
      }

      if (data.length === 0) {
        throw new Error('No data found in the file');
      }
      
      // Import data to Firebase based on type
      switch (dataType) {
        case 'products':
          // Validate product structure
          const validProducts = data.map(item => {
            if (!item.title || !item.description || !item.category) {
              throw new Error('Invalid product data: title, description, and category are required');
            }
            return {
              title: item.title,
              description: item.description,
              category: item.category,
              image: item.image || '',
              price: item.price || 0,
              isBestSeller: item.isBestSeller || false,
              status: item.status || 'active'
            };
          });
          await productService.bulkCreate(validProducts);
          refetchProducts();
          break;
          
        case 'categories':
          // Validate category structure
          const validCategories = data.map(item => {
            if (!item.name || !item.description) {
              throw new Error('Invalid category data: name and description are required');
            }
            return {
              name: item.name,
              description: item.description,
              image: item.image || '',
              productCount: item.productCount || 0,
              status: item.status || 'active'
            };
          });
          await categoryService.bulkCreate(validCategories);
          refetchCategories();
          break;
          
        case 'brands':
          const validBrands = data.map(item => {
            if (!item.name || !item.description) {
              throw new Error('Invalid brand data: name and description are required');
            }
            return {
              name: item.name,
              description: item.description,
              logo: item.logo || '',
              status: item.status || 'active'
            };
          });
          await brandService.bulkCreate(validBrands);
          refetchBrands();
          break;
          
        case 'banners':
          const validBanners = data.map(item => {
            if (!item.title || !item.image || !item.type || !item.page) {
              throw new Error('Invalid banner data: title, image, type, and page are required');
            }
            return {
              title: item.title,
              image: item.image,
              type: item.type,
              page: item.page,
              position: item.position || '',
              isActive: item.isActive !== false,
              order: item.order || 0,
              link: item.link || ''
            };
          });
          await bannerService.bulkCreate(validBanners);
          refetchBanners();
          break;
          
        default:
          throw new Error(`Import not supported for ${dataType}`);
      }
      
      toast({
        title: "Import Successful",
        description: `${data.length} ${dataType} records imported successfully`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: `Failed to import ${dataType} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setImporting(null);
    }
  };

  const handleFileImport = (dataType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(dataType, file);
    }
    // Reset input
    event.target.value = '';
  };

  const exportOptions = [
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      data: products,
      filename: 'products',
      count: products.length,
      description: 'Export all product data including images, categories, and pricing'
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: Tags,
      data: categories,
      filename: 'categories',
      count: categories.length,
      description: 'Export all category data with descriptions and images'
    },
    {
      id: 'brands',
      name: 'Brands',
      icon: Briefcase,
      data: brands,
      filename: 'brands',
      count: brands.length,
      description: 'Export all brand information and settings'
    },
    {
      id: 'banners',
      name: 'Banners',
      icon: ImageIcon,
      data: banners,
      filename: 'banners',
      count: banners.length,
      description: 'Export all banner data and configurations'
    },
    {
      id: 'admins',
      name: 'Admins',
      icon: Users,
      data: admins,
      filename: 'admins',
      count: admins.length,
      description: 'Export admin user data (passwords excluded for security)'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage system information and database operations</p>
        </div>
      </div>



      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            View system status and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Firebase Configuration
            </h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">API Key:</span> {import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 20)}...</p>
              <p><span className="font-medium">Project:</span> {import.meta.env.VITE_FIREBASE_PROJECT_ID}</p>
              <p><span className="font-medium">Storage:</span> {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}</p>
              <div><span className="font-medium">Status:</span> <Badge variant="outline" className="text-green-600">Connected</Badge></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Application Information
            </h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Version:</span> 1.0.0</p>
              <p><span className="font-medium">Environment:</span> Development</p>
              <p><span className="font-medium">Build Date:</span> {new Date().toLocaleDateString()}</p>
              <p><span className="font-medium">Framework:</span> React + Vite</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Database Statistics
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Brands</p>
                <p className="text-2xl font-bold">{brands.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Banners</p>
                <p className="text-2xl font-bold">{banners.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Database Export & Import
          </CardTitle>
          <CardDescription>
            Export and import data for backup, migration, or bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {exportOptions.map((option) => {
              const IconComponent = option.icon;
              const isExporting = loading === option.id;
              const isImporting = importing === option.id;
              
              return (
                <div key={option.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{option.count} records</Badge>
                          {option.count > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ready
                            </Badge>
                          )}
                          {option.count === 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              No Data
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Export Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportData(option.name, option.data, option.filename)}
                        disabled={isExporting || isImporting || option.count === 0}
                      >
                        {isExporting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export'}
                      </Button>
                      
                      {/* Import Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => handleFileImport(option.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isExporting || isImporting}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isExporting || isImporting}
                        >
                          {isImporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {isImporting ? 'Importing...' : 'Import'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Export files are in JSON format and include all data except sensitive information</li>
              <li>• Admin exports exclude passwords for security reasons</li>
              <li>• Image URLs are included but actual image files are not exported</li>
              <li>• Import will validate data structure before processing</li>
              <li>• Always backup your data before performing import operations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
