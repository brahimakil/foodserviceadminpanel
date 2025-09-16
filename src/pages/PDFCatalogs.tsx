import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Eye, Settings } from "lucide-react";
import { usePDFCatalogs, useCreatePDFCatalog, useUpdatePDFCatalog } from "@/hooks/useFirebase";
import { PDFCatalog } from "@/types";
import SimplePDFBuilder from "@/components/pdf/SimplePDFBuilder";
import PDFPreview from "@/components/pdf/PDFPreview";

const PDFCatalogs = () => {
  const { data: catalogs = [], isLoading } = usePDFCatalogs();
  const createMutation = useCreatePDFCatalog();
  const updateMutation = useUpdatePDFCatalog();

  const [currentCatalog, setCurrentCatalog] = useState<PDFCatalog | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [isInitializing, setIsInitializing] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0); // Force re-render

  // Get or create the single PDF catalog
  useEffect(() => {
    if (catalogs.length > 0) {
      setCurrentCatalog(catalogs[0]);
      setCatalogVersion(prev => prev + 1); // Force preview update
    } else if (!isLoading && catalogs.length === 0) {
      initializeDefaultCatalog();
    }
  }, [catalogs, isLoading]);

  const initializeDefaultCatalog = async () => {
    setIsInitializing(true);
    try {
      const newCatalogId = await createMutation.mutateAsync({
        name: "Product Catalog",
        version: "1.0",
        isActive: true,
        categories: [],
      });
      // The catalog will be automatically set via the useEffect above
    } catch (error) {
      console.error('Error creating default catalog:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCatalogUpdate = async (updates: Partial<PDFCatalog>) => {
    if (!currentCatalog) return;
    
    try {
      await updateMutation.mutateAsync({
        id: currentCatalog.id,
        data: updates
      });
      // Update local state immediately for better UX
      setCurrentCatalog(prev => prev ? { ...prev, ...updates } : null);
      setCatalogVersion(prev => prev + 1); // Force preview update
    } catch (error) {
      console.error('Error updating catalog:', error);
    }
  };

  const handleCatalogInfoUpdate = async (name: string, version: string, isActive: boolean) => {
    await handleCatalogUpdate({ name, version, isActive });
  };

  if (isLoading || isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDF Catalog</h1>
            <p className="text-muted-foreground">Create and manage your product catalog</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDF Catalog</h1>
          <p className="text-muted-foreground">Create and manage your product catalog</p>
        </div>
        {currentCatalog && (
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'builder' ? 'default' : 'outline'}
              onClick={() => setActiveTab('builder')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Builder
            </Button>
            <Button
              variant={activeTab === 'preview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('preview')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>
        )}
      </div>

      {currentCatalog && (
        <>
          {/* Catalog Info Card */}
          <CatalogInfoCard 
            catalog={currentCatalog} 
            onUpdate={handleCatalogInfoUpdate}
          />

          {/* Main Content */}
          <div className="grid gap-6">
            {activeTab === 'builder' ? (
              <SimplePDFBuilder 
                key={`builder-${catalogVersion}`}
                catalog={currentCatalog} 
                onUpdate={handleCatalogUpdate} 
              />
            ) : (
              <PDFPreview 
                key={`preview-${catalogVersion}`}
                catalog={currentCatalog} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Separate component for catalog info
const CatalogInfoCard = ({ 
  catalog, 
  onUpdate 
}: { 
  catalog: PDFCatalog; 
  onUpdate: (name: string, version: string, isActive: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: catalog.name,
    version: catalog.version,
    isActive: catalog.isActive,
  });

  const handleSave = () => {
    onUpdate(formData.name, formData.version, formData.isActive);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: catalog.name,
      version: catalog.version,
      isActive: catalog.isActive,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold mb-1"
              />
            ) : (
              <CardTitle className="text-lg">{catalog.name}</CardTitle>
            )}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="w-20"
                  placeholder="1.0"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Version {catalog.version}</span>
              )}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              ) : (
                <Badge variant={catalog.isActive ? "default" : "secondary"}>
                  {catalog.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Edit Info
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default PDFCatalogs;
