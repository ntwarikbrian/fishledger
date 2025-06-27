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
  X
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
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="your-people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your People
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
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
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                              View
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
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Select Contacts
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose who to send your message to</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected: {selectedContacts.length} contact(s)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedContacts(peopleData.map(p => p.id))}
                      >
                        Select All
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {peopleData.map((person) => (
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Customers;
