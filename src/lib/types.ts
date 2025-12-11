// Branded type helper
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

// Branded ID types for type safety
export type VendorId = Brand<string, 'VendorId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type OemBrandId = Brand<string, 'OemBrandId'>;
export type EngineBrandId = Brand<string, 'EngineBrandId'>;
export type PaymentTypeId = Brand<string, 'PaymentTypeId'>;
export type ZipCode = Brand<string, 'ZipCode'>;

// Domain types based on C&R schema
export type Vendor = {
  id: VendorId;
  vendor_name: string;
  poc: string | null;
  hr_labour_rate: number;
  phone_no: string | null;
  fax_no: string | null;
  email_address: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  oem: boolean;
  epp: boolean;
  vendor_level: 'Good' | 'Bad' | null;
  preference: 'Preferred' | 'Do Not Use' | null;
  comments: string | null;
  payment_type_id: PaymentTypeId | null;
  created_at: string;
  updated_at: string;
};

export type VendorInsert = Omit<Vendor, 'id' | 'created_at' | 'updated_at'>;
export type VendorUpdate = Partial<VendorInsert>;

export type OemBrand = {
  id: OemBrandId;
  oem_brand: string;
  created_at: string;
};

export type Product = {
  id: ProductId;
  product: string;
  created_at: string;
};

export type EngineBrand = {
  id: EngineBrandId;
  engine_brand: string;
  created_at: string;
};

export type PaymentType = {
  id: PaymentTypeId;
  payment_type: string;
  created_at: string;
};

export type ZipcodeList = {
  id: string;
  zipcode: ZipCode;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type VendorWithRelations = Vendor & {
  payment_type?: PaymentType;
  oem_brands?: OemBrand[];
  epp_brands?: OemBrand[];
  products?: Product[];
  engine_brands?: (EngineBrand & { is_certified: boolean })[];
};
