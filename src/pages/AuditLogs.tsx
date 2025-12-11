import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string;
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-green-500/10 text-green-600 border-green-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const ENTITY_LABELS: Record<string, string> = {
  vendors: 'Vendor',
  products: 'Product',
  oem_brands: 'OEM Brand',
  engine_brands: 'Engine Brand',
  payment_types: 'Payment Type',
  profiles: 'Profile',
  user_role_assignments: 'Role Assignment',
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch actor names for all logs
      const userIds = [...new Set(data?.filter(l => l.actor_user_id).map(l => l.actor_user_id))];
      const actorNames: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        profiles?.forEach(p => {
          actorNames[p.user_id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown';
        });
      }

      return (data || []).map(log => ({
        ...log,
        actor_name: log.actor_user_id ? actorNames[log.actor_user_id] || 'Unknown' : 'System',
      })) as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.entity_type.toLowerCase().includes(search) ||
      log.actor_name?.toLowerCase().includes(search) ||
      log.entity_id.toLowerCase().includes(search) ||
      JSON.stringify(log.after_data).toLowerCase().includes(search) ||
      JSON.stringify(log.before_data).toLowerCase().includes(search)
    );
  });

  const getChangedFields = (before: Record<string, unknown> | null, after: Record<string, unknown> | null) => {
    if (!before || !after) return [];
    const changes: { field: string; old: unknown; new: unknown }[] = [];
    
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    allKeys.forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({ field: key, old: before[key], new: after[key] });
      }
    });
    
    return changes;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">View all changes made to system records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity History
          </CardTitle>
          <CardDescription>Track all create, update, and delete operations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="oem_brands">OEM Brands</SelectItem>
                  <SelectItem value="engine_brands">Engine Brands</SelectItem>
                  <SelectItem value="payment_types">Payment Types</SelectItem>
                  <SelectItem value="profiles">Profiles</SelectItem>
                  <SelectItem value="user_role_assignments">Role Assignments</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="INSERT">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium">{log.actor_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ACTION_COLORS[log.action]}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                        <span className="text-xs text-muted-foreground block truncate max-w-[120px]">
                          {log.entity_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {log.action} {ENTITY_LABELS[log.entity_type] || log.entity_type}
                              </DialogTitle>
                              <DialogDescription>
                                {format(new Date(log.created_at), 'MMMM d, yyyy h:mm:ss a')} by {log.actor_name}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              {log.action === 'UPDATE' ? (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">Changed Fields:</h4>
                                  {getChangedFields(log.before_data, log.after_data).map(change => (
                                    <div key={change.field} className="bg-muted rounded-lg p-3">
                                      <div className="font-medium text-sm mb-1">{change.field}</div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Before:</span>
                                          <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                                            {JSON.stringify(change.old, null, 2) || 'null'}
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">After:</span>
                                          <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                                            {JSON.stringify(change.new, null, 2) || 'null'}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">
                                    {log.action === 'INSERT' ? 'Created Data:' : 'Deleted Data:'}
                                  </h4>
                                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                                    {JSON.stringify(log.action === 'INSERT' ? log.after_data : log.before_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
