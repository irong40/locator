import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Building2, 
  User, 
  KeyRound, 
  LogOut, 
  Search,
  Edit,
  Eye,
  Filter,
  Plus,
  BookOpen,
  Wrench,
  Factory
} from 'lucide-react';

export default function HelpGuideUser() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">User Help Guide</h1>
        <p className="text-muted-foreground">
          Welcome to C&R Repair Vendor Locator. This guide will help you navigate and use the system effectively.
        </p>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li><a href="#getting-started" className="text-primary hover:underline">1. Getting Started</a></li>
            <li><a href="#finding-vendors" className="text-primary hover:underline">2. Finding Vendors</a></li>
            <li><a href="#managing-vendors" className="text-primary hover:underline">3. Viewing & Managing Vendors</a></li>
            <li><a href="#profile" className="text-primary hover:underline">4. Managing Your Profile</a></li>
            <li><a href="#account" className="text-primary hover:underline">5. Password & Account</a></li>
          </ul>
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
            <CardDescription>Learn how to log in and navigate the system</CardDescription>
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
                    <li>If you forgot your password, click "Forgot Password" to reset it</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="navigation">
                <AccordionTrigger>Navigating the Sidebar</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    The sidebar on the left contains all navigation options available to you:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> <strong>Find Vendors</strong> - Search for vendors by location
                    </li>
                    <li className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> <strong>Vendors</strong> - Browse all vendors
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="roles">
                <AccordionTrigger>Understanding Your Role</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    Your role determines what actions you can perform:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">Viewer</Badge>
                      <span className="text-muted-foreground">Can view vendors and search</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">User</Badge>
                      <span className="text-muted-foreground">Can view and create/edit vendors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">Manager</Badge>
                      <span className="text-muted-foreground">Can manage vendors and catalogs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">Admin</Badge>
                      <span className="text-muted-foreground">Full system access</span>
                    </li>
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
                  <p className="text-muted-foreground mb-3">Search results show:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Distance</strong> - How far the vendor is from your searched location</li>
                    <li><strong>Vendor Name</strong> - Click to view full details</li>
                    <li><strong>Contact Info</strong> - Phone and email</li>
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
              3. Viewing & Managing Vendors
            </CardTitle>
            <CardDescription>Browse, filter, and manage vendor information</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="browse">
                <AccordionTrigger className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Browsing Vendors
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to <strong>Vendors</strong> from the sidebar</li>
                    <li>Browse the list of all vendors in the system</li>
                    <li>Click on any vendor row to view full details</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="filter">
                <AccordionTrigger className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Using Filters
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">Filter vendors by:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Search</strong> - Type to search by vendor name</li>
                    <li><strong>OEM Status</strong> - Filter by OEM certification</li>
                    <li><strong>EPP Status</strong> - Filter by EPP certification</li>
                    <li><strong>Preference</strong> - Filter by vendor preference level</li>
                    <li><strong>Vendor Level</strong> - Filter by service level</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="inline-edit">
                <AccordionTrigger className="flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Inline Editing
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    If you have edit permissions, you can quickly edit vendor information directly from the list:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Click the edit icon next to a vendor name or location</li>
                    <li>Make your changes in the popup</li>
                    <li>Click Save to confirm</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-detail">
                <AccordionTrigger>Vendor Details Page</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    Click on a vendor to view their full details including:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Contact Information</strong> - Phone, email, fax, point of contact</li>
                    <li><strong>Address</strong> - Full address with city, state, zip</li>
                    <li><strong>Certifications</strong> - OEM and EPP status</li>
                    <li className="flex items-center gap-2">
                      <Factory className="h-4 w-4" /> <strong>OEM Brands</strong> - Certified OEM brands
                    </li>
                    <li className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" /> <strong>Engine Brands</strong> - Supported engine brands
                    </li>
                    <li><strong>Payment Type</strong> - Accepted payment method</li>
                    <li><strong>Comments</strong> - Additional notes</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="create-vendor">
                <AccordionTrigger className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Creating a New Vendor
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3">
                    If you have User role or above:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Click the <strong>+ Add Vendor</strong> button on the Vendors page</li>
                    <li>Fill in the vendor information (name is required)</li>
                    <li>Add address details - the system will automatically calculate coordinates</li>
                    <li>Set OEM/EPP certifications as needed</li>
                    <li>Click <strong>Create Vendor</strong> to save</li>
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
              4. Managing Your Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="update-profile">
                <AccordionTrigger>Updating Your Profile</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Click on your avatar/name in the top right corner</li>
                    <li>Select <strong>Profile</strong> from the dropdown</li>
                    <li>Update your first name, last name, or phone number</li>
                    <li>Click <strong>Update Profile</strong> to save changes</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            <CardDescription>Manage your password and account access</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="reset-password">
                <AccordionTrigger>Resetting Your Password</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>On the login page, click <strong>Forgot Password</strong></li>
                    <li>Enter your email address</li>
                    <li>Check your email for a reset link</li>
                    <li>Click the link and enter your new password</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="logout">
                <AccordionTrigger className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Logging Out
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Click on your avatar/name in the top right corner</li>
                    <li>Select <strong>Sign out</strong> from the dropdown</li>
                    <li>You will be returned to the login page</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Need more help? Contact your system administrator for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
