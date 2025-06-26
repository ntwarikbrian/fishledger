import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  DollarSign,
  Clock,
  UserCheck,
  UserX
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
import { DocumentAttachmentCompact } from "@/components/ui/document-attachment";

const Staff = () => {
  // Mock data for staff members
  const staffData = [
    {
      id: 1,
      name: "John Smith",
      position: "Sales Manager",
      department: "Sales",
      email: "john.smith@fishsales.com",
      phone: "+1 (555) 123-4567",
      hireDate: "2023-01-15",
      salary: 55000,
      status: "Active",
      workSchedule: "Full-time",
      address: "123 Harbor St, Coastal City",
      emergencyContact: "Jane Smith - +1 (555) 987-6543"
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      position: "Fish Handler",
      department: "Operations",
      email: "maria.rodriguez@fishsales.com",
      phone: "+1 (555) 234-5678",
      hireDate: "2023-03-20",
      salary: 42000,
      status: "Active",
      workSchedule: "Full-time",
      address: "456 Ocean Ave, Coastal City",
      emergencyContact: "Carlos Rodriguez - +1 (555) 876-5432"
    },
    {
      id: 3,
      name: "David Chen",
      position: "Delivery Driver",
      department: "Logistics",
      email: "david.chen@fishsales.com",
      phone: "+1 (555) 345-6789",
      hireDate: "2023-06-10",
      salary: 38000,
      status: "Active",
      workSchedule: "Full-time",
      address: "789 Marina Blvd, Coastal City",
      emergencyContact: "Lisa Chen - +1 (555) 765-4321"
    },
    {
      id: 4,
      name: "Sarah Johnson",
      position: "Quality Inspector",
      department: "Quality Control",
      email: "sarah.johnson@fishsales.com",
      phone: "+1 (555) 456-7890",
      hireDate: "2023-02-28",
      salary: 48000,
      status: "On Leave",
      workSchedule: "Full-time",
      address: "321 Pier Way, Coastal City",
      emergencyContact: "Mike Johnson - +1 (555) 654-3210"
    }
  ];

  // Calculate staff statistics
  const staffStats = {
    totalStaff: staffData.length,
    activeStaff: staffData.filter(staff => staff.status === "Active").length,
    onLeave: staffData.filter(staff => staff.status === "On Leave").length,
    totalPayroll: staffData.reduce((sum, staff) => sum + staff.salary, 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "On Leave":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">On Leave</Badge>;
      case "Inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage employees and workforce operations</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
          </Button>
        </div>

        {/* Staff Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">All employees</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.activeStaff}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>
          
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <UserX className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.onLeave}</div>
              <p className="text-xs text-muted-foreground">Temporarily away</p>
            </CardContent>
          </Card>

          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${staffStats.totalPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Annual salaries</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Management Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Staff Directory</TabsTrigger>
            <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
            <TabsTrigger value="payroll">Payroll & Benefits</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Staff Directory</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search staff..." className="pl-8 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="quality">Quality Control</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.map((staff) => (
                    <div key={staff.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{staff.name}</h3>
                              <p className="text-sm text-muted-foreground">{staff.position}</p>
                            </div>
                            {getStatusBadge(staff.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span>{staff.department}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{staff.email}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{staff.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Hired: {staff.hireDate}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>${staff.salary.toLocaleString()}/year</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{staff.workSchedule}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                          <DocumentAttachmentCompact
                            entityType="Staff"
                            entityId={staff.id.toString()}
                            documents={[]}
                            onAttach={(files) => {
                              console.log('Attaching files to staff:', staff.id, files);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Schedule Management</CardTitle>
                <p className="text-sm text-muted-foreground">Manage staff schedules and time tracking</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Schedule Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule management features will be implemented here
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payroll & Benefits</CardTitle>
                <p className="text-sm text-muted-foreground">Manage employee compensation and benefits</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Payroll Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Payroll and benefits management features will be implemented here
                  </p>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Process Payroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Staff;
