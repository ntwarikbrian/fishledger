import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { messagingService, type DeliveryMethod } from "@/lib/api/services/messaging";
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
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
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
import { useState, useEffect } from "react";
import { contactsApi, Contact, CreateContactInput } from "@/lib/api";
import { toast } from "sonner";

const Customers = () => {
  const { t } = useTranslation();
  usePageTitle('navigation.customers', 'Customers');

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [chatFilter, setChatFilter] = useState("all"); // New filter state for chat tab
  const [chatSearchQuery, setChatSearchQuery] = useState(""); // Search state for chat tab
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [availableDeliveryMethods, setAvailableDeliveryMethods] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    requiresSubject: boolean;
    disabledReason?: string;
  }>>([
    { id: 'email', name: 'Email', icon: '📧', enabled: true, requiresSubject: true },
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', enabled: true, requiresSubject: false },
    { id: 'sms', name: 'SMS', icon: '💬', enabled: true, requiresSubject: false },
  ]);
  const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(true);

  // Real data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Automatic messaging settings state
  const [autoSettings, setAutoSettings] = useState({
    lowStockEnabled: false,
    criticalStockEnabled: false,
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    lowStockMessage: "Alert: Stock for {product} is running low. Current quantity: {quantity}. Please consider restocking soon.",
    criticalStockMessage: "URGENT: Critical stock alert for {product}. Only {quantity} units remaining. Immediate restocking required!",
    selectedRecipients: [] as string[]
  });
  const [newContact, setNewContact] = useState<CreateContactInput>({
    company_name: "",
    contact_name: "",
    email: "",
    phone_number: "",
    address: "",
    contact_type: "customer"
  });

  const [editContact, setEditContact] = useState<CreateContactInput>({
    company_name: "",
    contact_name: "",
    email: "",
    phone_number: "",
    address: "",
    contact_type: "customer"
  });

  // Fetch contacts and delivery methods on component mount
  useEffect(() => {
    fetchContacts();
    fetchDeliveryMethods();
  }, []);
  
  // Fetch available delivery methods
  const fetchDeliveryMethods = async () => {
    try {
      setLoadingDeliveryMethods(true);
      const response = await messagingService.getDeliveryMethods();
      
      if (response.success && response.data) {
        setAvailableDeliveryMethods(response.data);
        
        // Set default delivery method to the first enabled method
        const enabledMethod = response.data.find(method => method.enabled);
        if (enabledMethod) {
          setDeliveryMethod(enabledMethod.id as DeliveryMethod);
        }
      } else {
        console.error('Failed to fetch delivery methods:', response.message);
      }
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
    } finally {
      setLoadingDeliveryMethods(false);
    }
  };

  const fetchContacts = async (showToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactsApi.getAll();

      // Handle the API response structure: { data: Contact[], pagination: {...} }
      if (response && response.data && Array.isArray(response.data)) {
        setContacts(response.data);
        console.log(`✅ Successfully loaded ${response.data.length} contacts`);
      } else {
        setContacts([]);
        console.warn('⚠️ No contacts data received from API');
      }
    } catch (err: any) {
      console.error('Error fetching contacts:', err);

      let errorMessage = 'Failed to load contacts';

      if (err?.response?.status === 401) {
        errorMessage = 'You are not authorized to view contacts. Please log in again.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to view contacts.';
      } else if (err?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert Contact to the format expected by the UI
  const convertContactToUIFormat = (contact: Contact) => ({
    id: contact.contact_id,
    name: contact.company_name || contact.contact_name,
    type: contact.contact_type,
    contact: contact.contact_name,
    email: contact.email || '',
    phone: contact.phone_number || '',
    address: contact.address || '',
    status: 'Active'
  });

  // Use only real data from the database
  const peopleData = contacts.map(convertContactToUIFormat);

  // Sent messages history - will be populated when real messages are sent
  const sentMessages: any[] = [];

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

  const toggleContactSelection = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id)
        ? prev.filter(contactId => contactId !== id)
        : [...prev, id]
    );
  };

  const handleSendMessage = async () => {
    // Check if the selected delivery method requires a subject
    const requiresSubject = !availableDeliveryMethods.length || 
      availableDeliveryMethods.find(m => m.id === deliveryMethod)?.requiresSubject;
    
    // Validate form based on delivery method requirements
    if (selectedContacts.length === 0 || !message.trim()) {
      toast.error("Please select contacts and write a message");
      return;
    }
    
    if (requiresSubject && !messageSubject.trim()) {
      toast.error(`Please enter a subject for your ${deliveryMethod} message`);
      return;
    }

    setIsSendingMessage(true);

    try {
      console.log(`📨 Sending ${deliveryMethod} message to contacts:`, selectedContacts);

      const result = await messagingService.sendMessageToContacts(
        selectedContacts,
        messageSubject, // This will be empty for WhatsApp but that's handled by the backend
        message,
        deliveryMethod
      );

      if (result.success && result.data) {
        const { successfulSends, failedSends, totalRecipients } = result.data;

        if (successfulSends === totalRecipients) {
          toast.success(`Message sent successfully to all ${totalRecipients} contact(s)!`);
        } else if (successfulSends > 0) {
          toast.warning(`Message sent to ${successfulSends} out of ${totalRecipients} contacts. ${failedSends} failed.`);
        } else {
          toast.error(`Failed to send message to any contacts. Please check your email configuration.`);
        }

        // Clear form on success
        if (successfulSends > 0) {
          setMessage("");
          setMessageSubject("");
          setSelectedContacts([]);
        }
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);

      let errorMessage = 'Failed to send message. Please try again.';

      if (error?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to send messages.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * Validate contact form data with comprehensive checks
   * @param contactData - The contact data to validate
   * @returns Array of validation error messages
   */
  const validateContactForm = (contactData: CreateContactInput = newContact) => {
    const errors: string[] = [];

    // Required field validation
    if (!contactData.contact_name.trim()) {
      errors.push('Contact name is required');
    } else if (contactData.contact_name.trim().length < 2) {
      errors.push('Contact name must be at least 2 characters long');
    } else if (contactData.contact_name.trim().length > 200) {
      errors.push('Contact name must be less than 200 characters');
    }

    // Company name validation (if provided)
    if (contactData.company_name && contactData.company_name.trim().length > 200) {
      errors.push('Company name must be less than 200 characters');
    }

    // Email validation (if provided)
    if (contactData.email && contactData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email.trim())) {
        errors.push('Please enter a valid email address');
      } else if (contactData.email.trim().length > 255) {
        errors.push('Email address must be less than 255 characters');
      }
    }

    // Phone validation (if provided)
    if (contactData.phone_number && contactData.phone_number.trim()) {
      const cleanPhone = contactData.phone_number.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Please enter a valid phone number (e.g., +1-555-123-4567)');
      } else if (contactData.phone_number.trim().length > 20) {
        errors.push('Phone number must be less than 20 characters');
      }
    }

    // Address validation (if provided)
    if (contactData.address && contactData.address.trim().length > 500) {
      errors.push('Address must be less than 500 characters');
    }

    // Contact name length validation
    if (newContact.contact_name.trim().length > 200) {
      errors.push('Contact name must be less than 200 characters');
    }

    // Company name length validation
    if (newContact.company_name && newContact.company_name.length > 200) {
      errors.push('Company name must be less than 200 characters');
    }

    // Email length validation
    if (newContact.email && newContact.email.length > 255) {
      errors.push('Email must be less than 255 characters');
    }

    // Phone length validation
    if (newContact.phone_number && newContact.phone_number.length > 20) {
      errors.push('Phone number must be less than 20 characters');
    }

    return errors;
  };

  /**
   * Handle adding a new contact with comprehensive validation and error handling
   */
  const handleAddContact = async () => {
    try {
      console.log("📞 Adding new contact:", newContact);

      // Validate form
      const validationErrors = validateContactForm();
      if (validationErrors.length > 0) {
        // Show first error as toast, log all errors
        toast.error(validationErrors[0]);
        console.warn('❌ Validation errors:', validationErrors);
        return;
      }

      // Show loading state
      const loadingToast = toast.loading('Creating contact...');

      // Clean up the data before sending
      const cleanedContact: CreateContactInput = {
        contact_name: newContact.contact_name.trim(),
        contact_type: newContact.contact_type,
        company_name: newContact.company_name?.trim() || undefined,
        email: newContact.email?.trim() || undefined,
        phone_number: newContact.phone_number?.trim() || undefined,
        address: newContact.address?.trim() || undefined,
      };

      const response = await contactsApi.create(cleanedContact);

      if (response.data) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Contact "${cleanedContact.contact_name}" added successfully!`);

        // Refresh the contacts list
        await fetchContacts();

        // Reset form and close dialog
        setNewContact({
          company_name: "",
          contact_name: "",
          email: "",
          phone_number: "",
          address: "",
          contact_type: "customer"
        });
        setIsAddContactOpen(false);
      }
    } catch (err: any) {
      console.error('❌ Error adding contact:', err);

      // Handle specific error messages from the API
      let errorMessage = 'Failed to add contact. Please try again.';

      if (err?.response?.status === 409) {
        errorMessage = 'A contact with this email already exists.';
      } else if (err?.response?.status === 400) {
        errorMessage = err?.response?.data?.message || 'Invalid contact data provided.';
      } else if (err?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to add contacts.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    }
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

  const handleInputChange = (field: keyof CreateContactInput, value: string) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    try {
      if (window.confirm(`Are you sure you want to delete "${contactName}"?\n\nThis action cannot be undone.`)) {
        await contactsApi.delete(contactId);
        toast.success(`Contact "${contactName}" deleted successfully!`);

        // Refresh the contacts list
        await fetchContacts();

        // Remove from selected contacts if it was selected
        setSelectedContacts(prev => prev.filter(id => id !== contactId));

        // Remove from auto settings recipients if selected
        setAutoSettings(prev => ({
          ...prev,
          selectedRecipients: prev.selectedRecipients.filter(id => id !== contactId)
        }));
      }
    } catch (err: any) {
      console.error('Error deleting contact:', err);

      // Handle specific error messages from the API
      if (err?.response?.status === 404) {
        toast.error('Contact not found. It may have already been deleted.');
        // Refresh the list to sync with server state
        await fetchContacts();
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error('Failed to delete contact. Please try again.');
      }
    }
  };

  /**
   * Handle editing a contact - opens edit dialog with contact data
   */
  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.contact_id === contactId);
    if (contact) {
      setEditingContact(contact);
      setEditContact({
        company_name: contact.company_name || "",
        contact_name: contact.contact_name,
        email: contact.email || "",
        phone_number: contact.phone_number || "",
        address: contact.address || "",
        contact_type: contact.contact_type
      });
      setIsEditContactOpen(true);
    } else {
      toast.error('Contact not found');
    }
  };

  /**
   * Handle updating a contact with comprehensive validation and error handling
   */
  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      console.log("📞 Updating contact:", editingContact.contact_id);

      // Validate form using the same validation function
      const validationErrors = validateContactForm(editContact);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        console.warn('❌ Validation errors:', validationErrors);
        return;
      }

      // Show loading state
      const loadingToast = toast.loading('Updating contact...');

      // Clean up the data before sending
      const cleanedContact = {
        contact_name: editContact.contact_name.trim(),
        contact_type: editContact.contact_type,
        company_name: editContact.company_name?.trim() || undefined,
        email: editContact.email?.trim() || undefined,
        phone_number: editContact.phone_number?.trim() || undefined,
        address: editContact.address?.trim() || undefined,
      };

      const response = await contactsApi.update(editingContact.contact_id, cleanedContact);

      if (response.data) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Contact "${cleanedContact.contact_name}" updated successfully!`);

        // Refresh the contacts list
        await fetchContacts();

        // Close dialog and reset state
        setIsEditContactOpen(false);
        setEditingContact(null);
        setEditContact({
          company_name: "",
          contact_name: "",
          email: "",
          phone_number: "",
          address: "",
          contact_type: "customer"
        });
      }
    } catch (err: any) {
      console.error('❌ Error updating contact:', err);

      // Handle specific error messages from the API
      let errorMessage = 'Failed to update contact. Please try again.';

      if (err?.response?.status === 409) {
        errorMessage = 'A contact with this email already exists.';
      } else if (err?.response?.status === 400) {
        errorMessage = err?.response?.data?.message || 'Invalid contact data provided.';
      } else if (err?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to update contacts.';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Contact not found. It may have been deleted.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    }
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
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Add New Contact
                </DialogTitle>
                <DialogDescription>
                  Create a new contact for your business network
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Company/Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter company or person name"
                      value={newContact.company_name || ""}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-medium">
                      Contact Person *
                    </Label>
                    <Input
                      id="contact"
                      placeholder="Contact person name"
                      value={newContact.contact_name}
                      onChange={(e) => handleInputChange("contact_name", e.target.value)}
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
                      value={newContact.phone_number || ""}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Contact Type *
                  </Label>
                  <Select value={newContact.contact_type} onValueChange={(value: 'supplier' | 'customer') => handleInputChange("contact_type", value)}>
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
                    value={newContact.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="text-sm min-h-[50px] resize-none"
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
                  disabled={!newContact.contact_name.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Contact Dialog */}
          <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-green-600" />
                  Edit Contact
                </DialogTitle>
                <DialogDescription>
                  Update the contact information below.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-contact-name" className="text-sm font-medium">
                    Contact Name *
                  </Label>
                  <Input
                    id="edit-contact-name"
                    placeholder="Enter contact name"
                    value={editContact.contact_name}
                    onChange={(e) => setEditContact(prev => ({ ...prev, contact_name: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company-name" className="text-sm font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="edit-company-name"
                    placeholder="Enter company name"
                    value={editContact.company_name || ""}
                    onChange={(e) => setEditContact(prev => ({ ...prev, company_name: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Enter email"
                      value={editContact.email || ""}
                      onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="edit-phone"
                      placeholder="Enter phone"
                      value={editContact.phone_number || ""}
                      onChange={(e) => setEditContact(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contact-type" className="text-sm font-medium">
                    Contact Type *
                  </Label>
                  <Select
                    value={editContact.contact_type}
                    onValueChange={(value: 'supplier' | 'customer') =>
                      setEditContact(prev => ({ ...prev, contact_type: value }))
                    }
                  >
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address" className="text-sm font-medium">
                    Address
                  </Label>
                  <Textarea
                    id="edit-address"
                    placeholder="Enter full address"
                    value={editContact.address || ""}
                    onChange={(e) => setEditContact(prev => ({ ...prev, address: e.target.value }))}
                    className="text-sm min-h-[50px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditContactOpen(false);
                    setEditingContact(null);
                  }}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateContact}
                  disabled={!editContact.contact_name.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Update Contact
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
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Loading contacts...</div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col justify-center items-center py-8">
                    <div className="text-red-500 mb-4 text-center">{error}</div>
                    <Button
                      variant="outline"
                      onClick={() => fetchContacts()}
                      className="text-sm"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
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
                              onClick={() => handleEditContact(person.id)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteContact(person.id, person.name)}
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
                )}

                {!loading && !error && filteredPeople.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {contacts.length === 0 ? "No contacts yet" : "No people found"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contacts.length === 0
                        ? "Start building your contact list by adding your first contact."
                        : searchQuery.trim()
                        ? `No contacts match "${searchQuery}" in the selected category.`
                        : "No contacts match your current filter selection."
                      }
                    </p>
                    {contacts.length === 0 ? (
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setIsAddContactOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Contact
                      </Button>
                    ) : (searchQuery.trim() || selectedFilter !== "all") && (
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
                      {filteredChatPeople.length > 0 ? (
                        filteredChatPeople.map((person) => (
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
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {contacts.length === 0
                              ? "No contacts available to message. Add some contacts first."
                              : "No contacts match your search criteria."
                            }
                          </p>
                          {contacts.length === 0 && (
                            <Button
                              variant="outline"
                              className="mt-3"
                              onClick={() => setIsAddContactOpen(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Contact
                            </Button>
                          )}
                        </div>
                      )}
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
                      Delivery Method
                    </label>
                    {loadingDeliveryMethods ? (
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="text-gray-500">Loading delivery methods...</span>
                      </div>
                    ) : (
                      <Select value={deliveryMethod} onValueChange={(value: DeliveryMethod) => setDeliveryMethod(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDeliveryMethods.map((method) => (
                            <SelectItem 
                              key={method.id} 
                              value={method.id as DeliveryMethod}
                              disabled={!method.enabled}
                            >
                              <div className="flex items-center gap-2">
                                <span>{method.icon}</span>
                                <span>{method.name}</span>
                                {!method.enabled && (
                                  <span className="text-xs text-gray-400 ml-1">({method.disabledReason})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Only show subject field if the selected delivery method requires it */}
                  {(!availableDeliveryMethods.length || 
                    availableDeliveryMethods.find(m => m.id === deliveryMethod)?.requiresSubject) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Message Subject
                      </label>
                      <Input
                        placeholder="Enter message subject..."
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

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
                        setMessageSubject("");
                        setSelectedContacts([]);
                      }}
                      disabled={isSendingMessage}
                      className="flex-1"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        selectedContacts.length === 0 || 
                        !message.trim() || 
                        ((!availableDeliveryMethods.length || availableDeliveryMethods.find(m => m.id === deliveryMethod)?.requiresSubject) && !messageSubject.trim()) || 
                        isSendingMessage
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {isSendingMessage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send {deliveryMethod === 'email' ? 'Email' : 
                               deliveryMethod === 'whatsapp' ? 'WhatsApp' :
                               deliveryMethod === 'sms' ? 'SMS' :
                               deliveryMethod}
                        </>
                      )}
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
