import jsPDF from "jspdf";
import { PDFCatalog, Product, Category } from '@/types';

const extractStoragePath = (downloadUrl: string): string | null => {
  try {
    const match = downloadUrl.match(/\/o\/(.+?)\?/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
};

const loadFirebaseUrlToBase64 = async (downloadUrl: string): Promise<string | null> => {
  try {
    const storagePath = extractStoragePath(downloadUrl);
    if (!storagePath) {
      console.error('Could not extract storage path from:', downloadUrl);
      return null;
    }
    
    // Use your actual deployed function URL
    const functionUrl = `https://getimagebase64-5ocax2fewa-uc.a.run.app?path=${encodeURIComponent(storagePath)}`;
    
    console.log(`🔄 Fetching image via function: ${functionUrl}`);
    
    const response = await fetch(functionUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Got image data successfully`);
    return data.base64;
    
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
};

const addImageToPDF = async (pdf: jsPDF, url: string, x: number, y: number, w: number, h: number) => {
  const base64 = await loadFirebaseUrlToBase64(url);
  if (!base64) return false;
  const format = base64.includes("data:image/png") ? "PNG" : "JPEG";
  pdf.addImage(base64, format, x, y, w, h);
  return true;
};

export const generatePDF = async (
  catalog: PDFCatalog, 
  products: Product[], 
  categories: Category[]
): Promise<void> => {
  const pdf = new jsPDF();
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;

  // Enhanced placeholder with better styling
  const drawPlaceholder = (x: number, y: number, width: number, height: number, text: string) => {
    // Draw border
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 248, 248);
    pdf.rect(x, y, width, height, 'FD');
    
    // Add diagonal lines for "broken image" effect
    pdf.setDrawColor(220, 220, 220);
    pdf.line(x, y, x + width, y + height);
    pdf.line(x + width, y, x, y + height);
    
    // Add text
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(text, x + width/2, y + height/2, { align: 'center' });
    pdf.setTextColor(0, 0, 0); // Reset color
  };

  // Helper function to check if new page is needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  try {
    console.log('🚀 Starting PDF generation...');
    
    // ===== COVER PAGE =====
    if (catalog.coverPage) {
      console.log('📄 Processing cover page...');
      const coverAdded = await addImageToPDF(pdf, catalog.coverPage, 0, 0, pageWidth, pageHeight);
      
      if (!coverAdded) {
        console.log('📝 Using default cover page layout');
        // Fallback cover page
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text(catalog.name, pageWidth / 2, 50, { align: 'center' });
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Version: ${catalog.version}`, pageWidth / 2, 70, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 90, { align: 'center' });
        
        drawPlaceholder(20, 110, pageWidth - 40, 100, 'Cover Image Not Available');
      }
    } else {
      console.log('📝 No cover page uploaded, using default');
      // Default cover page
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text(catalog.name, pageWidth / 2, 50, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Version: ${catalog.version}`, pageWidth / 2, 70, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 90, { align: 'center' });
    }
    
    pdf.addPage();
    yPosition = 20;

    // ===== SECOND PAGE (ABOUT US) =====
    if (catalog.backPage) {
      console.log('📄 Processing about us page...');
      const aboutAdded = await addImageToPDF(pdf, catalog.backPage, 0, 0, pageWidth, pageHeight);
      
      if (!aboutAdded) {
        console.log('📝 Using default about us layout');
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text('About Us', 20, yPosition);
        yPosition += 20;
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text('Welcome to our product catalog.', 20, yPosition);
        yPosition += 10;
        pdf.text('We provide quality products and excellent service.', 20, yPosition);
        yPosition += 20;
        
        drawPlaceholder(20, yPosition, pageWidth - 40, 100, 'About Us Image Not Available');
      }
    } else {
      console.log('📝 No about us page uploaded, using default');
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('About Us', 20, yPosition);
      yPosition += 20;
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Welcome to our product catalog.', 20, yPosition);
      yPosition += 10;
      pdf.text('We provide quality products and excellent service.', 20, yPosition);
    }
    
    pdf.addPage();
    yPosition = 20;

    // ===== PRODUCTS SECTION =====
    const sortedCategories = catalog.categories?.sort((a, b) => a.order - b.order) || [];
    let categoryNumber = 1;

    console.log(`📦 Processing ${sortedCategories.length} categories...`);

    for (const categoryOrder of sortedCategories) {
      const category = categories.find(c => c.id === categoryOrder.categoryId);
      if (!category) continue;

      console.log(`📂 Processing category: ${category.name}`);

      // Start new page if specified
      if (categoryOrder.newPageStart && yPosition > 20) {
        pdf.addPage();
        yPosition = 20;
      }

      checkNewPage(40);

      // Category Header
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${categoryNumber}. ${category.name}`, 20, yPosition);
      yPosition += 15;

      if (category.description) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const desc = category.description.length > 100 ? category.description.substring(0, 100) + '...' : category.description;
        pdf.text(desc, 20, yPosition);
        yPosition += 15;
      }

      // Products
      const categoryProducts = categoryOrder.products?.filter(p => p.included).sort((a, b) => a.order - b.order) || [];
      let productNumber = 1;

      console.log(`🛍️ Processing ${categoryProducts.length} products in category ${category.name}`);

      for (const productOrder of categoryProducts) {
        const product = products.find(p => p.id === productOrder.productId);
        if (!product) continue;

        checkNewPage(50);

        console.log(`📦 Processing product: ${product.title}`);

        // Product title
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${categoryNumber}.${productNumber} ${product.title}`, 20, yPosition);
        yPosition += 10;

        // Product image
        const imageSize = 30;
        if (product.image) {
          console.log(`🖼️ Adding product image for: ${product.title}`);
          const imageAdded = await addImageToPDF(pdf, product.image, 20, yPosition, imageSize, imageSize);
          if (!imageAdded) {
            drawPlaceholder(20, yPosition, imageSize, imageSize, 'Image Failed');
          }
        } else {
          console.log(`📷 No image for product: ${product.title}`);
          drawPlaceholder(20, yPosition, imageSize, imageSize, 'No Image');
        }

        // Product details
        const textX = 20 + imageSize + 10;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if (product.description) {
          const lines = pdf.splitTextToSize(product.description, pageWidth - textX - 20);
          pdf.text(lines.slice(0, 2), textX, yPosition + 5);
        }

        if (product.price) {
          pdf.setFont(undefined, 'bold');
          pdf.text(`$${product.price}`, textX, yPosition + 20);
        }

        // Best seller badge
        if (product.isBestSeller) {
          pdf.setFillColor(255, 215, 0);
          pdf.rect(pageWidth - 50, yPosition, 30, 8, 'F');
          pdf.setFontSize(7);
          pdf.setTextColor(0, 0, 0);
          pdf.text('BEST SELLER', pageWidth - 47, yPosition + 5);
          pdf.setTextColor(0, 0, 0);
        }

        yPosition += Math.max(imageSize + 10, 35);
        productNumber++;
      }

      yPosition += 15;
      categoryNumber++;
    }

    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
    }

    // Save PDF
    const fileName = `${catalog.name.replace(/[^a-zA-Z0-9]/g, '_')}_v${catalog.version}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ PDF generated successfully!');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};
