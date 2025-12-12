import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleCapabilitiesCard } from '@/components/help/RoleCapabilitiesCard';
import { 
  MapPin, 
  Building2, 
  User, 
  KeyRound, 
  LogOut, 
  Eye,
  Filter,
  BookOpen,
  Wrench,
  Factory,
  Pencil,
  Package
} from 'lucide-react';

export default function HelpGuideUser() {
  const { canEdit, isLoading } = useUserRole();

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Help Guide</h1>
        <p className="text-muted-foreground">
          {canEdit 
            ? "Welcome! This guide will help you find vendors, view details, and edit vendor information."
            : "Welcome! This guide will help you find and view vendor information."}
        </p>
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
          <ul className="space-y-2">
            <li><a href="#getting-started" className="text-primary hover:underline">1. Getting Started</a></li>
            <li><a href="#finding-vendors" className="text-primary hover:underline">2. Finding Vendors</a></li>
            <li><a href="#viewing-vendors" className="text-primary hover:underline">3. Viewing Vendors</a></li>
            {canEdit && (
              <li><a href="#editing-vendors" className="text-primary hover:underline">4. Editing Vendors</a></li>
            )}
            <li><a href="#profile" className="text-primary hover:underline">{canEdit ? '5' : '4'}. Managing Your Profile</a></li>
            <li><a href="#account" className="text-primary hover:underline">{canEdit ? '6' : '5'}. Password & Account</a></li>
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
                    The sidebar on the left contains your navigation options:
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

      {/* Viewing Vendors */}
      <section id="viewing-vendors" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              3. Viewing Vendors
            </CardTitle>
            <CardDescription>Browse and filter vendor information</CardDescription>
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
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Editing Vendors - Only shown for Users who can edit */}
      {canEdit && (
        <section id="editing-vendors" className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                4. Editing Vendors
              </CardTitle>
              <CardDescription>Update vendor information and add brands/products</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="edit-vendor">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> Editing Vendor Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Navigate to the vendor's detail page by clicking on their name</li>
                      <li>Click the <strong>Edit</strong> button at the top of the page</li>
                      <li>Update the vendor's contact info, address, certifications, or other details</li>
                      <li>Click <strong>Save Changes</strong> to confirm your edits</li>
                    </ol>
                    <p className="text-muted-foreground mt-3 text-sm italic">
                      Note: You can edit vendor details but cannot delete vendors.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="add-brands">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Factory className="h-4 w-4" /> Adding OEM & EPP Brands
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>On the vendor detail page, scroll to the <strong>OEM Brands</strong> or <strong>EPP Brands</strong> section</li>
                      <li>Click the <strong>+ Add</strong> button</li>
                      <li>Select a brand from the dropdown list</li>
                      <li>Click <strong>Add</strong> to associate the brand with the vendor</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="add-engine-brands">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Adding Engine Brands
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>On the vendor detail page, scroll to the <strong>Engine Brands</strong> section</li>
                      <li>Click the <strong>+ Add</strong> button</li>
                      <li>Select an engine brand from the dropdown list</li>
                      <li>Toggle the <strong>Certified</strong> switch if the vendor is certified for that brand</li>
                      <li>Click <strong>Add</strong> to save</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="add-products">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Adding Products
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>On the vendor detail page, scroll to the <strong>Products</strong> section</li>
                      <li>Click the <strong>+ Add</strong> button</li>
                      <li>Select a product from the dropdown list</li>
                      <li>Click <strong>Add</strong> to associate the product with the vendor</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Profile */}
      <section id="profile" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {canEdit ? '5' : '4'}. Managing Your Profile
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
              {canEdit ? '6' : '5'}. Password & Account
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
