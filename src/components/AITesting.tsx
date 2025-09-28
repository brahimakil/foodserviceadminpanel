import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Sparkles,
  Key,
  MessageSquare,
  Send,
  X,
  Paperclip
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProducts, useCategories, useBrands } from "@/hooks/useFirebase";

interface AIResponse {
  type: 'product' | 'category' | 'brand' | 'unknown' | 'general';
  found: boolean;
  matchedItem?: any;
  confidence?: number;
  reasoning?: string;
  response?: string;
}

const AITesting = () => {
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini-api-key') || '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [textQuery, setTextQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [testConnection, setTestConnection] = useState(false);

  // Get data for AI context
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const handleApiKeyChange = (value: string) => {
    setGeminiApiKey(value);
    localStorage.setItem('gemini-api-key', value);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const testGeminiConnection = async () => {
    if (!geminiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key first",
        variant: "destructive",
      });
      return;
    }

    setTestConnection(true);
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello, this is a connection test. Please respond with 'Connection successful'."
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        toast({
          title: "Connection Successful",
          description: `Gemini 2.0 Flash API is working: ${responseText}`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: "Please check your API key and try again",
        variant: "destructive",
      });
    } finally {
      setTestConnection(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!geminiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key first",
        variant: "destructive",
      });
      return;
    }

    if (!textQuery && !selectedImage) {
      toast({
        title: "Input Required",
        description: "Please enter a question or upload an image",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create intelligent context with conceptual matching
      const systemContext = `
You are an intelligent AI assistant for a food service system. You understand products conceptually and can suggest alternatives when exact matches aren't available.

COMPLETE SYSTEM INVENTORY:

PRODUCTS (with full details):
${products.map(p => {
  const category = categories.find(c => c.id === p.category);
  return `• "${p.title}" 
  - Description: ${p.description || 'No description available'}
  - Category: ${category?.name || 'Uncategorized'}
  - Price: ${p.price ? '$' + p.price : 'Price not listed'}
  - Best Seller: ${p.isBestSeller ? 'Yes' : 'No'}`;
}).join('\n')}

CATEGORIES:
${categories.map(c => `• "${c.name}" - ${c.description || 'No description available'}`).join('\n')}

BRANDS:
${brands.map(b => `• "${b.name}" - ${b.description || 'No description available'}`).join('\n')}

ADVANCED MATCHING INSTRUCTIONS:
1. **EXACT MATCHING FIRST**: Look for exact or close spelling matches
2. **CONCEPTUAL UNDERSTANDING**: If no exact match, understand WHAT the user is asking for:
   - "cocola/coca cola" = carbonated soft drink → find sodas, colas, soft drinks
   - "pizza" = Italian flatbread with toppings → find pizza products or Italian food
   - "burger" = sandwich with meat patty → find burgers, sandwiches, meat products
   - "coffee" = hot beverage → find coffee, hot drinks, beverages
   - "chocolate" = sweet confection → find chocolate products, desserts, sweets
   - "bread" = baked grain product → find bread, bakery items, carbs
   - "milk" = dairy beverage → find milk, dairy products, beverages
   - "chips" = crispy snack → find chips, snacks, crisps
   - "juice" = fruit beverage → find juices, fruit drinks, beverages

3. **CATEGORY-BASED SEARCH**: Understand product categories and types:
   - Beverages: sodas, juices, water, coffee, tea, energy drinks
   - Snacks: chips, crackers, nuts, candy, cookies
   - Dairy: milk, cheese, yogurt, butter
   - Meat: chicken, beef, pork, fish, deli meats
   - Bakery: bread, pastries, cakes, muffins
   - Frozen: ice cream, frozen meals, frozen vegetables
   - Condiments: sauces, dressings, spices

4. **INTELLIGENT SUGGESTIONS**: When exact product not found:
   - Explain what the requested item is
   - Find similar products in our inventory
   - Suggest alternatives that serve the same purpose
   - Be specific about what we DO have

5. **RESPONSE STRATEGY**:
   - If exact match found: "found": true, list the products
   - If no exact match but similar products exist: "found": true, explain the alternatives
   - If no related products: "found": false, but explain what we searched for

${textQuery ? `User Question: ${textQuery}` : ''}
${selectedImage ? 'User has also provided an image for analysis.' : ''}

EXAMPLES OF SMART RESPONSES:

Example 1 - User asks for "cocola":
- First check: Do we have Coca-Cola? If yes, return it
- If no: "Cocola refers to Coca-Cola, which is a carbonated soft drink. While we don't have Coca-Cola specifically, we do have these similar carbonated beverages: [list sodas/soft drinks from inventory]"

Example 2 - User asks for "pizza":
- First check: Do we have pizza products? If yes, return them
- If no: "Pizza is an Italian dish with dough, sauce, and toppings. We don't have pizza specifically, but we have these Italian/similar products: [list pasta, Italian foods, or bread products]"

Example 3 - User asks for "energy drink":
- Search for energy drinks, if none found: "Energy drinks are caffeinated beverages for energy. We don't have energy drinks, but we have these energizing beverages: [list coffee, sodas with caffeine, etc.]"

Respond in JSON format:
{
  "type": "product|category|brand|general",
  "found": true/false,
  "matchedItem": "exact matches or conceptual alternatives",
  "confidence": 0-100,
  "reasoning": "explain your search process and conceptual matching",
  "response": "helpful response explaining what you found or suggesting alternatives"
}
`;

      // Prepare the request parts
      const parts: any[] = [{ text: systemContext }];

      // Add image if provided
      if (selectedImage) {
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(selectedImage);
        });

        parts.push({
          inline_data: {
            mime_type: selectedImage.type,
            data: base64Image
          }
        });
      }

      // Use Gemini 2.0 Flash model (supports both text and vision)
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Request failed'}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiText) {
        throw new Error('No response from AI');
      }

      try {
        // Clean the response if it has markdown code blocks
        const cleanedText = aiText.replace(/```json\s*|\s*```/g, '').trim();
        const parsedResponse = JSON.parse(cleanedText);
        setAiResponse(parsedResponse);
        
        toast({
          title: "Analysis Complete",
          description: `${parsedResponse.found ? 'Found matches or alternatives!' : 'Search completed'}`,
        });
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        // Fallback if JSON parsing fails
        setAiResponse({
          type: 'general',
          found: false,
          reasoning: 'AI provided unstructured response',
          response: aiText
        });
        
        toast({
          title: "Response Received",
          description: "AI provided a response",
        });
      }

    } catch (error) {
      console.error('AI Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Error processing request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Assistant Testing
          <Badge variant="outline" className="text-xs">Gemini 2.0 Flash</Badge>
        </CardTitle>
        <CardDescription>
          Test AI's ability to answer questions and recognize products, categories, and brands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Section */}
        <div className="space-y-3">
          <Label htmlFor="gemini-key">Gemini API Key</Label>
          <div className="flex gap-2">
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Gemini API key (X-goog-api-key)"
              value={geminiApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <Button 
              onClick={testGeminiConnection} 
              disabled={testConnection || !geminiApiKey}
              variant="outline"
            >
              {testConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from Google AI Studio. Using Gemini 2.0 Flash model for better performance.
          </p>
        </div>

        {/* System Data Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{products.length}</div>
            <div className="text-sm text-muted-foreground">Products</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{brands.length}</div>
            <div className="text-sm text-muted-foreground">Brands</div>
          </div>
        </div>

        {/* Chat-like Input Section */}
        <div className="space-y-3">
          <Label>Ask AI Assistant</Label>
          <div className="border rounded-lg p-4 bg-muted/20">
            {/* Image Preview Inside Input Area */}
            {imagePreview && (
              <div className="mb-4 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Uploaded" 
                  className="max-w-32 h-20 object-cover rounded border"
                />
                <Button
                  onClick={clearImage}
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {/* Text Input */}
            <Textarea
              placeholder={selectedImage 
                ? "Ask a question about the uploaded image..." 
                : "Ask about products, categories, or brands... e.g., 'Do you have Coca-Cola products?' or 'What's in the beverages category?'"
              }
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              rows={3}
              className="border-0 bg-transparent resize-none focus-visible:ring-0 p-0"
            />
            
            {/* Input Controls */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedImage ? 'Change Image' : 'Add Image'}
                    </span>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                
                {selectedImage && (
                  <Badge variant="outline" className="text-xs">
                    Image attached
                  </Badge>
                )}
              </div>
              
              {/* Send Button */}
              <Button 
                onClick={analyzeWithAI} 
                disabled={isAnalyzing || (!textQuery && !selectedImage) || !geminiApiKey}
                size="sm"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="space-y-3">
            <Label>AI Response</Label>
            <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 space-y-4">
              <div className="flex items-center gap-2">
                {aiResponse.found ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                )}
                <span className="font-medium">
                  {aiResponse.found ? 'Item Found' : 'AI Response'}
                </span>
                <Badge variant={aiResponse.found ? "default" : "secondary"}>
                  {aiResponse.type}
                </Badge>
              </div>

              {aiResponse.response && (
                <div className="bg-white/70 rounded-lg p-4 border">
                  <p className="text-sm leading-relaxed">{aiResponse.response}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {aiResponse.matchedItem && (
                  <div>
                    <span className="font-medium text-muted-foreground">Matched Item:</span>
                    <p className="font-medium">{aiResponse.matchedItem}</p>
                  </div>
                )}

                {aiResponse.confidence && (
                  <div>
                    <span className="font-medium text-muted-foreground">Confidence:</span>
                    <p className="font-medium">{aiResponse.confidence}%</p>
                  </div>
                )}
              </div>

              {aiResponse.reasoning && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Analysis:</span>
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    {aiResponse.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How to use:</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• <strong>Text only:</strong> Ask questions about products, categories, or brands</li>
                <li>• <strong>Image only:</strong> Click "Add Image" to upload for AI identification</li>
                <li>• <strong>Text + Image:</strong> Upload image and ask specific questions about it</li>
                <li>• <strong>Examples:</strong> "What beverages do you have?", "Is this product in your system?"</li>
                <li>• AI is restricted to only answer about system data - no external queries</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITesting;
