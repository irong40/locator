import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccessDenied } from '@/components/auth/AccessDenied';

type TableName = 
  | 'engine_brands' 
  | 'oem_brands' 
  | 'products' 
  | 'payment_types' 
  | 'zipcode_lists'
  | 'vendors'
  | 'vendor_engine_brands'
  | 'vendor_oem_brands'
  | 'vendor_epp_brands'
  | 'vendor_products'
  | 'users';

type ImportResult = {
  table: string;
  inserted: number;
  errors: string[];
  mappings?: Record<number, string>;
};

type MigrationPhase = {
  name: string;
  tables: TableName[];
  description: string;
};

const PHASES: MigrationPhase[] = [
  {
    name: 'Phase 1: Lookup Tables',
    tables: ['engine_brands', 'oem_brands', 'products', 'payment_types'],
    description: 'Import base lookup tables (no dependencies)',
  },
  {
    name: 'Phase 1b: Zipcodes',
    tables: ['zipcode_lists'],
    description: 'Import zipcode data (33,000+ records)',
  },
  {
    name: 'Phase 2: Vendors',
    tables: ['vendors'],
    description: 'Import vendor records (uses payment_type mappings)',
  },
  {
    name: 'Phase 3: Junction Tables',
    tables: ['vendor_engine_brands', 'vendor_oem_brands', 'vendor_epp_brands', 'vendor_products'],
    description: 'Import vendor relationships (uses all previous mappings)',
  },
  {
    name: 'Phase 4: Users',
    tables: ['users'],
    description: 'Import users and create Supabase Auth accounts',
  },
];

export default function DataMigration() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useUserRole();
  const [files, setFiles] = useState<Record<TableName, File | null>>({
    engine_brands: null,
    oem_brands: null,
    products: null,
    payment_types: null,
    zipcode_lists: null,
    vendors: null,
    vendor_engine_brands: null,
    vendor_oem_brands: null,
    vendor_epp_brands: null,
    vendor_products: null,
    users: null,
  });
  const [importing, setImporting] = useState<TableName | null>(null);
  const [results, setResults] = useState<Record<string, ImportResult>>({});
  const [mappings, setMappings] = useState<Record<string, Record<number, string>>>({});
  const [progress, setProgress] = useState(0);

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (role !== 'Admin') {
    return <AccessDenied />;
  }

  const handleFileChange = (table: TableName, file: File | null) => {
    setFiles(prev => ({ ...prev, [table]: file }));
  };

  const parseCSV = async (file: File): Promise<Record<string, unknown>[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        let value = values[i]?.replace(/^"|"$/g, '') || '';
        if (value === 'NULL' || value === '') {
          row[header] = null;
        } else {
          row[header] = value;
        }
      });
      return row;
    });
  };

  const importTable = async (table: TableName) => {
    const file = files[table];
    if (!file) {
      toast.error(`No file selected for ${table}`);
      return;
    }

    setImporting(table);
    setProgress(0);

    try {
      const data = await parseCSV(file);
      setProgress(25);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      setProgress(50);

      const response = await supabase.functions.invoke('import-legacy-data', {
        body: { table, data, mappings },
      });

      setProgress(100);

      if (response.error) {
        toast.error(`Import failed: ${response.error.message}`);
        return;
      }

      const result = response.data as ImportResult;
      setResults(prev => ({ ...prev, [table]: result }));

      // Store mappings for subsequent imports
      if (result.mappings) {
        setMappings(prev => ({ ...prev, [table]: result.mappings! }));
      }

      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.inserted} records with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${result.inserted} records`);
      }
    } catch (error: any) {
      toast.error(`Import error: ${error.message}`);
    } finally {
      setImporting(null);
      setProgress(0);
    }
  };

  const importPhase = async (phase: MigrationPhase) => {
    for (const table of phase.tables) {
      if (files[table]) {
        await importTable(table);
      }
    }
  };

  const getTableStatus = (table: TableName) => {
    if (importing === table) return 'importing';
    if (results[table]) {
      return results[table].errors.length > 0 ? 'warning' : 'success';
    }
    if (files[table]) return 'ready';
    return 'pending';
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'importing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Importing</Badge>;
      case 'success':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
      case 'warning':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Errors</Badge>;
      case 'ready':
        return <Badge variant="outline">Ready</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Migration</h1>
            <p className="text-muted-foreground">Import data from legacy Laravel database</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {importing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing {importing}...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {PHASES.map((phase, phaseIndex) => (
          <Card key={phase.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{phase.name}</CardTitle>
                  <CardDescription>{phase.description}</CardDescription>
                </div>
                <Button
                  onClick={() => importPhase(phase)}
                  disabled={importing !== null || !phase.tables.some(t => files[t])}
                >
                  Import Phase
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phase.tables.map(table => (
                  <div key={table} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{table}</span>
                        <StatusBadge status={getTableStatus(table)} />
                      </div>
                      {results[table] && (
                        <p className="text-sm text-muted-foreground">
                          {results[table].inserted} inserted
                          {results[table].errors.length > 0 && `, ${results[table].errors.length} errors`}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange(table, e.target.files?.[0] || null)}
                        className="hidden"
                        id={`file-${table}`}
                      />
                      <label htmlFor={`file-${table}`}>
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {files[table] ? files[table]!.name : 'Select CSV'}
                          </span>
                        </Button>
                      </label>
                      
                      <Button
                        size="sm"
                        onClick={() => importTable(table)}
                        disabled={!files[table] || importing !== null}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(results).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {Object.entries(results).map(([table, result]) => (
                    <div key={table} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{table}</span>
                        <span className="text-sm text-muted-foreground">
                          {result.inserted} records imported
                        </span>
                      </div>
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-destructive mb-1">Errors:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {result.errors.slice(0, 10).map((err, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                {err}
                              </li>
                            ))}
                            {result.errors.length > 10 && (
                              <li className="text-muted-foreground">
                                ...and {result.errors.length - 10} more errors
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {Object.keys(mappings).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ID Mappings</CardTitle>
              <CardDescription>Old Laravel IDs → New Supabase UUIDs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mappings).map(([table, map]) => (
                  <div key={table} className="text-center p-3 border rounded-lg">
                    <p className="font-medium">{table}</p>
                    <p className="text-2xl font-bold text-primary">{Object.keys(map).length}</p>
                    <p className="text-xs text-muted-foreground">mappings</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
