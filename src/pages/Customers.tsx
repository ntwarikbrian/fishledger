import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  MessageCircle,
  Search,
  Filter,
  Send,
  User,
  Building,
  Truck,
  Store,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Toggle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const Customers = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [chatFilter, setChatFilter] = useState("all"); // New filter state for chat tab
  const [chatSearchQuery, setChatSearchQuery] = useState(""); // Search state for chat tab
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Automatic messaging settings state
  const [autoSettings, setAutoSettings] = useState({
    lowStockEnabled: false,
    criticalStockEnabled: false,
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    lowStockMessage: "Alert: Stock for {product} is running low. Current quantity: {quantity}. Please consider restocking soon.",
    criticalStockMessage: "URGENT: Critical stock alert for {product}. Only {quantity} units remaining. Immediate restocking required!",
    selectedRecipients: [] as number[]
  });
  const [newContact, setNewContact] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    type: "customer"
  });

  // Mock data for different types of people
  const peopleData = [
    {
      id: 1,
      name: "Ocean View Restaurant",
      type: "customer",
      contact: "Sarah Johnson",
      email: "sarah@oceanview.com",
      phone: "+1 (555) 123-4567",
      address: "123 Coastal Drive, Seaside City",
      status: "Active"
    },
    {
      id: 2,
      name: "Fresh Fish Suppliers Ltd",
      type: "supplier",
      contact: "Mike Chen",
      email: "mike@freshfish.com",
      phone: "+1 (555) 234-5678",
      address: "456 Harbor Street, Port City",
      status: "Active"
    },
    {
      id: 3,
      name: "Cold Storage Solutions",
      type: "vendor",
      contact: "Emma Rodriguez",
      email: "emma@coldstorage.com",
      phone: "+1 (555) 345-6789",
      address: "789 Industrial Ave, Storage City",
      status: "Active"
    },
    {
      id: 4,
      name: "Seaside Bistro",
      type: "customer",
      contact: "John Smith",
      email: "john@seasidebistro.com",
      phone: "+1 (555) 456-7890",
      address: "321 Beach Road, Coastal Town",
      status: "Active"
    },
    {
      id: 5,
      name: "Atlantic Fish Co",
      type: "supplier",
      contact: "Lisa Wang",
      email: "lisa@atlanticfish.com",
      phone: "+1 (555) 567-8901",
      address: "654 Fisherman's Wharf, Harbor City",
      status: "Active"
    },
    {
      id: 6,
      name: "Packaging Solutions Inc",
      type: "vendor",
      contact: "David Wilson",
      email: "david@packaging.com",
      phone: "+1 (555) 678-9012",
      address: "987 Business Park, Industrial Zone",
      status: "Active"
    }
  ];

  // Mock data for sent automatic messages
  const sentMessages = [
    {
      id: 1,
      type: "low_stock",
      product: "Atlantic Salmon",
      quantity: 8,
      threshold: 10,
      recipients: ["Ocean View Restaurant", "Seaside Bistro"],
      sentAt: "2024-01-15 14:30:00",
      message: "Alert: Stock for Atlantic Salmon is running low. Current quantity: 8. Please consider restocking soon."
    },
    {
      id: 2,
      type: "critical_stock",
      product: "Fresh Tuna",
      quantity: 3,
      threshold: 5,
      recipients: ["Ocean View Restaurant"],
      sentAt: "2024-01-15 16:45:00",
      message: "URGENT: Critical stock alert for Fresh Tuna. Only 3 units remaining. Immediate restocking required!"
    },
    {
      id: 3,
      type: "low_stock",
      product: "Sea Bass",
      quantity: 7,
      threshold: 10,
      recipients: ["Seaside Bistro", "Ocean View Restaurant"],
      sentAt: "2024-01-14 09:15:00",
      message: "Alert: Stock for Sea Bass is running low. Current quantity: 7. Please consider restocking soon."
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "customer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "supplier":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "vendor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "customer":
        return <Store className="h-4 w-4" />;
      case "supplier":
        return <Building className="h-4 w-4" />;
      case "vendor":
        return <Truck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredPeople = peopleData.filter(person => {
    // Filter by type
    let matchesFilter = true;
    if (selectedFilter !== "all") {
      const filterMap: { [key: string]: string } = {
        "customers": "customer",
        "suppliers": "supplier",
        "vendors": "vendor"
      };
      matchesFilter = person.type === filterMap[selectedFilter];
    }

    // Filter by search query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch =
        person.name.toLowerCase().includes(query) ||
        person.contact.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query) ||
        person.type.toLowerCase().includes(query);
    }

    return matchesFilter && matchesSearch;
  });

  // Filtered people for chat tab
  const filteredChatPeople = peopleData.filter(person => {
    // Filter by type
    let matchesFilter = true;
    if (chatFilter !== "all") {
      const filterMap: { [key: string]: string } = {
        "customers": "customer",
        "suppliers": "supplier",
        "vendors": "vendor"
      };
      matchesFilter = person.type === filterMap[chatFilter];
    }

    // Filter by search query
    let matchesSearch = true;
    if (chatSearchQuery.trim()) {
      const query = chatSearchQuery.toLowerCase();
      matchesSearch =
        person.name.toLowerCase().includes(query) ||
        person.contact.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query) ||
        person.type.toLowerCase().includes(query);
    }

    return matchesFilter && matchesSearch;
  });

  const toggleContactSelection = (id: number) => {
    setSelectedContacts(prev =>
      prev.includes(id)
        ? prev.filter(contactId => contactId !== id)
        : [...prev, id]
    );
  };

  const handleSendMessage = () => {
    if (selectedContacts.length === 0 || !message.trim()) return;

    // Here you would implement the actual message sending logic
    alert(`Message sent to ${selectedContacts.length} contact(s)!`);
    setMessage("");
    setSelectedContacts([]);
  };

  const handleAddContact = () => {
    // Here you would implement the actual contact creation logic
    console.log("Adding new contact:", newContact);
    alert(`Contact "${newContact.name}" added successfully!`);

    // Reset form and close dialog
    setNewContact({
      name: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
      type: "customer"
    });
    setIsAddContactOpen(false);
  };

  // Handle chat filter change and clear selections that are no longer visible
  const handleChatFilterChange = (value: string) => {
    setChatFilter(value);
    setChatSearchQuery(""); // Clear search when filter changes
    // Clear selected contacts that are not in the new filtered list
    const newFilteredIds = peopleData.filter(person => {
      if (value !== "all") {
        const filterMap: { [key: string]: string } = {
          "customers": "customer",
          "suppliers": "supplier",
          "vendors": "vendor"
        };
        return person.type === filterMap[value];
      }
      return true;
    }).map(p => p.id);

    setSelectedContacts(prev => prev.filter(id => newFilteredIds.includes(id)));
  };

  const handleInputChange = (field: string, value: string) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your people and communications</p>
          </div>
          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Add New Contact
                </DialogTitle>
                <DialogDescription>
                  Create a new contact for your business network
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Company/Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter company or person name"
                      value={newContact.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-medium">
                      Contact Person
                    </Label>
                    <Input
                      id="contact"
                      placeholder="Contact person name"
                      value={newContact.contact}
                      onChange={(e) => handleInputChange("contact", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={newContact.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={newContact.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Contact Type *
                  </Label>
                  <Select value={newContact.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select contact type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Customer
                        </div>
                      </SelectItem>
                      <SelectItem value="supplier">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Supplier
                        </div>
                      </SelectItem>
                      <SelectItem value="vendor">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Vendor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter full address"
                    value={newContact.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddContactOpen(false)}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddContact}
                  disabled={!newContact.name || !newContact.email || !newContact.phone}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contact Management Tabs */}
        <Tabs defaultValue="your-people" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="your-people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your People
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="automatic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Automatic
            </TabsTrigger>
          </TabsList>

          {/* Your People Tab */}
          <TabsContent value="your-people" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Your People Directory
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage all your contacts in one place</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All People</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="suppliers">Suppliers</SelectItem>
                        <SelectItem value="vendors">Vendors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filteredPeople.map((person) => (
                    <Card key={person.id} className="hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-2 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                              {getTypeIcon(person.type)}
                            </div>
                            <div>
                              <CardTitle className="text-sm">{person.name}</CardTitle>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{person.contact}</p>
                            </div>
                          </div>
                          <Badge className={getTypeColor(person.type)} variant="outline">
                            {person.type.charAt(0).toUpperCase() + person.type.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-4 space-y-2">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">{person.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{person.phone}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                            <span className="text-gray-600 dark:text-gray-400 text-xs">{person.address}</span>
                          </div>
                        </div>
                        <div className="flex justify-end items-center pt-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
                              onClick={() => {
                                // Handle edit functionality
                                console.log("Edit contact:", person.id);
                                // You can implement edit modal or navigation here
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950 text-red-600 hover:text-red-700"
                              onClick={() => {
                                // Handle delete functionality
                                if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
                                  console.log("Delete contact:", person.id);
                                  // You can implement delete functionality here
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredPeople.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No people found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery.trim()
                        ? `No contacts match "${searchQuery}" in the selected category.`
                        : "No contacts match your current filter selection."
                      }
                    </p>
                    {(searchQuery.trim() || selectedFilter !== "all") && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Selection Section */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Select Contacts
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Choose who to send your message to</p>
                    </div>
                    {/* Filter Button for Chat */}
                    <Select value={chatFilter} onValueChange={handleChatFilterChange}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter contacts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All People</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="suppliers">Suppliers</SelectItem>
                        <SelectItem value="vendors">Vendors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Search Bar for Chat */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts to message..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected: {selectedContacts.length} of {filteredChatPeople.length} contact(s)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Check if all filtered contacts are selected
                          const allFilteredSelected = filteredChatPeople.every(person =>
                            selectedContacts.includes(person.id)
                          );

                          if (allFilteredSelected) {
                            // Deselect all filtered contacts
                            const filteredIds = filteredChatPeople.map(p => p.id);
                            setSelectedContacts(prev => prev.filter(id => !filteredIds.includes(id)));
                          } else {
                            // Select all filtered contacts (merge with existing selections)
                            const filteredIds = filteredChatPeople.map(p => p.id);
                            setSelectedContacts(prev => {
                              const newSelections = [...prev];
                              filteredIds.forEach(id => {
                                if (!newSelections.includes(id)) {
                                  newSelections.push(id);
                                }
                              });
                              return newSelections;
                            });
                          }
                        }}
                      >
                        {filteredChatPeople.every(person => selectedContacts.includes(person.id)) && filteredChatPeople.length > 0
                          ? "Deselect All"
                          : "Select All"
                        }
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredChatPeople.map((person) => (
                        <div
                          key={person.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedContacts.includes(person.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => toggleContactSelection(person.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                {getTypeIcon(person.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{person.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{person.contact}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTypeColor(person.type)} variant="outline">
                                {person.type}
                              </Badge>
                              {selectedContacts.includes(person.id) && (
                                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message Composition Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Compose Message
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Write your message to send to selected contacts</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message Subject
                    </label>
                    <Input
                      placeholder="Enter message subject..."
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message Content
                    </label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Recipients:</strong> {selectedContacts.length} contact(s) selected
                    </p>
                    {selectedContacts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedContacts.slice(0, 3).map(id => {
                          const person = peopleData.find(p => p.id === id);
                          return person ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {person.name}
                            </Badge>
                          ) : null;
                        })}
                        {selectedContacts.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{selectedContacts.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMessage("");
                        setSelectedContacts([]);
                      }}
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={selectedContacts.length === 0 || !message.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automatic Tab */}
          <TabsContent value="automatic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Automatic Messaging Settings
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Configure automatic notifications for stock levels</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Low Stock Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Low Stock Alerts</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Send alerts when stock is running low</p>
                        </div>
                      </div>
                      <Button
                        variant={autoSettings.lowStockEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoSettings(prev => ({ ...prev, lowStockEnabled: !prev.lowStockEnabled }))}
                        className={autoSettings.lowStockEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {autoSettings.lowStockEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    {autoSettings.lowStockEnabled && (
                      <div className="ml-12 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <Label htmlFor="lowStockThreshold" className="text-sm font-medium">Threshold (units)</Label>
                          <Input
                            id="lowStockThreshold"
                            type="number"
                            value={autoSettings.lowStockThreshold}
                            onChange={(e) => setAutoSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lowStockMessage" className="text-sm font-medium">Message Template</Label>
                          <textarea
                            id="lowStockMessage"
                            value={autoSettings.lowStockMessage}
                            onChange={(e) => setAutoSettings(prev => ({ ...prev, lowStockMessage: e.target.value }))}
                            className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            rows={3}
                            placeholder="Use {product} and {quantity} as placeholders"
                          />
                          <p className="text-xs text-gray-500 mt-1">Use {"{product}"} and {"{quantity}"} as placeholders</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Critical Stock Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Critical Stock Alerts</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Send urgent alerts for critically low stock</p>
                        </div>
                      </div>
                      <Button
                        variant={autoSettings.criticalStockEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoSettings(prev => ({ ...prev, criticalStockEnabled: !prev.criticalStockEnabled }))}
                        className={autoSettings.criticalStockEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {autoSettings.criticalStockEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    {autoSettings.criticalStockEnabled && (
                      <div className="ml-12 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <Label htmlFor="criticalStockThreshold" className="text-sm font-medium">Threshold (units)</Label>
                          <Input
                            id="criticalStockThreshold"
                            type="number"
                            value={autoSettings.criticalStockThreshold}
                            onChange={(e) => setAutoSettings(prev => ({ ...prev, criticalStockThreshold: parseInt(e.target.value) || 0 }))}
                            className="mt-1"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="criticalStockMessage" className="text-sm font-medium">Message Template</Label>
                          <textarea
                            id="criticalStockMessage"
                            value={autoSettings.criticalStockMessage}
                            onChange={(e) => setAutoSettings(prev => ({ ...prev, criticalStockMessage: e.target.value }))}
                            className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            rows={3}
                            placeholder="Use {product} and {quantity} as placeholders"
                          />
                          <p className="text-xs text-gray-500 mt-1">Use {"{product}"} and {"{quantity}"} as placeholders</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recipients Selection */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Default Recipients</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select who should receive automatic stock alerts</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {peopleData.map((person) => (
                        <div
                          key={person.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                            autoSettings.selectedRecipients.includes(person.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => {
                            setAutoSettings(prev => ({
                              ...prev,
                              selectedRecipients: prev.selectedRecipients.includes(person.id)
                                ? prev.selectedRecipients.filter(id => id !== person.id)
                                : [...prev.selectedRecipients, person.id]
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                                {getTypeIcon(person.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{person.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{person.contact}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTypeColor(person.type)} variant="outline">
                                {person.type}
                              </Badge>
                              {autoSettings.selectedRecipients.includes(person.id) && (
                                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Settings Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        // Handle save settings
                        console.log("Saving automatic messaging settings:", autoSettings);
                        alert("Settings saved successfully!");
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Message History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Sent Message History
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View automatically sent stock alerts</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sentMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No messages sent yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Automatic messages will appear here when stock alerts are triggered.
                        </p>
                      </div>
                    ) : (
                      sentMessages.map((msg) => (
                        <div key={msg.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                msg.type === 'critical_stock'
                                  ? 'bg-red-100 dark:bg-red-900'
                                  : 'bg-yellow-100 dark:bg-yellow-900'
                              }`}>
                                <AlertTriangle className={`h-4 w-4 ${
                                  msg.type === 'critical_stock'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {msg.type === 'critical_stock' ? 'Critical Stock Alert' : 'Low Stock Alert'}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {msg.product} • {msg.quantity} units remaining
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={msg.type === 'critical_stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {msg.type === 'critical_stock' ? 'Critical' : 'Low Stock'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">{new Date(msg.sentAt).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Sent to:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.recipients.map((recipient, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {recipient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Customers;
