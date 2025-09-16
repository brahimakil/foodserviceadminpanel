import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Tags, 
  Briefcase, 
  Image, 
  Users,
  TrendingUp,
  Eye,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Star,
  Activity,
  Loader2,
  MessageSquare,
  Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts, useCategories, useBrands, useBanners, useAdmins, useContactMessages } from "@/hooks/useFirebase";

const Dashboard = () => {
  // Fetch all data
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: banners = [], isLoading: bannersLoading } = useBanners();
  const { data: admins = [], isLoading: adminsLoading } = useAdmins();
  const { data: messages = [], isLoading: messagesLoading } = useContactMessages();

  const isLoading = productsLoading || categoriesLoading || brandsLoading || bannersLoading || adminsLoading || messagesLoading;

  // Calculate stats
  const activeProducts = products.filter(p => p.status === 'active').length;
  const bestSellers = products.filter(p => p.isBestSeller).length;
  const activeCategories = categories.filter(c => c.status === 'active').length;
  const activeBrands = brands.filter(b => b.status === 'active').length;
  const activeBanners = banners.filter(b => b.isActive).length;
  const activeAdmins = admins.filter(a => a.status === 'active').length;

  // Message stats
  const newMessages = messages.filter(m => m.status === 'new').length;
  const readMessages = messages.filter(m => m.status === 'read').length;
  const repliedMessages = messages.filter(m => m.status === 'replied').length;

  // Recent items (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentProducts = products.filter(p => new Date(p.createdAt) > weekAgo);
  const recentCategories = categories.filter(c => new Date(c.createdAt) > weekAgo);
  const recentBrands = brands.filter(b => new Date(b.createdAt) > weekAgo);
  const recentBanners = banners.filter(b => new Date(b.createdAt) > weekAgo);
  const recentMessages = messages.filter(m => new Date(m.createdAt) > weekAgo);

  const stats = [
    {
      title: "Total Products",
      value: products.length.toString(),
      change: `+${recentProducts.length}`,
      changeType: "increase",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: `${activeProducts} active, ${bestSellers} best sellers`
    },
    {
      title: "Categories",
      value: categories.length.toString(),
      change: `+${recentCategories.length}`,
      changeType: "increase",
      icon: Tags,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: `${activeCategories} active categories`
    },
    {
      title: "Brands",
      value: brands.length.toString(),
      change: `+${recentBrands.length}`,
      changeType: "increase",
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: `${activeBrands} active brands`
    },
    {
      title: "Contact Messages",
      value: messages.length.toString(),
      change: `+${recentMessages.length}`,
      changeType: "increase",
      icon: MessageSquare,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: `${newMessages} new messages`
    },
  ];

  const quickActions = [
    {
      title: "Add Product",
      description: "Create a new product",
      icon: Package,
      href: "/products",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Add Category",
      description: "Create a new category",
      icon: Tags,
      href: "/categories",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Add Brand",
      description: "Add a new brand",
      icon: Briefcase,
      href: "/brands",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "View Messages",
      description: "Check contact messages",
      icon: MessageSquare,
      href: "/messages",
      color: "bg-red-600 hover:bg-red-700"
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your food service business.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <Activity className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          {newMessages > 0 && (
            <Badge className="bg-red-500 text-white">
              <Mail className="h-3 w-3 mr-1" />
              {newMessages} New Messages
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{stat.change} this week</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Quickly add new content to your system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-4 hover:border-primary"
                >
                  <div className={`h-8 w-8 rounded ${action.color} text-white flex items-center justify-center mr-3`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>
              Latest customer contact messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{message.name}</p>
                        <Badge 
                          className={`text-xs ${
                            message.status === 'new' ? 'bg-red-500' : 
                            message.status === 'read' ? 'bg-blue-500' : 'bg-green-500'
                          } text-white`}
                        >
                          {message.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/messages">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Messages
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contact messages yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Products
            </CardTitle>
            <CardDescription>
              Latest products added this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProducts.length > 0 ? (
              <div className="space-y-3">
                {recentProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-3">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(product.createdAt).toLocaleDateString()}
                        {product.isBestSeller && (
                          <Star className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/products">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Products
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No new products this week
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Overview
          </CardTitle>
          <CardDescription>
            Complete overview of your content management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{brands.length}</div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{banners.length}</div>
              <div className="text-sm text-muted-foreground">Banners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{messages.length}</div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{admins.length}</div>
              <div className="text-sm text-muted-foreground">Administrators</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Stats */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message Statistics
            </CardTitle>
            <CardDescription>
              Breakdown of contact message status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{newMessages}</div>
                <div className="text-sm text-red-600">New Messages</div>
                <div className="text-xs text-muted-foreground">Require attention</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{readMessages}</div>
                <div className="text-sm text-blue-600">Read Messages</div>
                <div className="text-xs text-muted-foreground">Under review</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{repliedMessages}</div>
                <div className="text-sm text-green-600">Replied Messages</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;