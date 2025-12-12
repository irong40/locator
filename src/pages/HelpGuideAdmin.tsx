import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleCapabilitiesCard } from '@/components/help/RoleCapabilitiesCard';
import { 
  MapPin, 
  Building2, 
  User, 
  KeyRound, 
  LogOut, 
  Edit,
  Eye,
  Filter,
  Plus,
  BookOpen,
  Wrench,
  Factory,
  LayoutDashboard,
  Users,
  History,
  CreditCard,
  Package,
  Shield,
  Trash2,
  UserPlus,
  UserCheck,
  UserX,
  AlertTriangle,
  Database,
  Pencil,
  ArrowLeft
} from 'lucide-react';

export default function HelpGuideAdmin() {
  const { isAdmin, isManager, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const roleBadge = isAdmin ? 'Admin' : 'Manager';
  const roleDescription = isAdmin 
    ? "Complete administrative guide including all system management features."
    : "Guide for managing vendors, catalog items, and viewing system data.";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {isAdmin ? 'Admin' : 'Manager'} Help Guide
            </h1>
            <Badge className="bg-primary">{roleBadge}</Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/help/user">
              <ArrowLeft className="mr-2 h-4 w-4" /> User Guide
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">{roleDescription}</p>
      </div>

      {/* Role Capabilities Card */}
      <RoleCapabilitiesCard />

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-foreground">Core Features</h4>
              <ul className="space-y-1">
                <li><a href="#getting-started" className="text-primary hover:underline text-sm">1. Getting Started</a></li>
                <li><a href="#finding-vendors" className="text-primary hover:underline text-sm">2. Finding Vendors</a></li>
                <li><a href="#managing-vendors" className="text-primary hover:underline text-sm">3. Managing Vendors</a></li>
                <li><a href="#profile" className="text-primary hover:underline text-sm">4. Your Profile</a></li>
                <li><a href="#account" className="text-primary hover:underline text-sm">5. Password & Account</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-foreground">{isAdmin ? 'Admin' : 'Manager'} Features</h4>
              <ul className="space-y-1">
                <li><a href="#dashboard" className="text-primary hover:underline text-sm">6. Dashboard</a></li>
                {isAdmin && (
                  <li><a href="#user-management" className="text-primary hover:underline text-sm">7. User Management</a></li>
                )}
                <li><a href="#catalog-management" className="text-primary hover:underline text-sm">{isAdmin ? '8' : '7'}. Catalog Management</a></li>
                {isAdmin && (
                  <>
                    <li><a href="#audit-logs" className="text-primary hover:underline text-sm">9. Audit Logs</a></li>
                    <li><a href="#data-migration" className="text-primary hover:underline text-sm">10. Data Migration</a></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <section id="getting-started" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              1. Getting Started
            </CardTitle>
            <CardDescription>Log in and navigate the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="login">
                <AccordionTrigger>Logging In</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the login page</li>
                    <li>Enter your email address and password</li>
                    <li>Click the "Sign In" button</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="navigation">
                <AccordionTrigger>Navigation Overview</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    Your sidebar includes:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> <strong>Dashboard</strong> - System overview and metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> <strong>Find Vendors</strong> - Geo-search for vendors
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> <strong>Vendors</strong> - Manage all vendors
                    </li>
                    <li className="flex items-center gap-2">
                      <Factory className="h-4 w-4" /> <strong>Catalog</strong> - OEM Brands, Engine Brands, Products, Payment Types
                    </li>
                    {isAdmin && (
                      <>
                        <li className="flex items-center gap-2">
                          <Users className="h-4 w-4" /> <strong>User Management</strong> - Manage users
                        </li>
                        <li className="flex items-center gap-2">
                          <History className="h-4 w-4" /> <strong>Audit Logs</strong> - View system activity
                        </li>
                      </>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Finding Vendors */}
      <section id="finding-vendors" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              2. Finding Vendors
            </CardTitle>
            <CardDescription>Use the geo-search feature to find vendors near a location</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="geo-search">
                <AccordionTrigger>Using the Geo-Search</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to <strong>Find Vendors</strong> from the sidebar</li>
                    <li>Enter a zip code in the search field</li>
                    <li>Select a search radius (25, 50, 100, or 200 miles)</li>
                    <li>Click <strong>Search</strong> to find vendors within that radius</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="search-results">
                <AccordionTrigger>Understanding Search Results</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Distance</strong> - How far the vendor is from the searched location</li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-blue-500">OEM</Badge>
                      <span>Original Equipment Manufacturer certified</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge className="bg-green-500">EPP</Badge>
                      <span>Engine Protection Plan certified</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Managing Vendors */}
      <section id="managing-vendors" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              3. Managing Vendors
            </CardTitle>
            <CardDescription>Full vendor management capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="browse">
                <AccordionTrigger className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Browsing & Filtering
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">Filter vendors by:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Search</strong> - Type to search by vendor name</li>
                    <li><strong>OEM/EPP Status</strong> - Filter by certification</li>
                    <li><strong>Preference</strong> - Filter by preference level</li>
                    <li><strong>Vendor Level</strong> - Filter by service level</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-detail">
                <AccordionTrigger className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Editing Vendors
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">Click a vendor to view and edit:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Contact Information</strong> - Phone, email, fax, point of contact</li>
                    <li><strong>Address</strong> - Full address with coordinates</li>
                    <li><strong>Certifications</strong> - OEM and EPP status</li>
                    <li><strong>Brand Associations</strong> - Link OEM and Engine brands</li>
                    <li><strong>Payment Type</strong> - Set accepted payment method</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="create-vendor">
                <AccordionTrigger className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Creating Vendors
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Click the <strong>+ Add Vendor</strong> button on the Vendors page</li>
                    <li>Fill in vendor information (name is required)</li>
                    <li>Add address details - coordinates are calculated automatically</li>
                    <li>Set OEM/EPP certifications as needed</li>
                    <li>Click <strong>Create Vendor</strong> to save</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="delete-vendor">
                <AccordionTrigger className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Deleting Vendors
                </AccordionTrigger>
                <AccordionContent>
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Deleting a vendor removes all associated data including brand links and products.
                    </AlertDescription>
                  </Alert>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Open the vendor's detail page</li>
                    <li>Click the <strong>Delete</strong> button</li>
                    <li>Confirm deletion in the dialog</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Profile */}
      <section id="profile" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              4. Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click your avatar in the top right → Profile to update your name and phone number.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Account */}
      <section id="account" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              5. Password & Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use "Forgot Password" on the login page to reset your password. Click your avatar → Sign out to log out.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ADMIN/MANAGER SECTIONS HEADER */}
      <div className="mb-4">
        <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {isAdmin ? 'Administrative' : 'Manager'} Features
        </h2>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Full system administration capabilities."
            : "Features for managing vendors and catalog data."}
        </p>
      </div>

      {/* Dashboard */}
      <section id="dashboard" className="mb-8">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              6. Dashboard
            </CardTitle>
            <CardDescription>System metrics and quick insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="metrics">
                <AccordionTrigger>Key Metrics</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Total Vendors</strong> - Number of vendors in the system</li>
                    <li><strong>OEM Vendors</strong> - Vendors with OEM certification</li>
                    <li><strong>EPP Vendors</strong> - Vendors with EPP certification</li>
                    <li><strong>Catalog Items</strong> - Total products, brands, payment types</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="charts">
                <AccordionTrigger>Distribution Charts</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Preference Distribution</strong> - Breakdown of vendor preferences</li>
                    <li><strong>Vendor Level Distribution</strong> - Breakdown of service levels</li>
                    <li><strong>Top States</strong> - States with most vendors</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* User Management - Admin Only */}
      {isAdmin && (
        <section id="user-management" className="mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                7. User Management
              </CardTitle>
              <CardDescription>Manage user accounts and access</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="view-users">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Viewing Users
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">
                      Go to <strong>User Management</strong> to see all users.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Use the search box to find users by name or email</li>
                      <li>Click the eye icon to view full user details</li>
                      <li>See user role, status (active/inactive), and contact info</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="invite-users">
                  <AccordionTrigger className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Inviting New Users
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Click the <strong>+ Invite User</strong> button</li>
                      <li>Enter the user's email address</li>
                      <li>Enter their first and last name</li>
                      <li>Select a role (Viewer, User, Manager, or Admin)</li>
                      <li>Click <strong>Send Invite</strong></li>
                      <li>The user will receive an email with login instructions</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="edit-role">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Editing User Roles
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Find the user in the list</li>
                      <li>Click the <strong>Edit</strong> button</li>
                      <li>Select a new role from the dropdown</li>
                      <li>Click <strong>Update Role</strong> to save</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="activate-deactivate">
                  <AccordionTrigger className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Activating/Deactivating Users
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-destructive" /> 
                        <span><strong>Deactivate</strong> - Prevents the user from logging in (reversible)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" /> 
                        <span><strong>Activate</strong> - Restores access for a deactivated user</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="delete-user">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Permanently Deleting Users
                  </AccordionTrigger>
                  <AccordionContent>
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Permanent deletion cannot be undone. The user's account and all associated data will be removed.
                      </AlertDescription>
                    </Alert>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Find the user in the list</li>
                      <li>Click the <strong>Trash</strong> icon</li>
                      <li>Confirm by clicking <strong>Delete Permanently</strong></li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Catalog Management */}
      <section id="catalog-management" className="mb-8">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {isAdmin ? '8' : '7'}. Catalog Management
            </CardTitle>
            <CardDescription>Manage brands, products, and payment types</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="oem-brands">
                <AccordionTrigger className="flex items-center gap-2">
                  <Factory className="h-4 w-4" /> OEM Brands
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Add</strong> - Click "+ Add OEM Brand" and enter the name</li>
                    <li><strong>Edit</strong> - Click edit icon to rename</li>
                    <li><strong>Delete</strong> - Click delete icon (only if not linked to vendors)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="engine-brands">
                <AccordionTrigger className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> Engine Brands
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Add</strong> - Click "+ Add Engine Brand" and enter the name</li>
                    <li><strong>Edit</strong> - Click edit icon to rename</li>
                    <li><strong>Delete</strong> - Click delete icon (only if not linked to vendors)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="products">
                <AccordionTrigger className="flex items-center gap-2">
                  <Package className="h-4 w-4" /> Products
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Add</strong> - Click "+ Add Product" and enter the name</li>
                    <li><strong>Edit</strong> - Click edit icon to rename</li>
                    <li><strong>Delete</strong> - Click delete icon</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="payment-types">
                <AccordionTrigger className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Types
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Add</strong> - Click "+ Add Payment Type" and enter the name</li>
                    <li><strong>Edit</strong> - Click edit icon to rename</li>
                    <li><strong>Delete</strong> - Click delete icon (only if not in use)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="linking-brands">
                <AccordionTrigger>Linking Brands to Vendors</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Open a vendor's detail page</li>
                    <li>Scroll to the "OEM Brands" or "Engine Brands" section</li>
                    <li>Click <strong>+ Add</strong></li>
                    <li>Select brands from the dropdown</li>
                    <li>For engine brands, optionally check "Certified"</li>
                    <li>Click <strong>Add</strong> to save</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Audit Logs - Admin Only */}
      {isAdmin && (
        <section id="audit-logs" className="mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                9. Audit Logs
              </CardTitle>
              <CardDescription>Track system activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="viewing-logs">
                  <AccordionTrigger>Viewing Audit Logs</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground mb-3">
                      Go to <strong>Audit Logs</strong> to view system activity:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li><strong>Timestamp</strong> - When the action occurred</li>
                      <li><strong>Actor</strong> - Who performed the action</li>
                      <li><strong>Entity</strong> - What was affected (vendor, user, etc.)</li>
                      <li><strong>Action</strong> - What happened (create, update, delete)</li>
                      <li><strong>Before/After</strong> - The data changes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="filtering-logs">
                  <AccordionTrigger>Filtering & Searching</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>Use search to find logs by entity or action</li>
                      <li>Filter by entity type (vendors, users, etc.)</li>
                      <li>Filter by action type (create, update, delete)</li>
                      <li>Sort by date to see most recent changes first</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Data Migration - Admin Only */}
      {isAdmin && (
        <section id="data-migration" className="mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                10. Data Migration
              </CardTitle>
              <CardDescription>Import data from legacy systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="importing">
                  <AccordionTrigger>Importing Legacy Data</AccordionTrigger>
                  <AccordionContent>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Data migration should only be performed during initial setup or with proper planning.
                      </AlertDescription>
                    </Alert>
                    <p className="text-muted-foreground">
                      The Data Migration page allows you to import data from the legacy system. 
                      Contact your system administrator for assistance.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Need technical assistance? Contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
