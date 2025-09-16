import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Mail, 
  Eye, 
  Trash2, 
  Search, 
  Filter,
  MessageSquare,
  Calendar,
  User,
  Clock
} from "lucide-react";
import { useContactMessages, useUpdateContactMessage, useDeleteContactMessage } from "@/hooks/useFirebase";
import { ContactMessage } from "@/types";

const ContactMessages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: messages = [], isLoading } = useContactMessages();
  const updateMessage = useUpdateContactMessage();
  const deleteMessage = useDeleteContactMessage();

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status stats
  const statusStats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    // Mark as read if it's new
    if (message.status === 'new') {
      updateMessage.mutate({
        id: message.id,
        data: { status: 'read' }
      });
    }
  };

  const handleStatusChange = (message: ContactMessage, status: ContactMessage['status']) => {
    updateMessage.mutate({
      id: message.id,
      data: { status }
    });
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessage.mutate(id);
  };

  const getStatusColor = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return 'bg-red-500 text-white';
      case 'read':
        return 'bg-blue-500 text-white';
      case 'replied':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Messages Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Messages</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer inquiries and messages
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          {filteredMessages.length} Messages
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold text-foreground">{statusStats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Messages</p>
                <p className="text-2xl font-bold text-red-600">{statusStats.new}</p>
              </div>
              <Mail className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Read Messages</p>
                <p className="text-2xl font-bold text-blue-600">{statusStats.read}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold text-green-600">{statusStats.replied}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{message.name}</h3>
                      <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                        {message.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {message.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Message from {selectedMessage?.name}
                          </DialogTitle>
                          <DialogDescription>
                            Received on {selectedMessage && formatDate(selectedMessage.createdAt)}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedMessage && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="font-medium">{selectedMessage.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="font-medium">{selectedMessage.email}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Message</label>
                              <div className="mt-2 p-4 bg-muted rounded-lg">
                                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-muted-foreground">Status:</label>
                              <Select 
                                value={selectedMessage.status} 
                                onValueChange={(status) => handleStatusChange(selectedMessage, status as ContactMessage['status'])}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="read">Read</SelectItem>
                                  <SelectItem value="replied">Replied</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Select 
                      value={message.status} 
                      onValueChange={(status) => handleStatusChange(message, status as ContactMessage['status'])}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this message from {message.name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteMessage(message.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No messages found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? `No messages match "${searchTerm}" with the selected status.`
                : "No contact messages have been received yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages;
