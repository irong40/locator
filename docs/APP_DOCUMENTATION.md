# Vendor Locator App - Technical Documentation

A full-stack vendor management application built with React, TypeScript, and Supabase. This app provides role-based access to a searchable vendor directory with geo-location capabilities, catalog management, and user administration.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [Features](#features)
- [Edge Functions](#edge-functions)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)

---

## Overview

The Vendor Locator is a B2B vendor management system designed for organizations that need to:
- Maintain a directory of service vendors
- Search vendors by location (zip code-based proximity)
- Track vendor certifications (OEM, EPP)
- Manage catalog items (products, engine brands, OEM brands)
- Control user access with role-based permissions

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI Components | shadcn/ui, Radix UI primitives |
| Styling | Tailwind CSS with design tokens |
| State Management | TanStack Query (React Query) |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Email | Resend |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |

---

## Project Structure

```
src/
├── components/
│   ├── auth/           # Login, Register, AccessDenied
│   ├── help/           # Help guides and redirects
│   ├── layout/         # AppLayout, AppSidebar, UserMenu
│   ├── ui/             # shadcn/ui components
│   └── vendors/        # Vendor-specific components
├── hooks/
│   ├── useAuth.tsx     # Authentication context & hooks
│   ├── useUserRole.ts  # Role-based access helpers
│   └── useVendorSearch.ts
├── integrations/
│   └── supabase/       # Supabase client & types
├── lib/
│   ├── schemas/        # Zod validation schemas
│   ├── types.ts        # Domain types with branded IDs
│   └── utils.ts        # Utility functions
├── pages/              # Route pages
└── test/               # Integration & unit tests

supabase/
├── functions/          # Edge functions
│   ├── _shared/        # Shared auth utilities
│   ├── delete-user/
│   ├── import-legacy-data/
│   ├── invite-user-builtin/
│   ├── populate-missing-zipcodes/
│   └── reinvite-user-builtin/
└── migrations/         # Database migrations
```

---

## Authentication & Authorization

### User Roles

| Role | Access Level |
|------|--------------|
| **Admin** | Full access: users, vendors, catalog, audit logs, data migration |
| **Manager** | Dashboard, vendors, catalog management |
| **User** | Vendors (create/view), profile |
| **Viewer** | Read-only access to vendors |

### Route Protection

Routes are protected via the `<ProtectedRoute>` component which:
1. Checks authentication status
2. Verifies role permissions
3. Redirects to login or shows `<AccessDenied>` if unauthorized

```tsx
<ProtectedRoute allowedRoles={['Admin', 'Manager']}>
  <Dashboard />
</ProtectedRoute>
```

### Password Reset Flow

1. User requests reset via `/forgot-password`
2. Email sent with recovery link
3. User redirected to `/reset-password` to set new password
4. `useRecoveryRedirect` hook detects recovery tokens in URL hash

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `vendors` | Vendor companies with location, certifications, preferences |
| `profiles` | User profile data linked to Supabase auth |
| `user_roles` | Role definitions (Admin, Manager, User, Viewer) |
| `user_role_assignments` | User-to-role mapping |

### Catalog Tables

| Table | Description |
|-------|-------------|
| `products` | Product catalog |
| `oem_brands` | OEM brand list |
| `engine_brands` | Engine brand list |
| `payment_types` | Payment type options |

### Junction Tables

| Table | Description |
|-------|-------------|
| `vendor_products` | Vendor ↔ Product associations |
| `vendor_oem_brands` | Vendor ↔ OEM Brand associations |
| `vendor_epp_brands` | Vendor ↔ EPP Brand associations |
| `vendor_engine_brands` | Vendor ↔ Engine Brand (with certification flag) |

### Reference Tables

| Table | Description |
|-------|-------------|
| `zipcode_lists` | Zip codes with lat/lng for geo-search |
| `audit_logs` | System activity tracking |
| `migration_mappings` | Legacy ID → new UUID mapping |

### Key Vendor Fields

```typescript
type Vendor = {
  id: VendorId;
  vendor_name: string;
  poc: string | null;              // Point of contact
  hr_labour_rate: number;
  phone_no, fax_no, email_address: string | null;
  address, city, state, zip_code: string | null;
  latitude, longitude: number | null;
  oem: boolean;                    // OEM certified
  epp: boolean;                    // EPP certified
  vendor_level: 'Good' | 'Bad' | null;
  preference: 'Preferred' | 'Do Not Use' | null;
  payment_type_id: PaymentTypeId | null;
};
```

---

## Features

### Dashboard (`/dashboard`)
- **Access**: Admin, Manager
- Quick vendor search by zip code
- Key metrics: total vendors, OEM/EPP counts
- Distribution charts (preference, level, OEM/EPP, by state)
- Recent vendors list

### Vendor Management (`/vendors`)
- **Access**: All authenticated users
- Searchable/filterable vendor table
- Inline editing for name and location
- Filters: OEM/EPP status, preference, vendor level
- "Needs Review" flag for imported vendors

### Vendor Detail (`/vendors/:id`)
- Full vendor information display
- Linked brands (OEM, EPP, Engine)
- Products and payment type
- Edit capabilities for authorized users

### Vendor Search (`/vendor-search`)
- Geo-proximity search by zip code
- Configurable radius (25-200 miles)
- Results sorted by distance
- Filter by certifications

### Catalog Management
- **OEM Brands** (`/oem-brands`): Admin, Manager
- **Engine Brands** (`/engine-brands`): Admin, Manager
- **Products** (`/products`): Admin, Manager
- **Payment Types** (`/payment-types`): Admin, Manager

### User Management (`/user-management`)
- **Access**: Admin only
- Invite new users via email
- Activate/deactivate users
- Change user roles
- Resend invitations
- Delete users

### Audit Logs (`/audit-logs`)
- **Access**: Admin only
- Track all system changes
- Filter by entity type and action

### Data Migration (`/data-migration`)
- **Access**: Admin only
- Import legacy data from previous systems

---

## Edge Functions

### `invite-user-builtin`
Creates new user via Supabase Auth and sends invitation email.

**Input:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": "uuid-of-role"
}
```

### `reinvite-user-builtin`
Resends password reset email to existing user.

**Input:**
```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

### `delete-user`
Permanently deletes user from auth and profile tables.

### `import-legacy-data`
Imports vendors from legacy Laravel database format.

### `populate-missing-zipcodes`
Backfills coordinates for vendors missing lat/lng based on zip code.

---

## Environment Setup

### Required Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (edge functions) |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address |

### Supabase Configuration

1. Enable Email auth provider
2. Set Site URL to production domain
3. Add redirect URLs for password reset
4. Configure email templates (Invite, Reset Password)

---

## Deployment

### Frontend (Lovable)

1. Click **Publish** in Lovable editor
2. Configure custom domain in Settings → Domains

### Backend (Supabase)

- Edge functions deploy automatically
- Database migrations run on approval
- Set secrets in Supabase Dashboard → Settings → Functions

### Post-Deployment Checklist

- [ ] Verify Site URL in Supabase Auth settings
- [ ] Test invite flow with real email
- [ ] Test password reset flow
- [ ] Verify RLS policies are active
- [ ] Check audit logs are recording

---

## Development Guidelines

### Type Safety
- Use branded types for IDs: `VendorId`, `ProductId`, etc.
- Use `import type` for type-only imports
- Validate inputs with Zod schemas

### Testing
- Unit tests in `*.spec.ts` files
- Integration tests in `src/test/integration/`
- Run with `npm test` or `vitest`

### Code Style
- Follow Conventional Commits for git messages
- Use semantic design tokens from `index.css`
- Prefer small, focused components

---

## License

Proprietary - All rights reserved.
