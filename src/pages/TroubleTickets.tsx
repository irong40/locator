import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Bug, FileText, Clock, CheckCircle, XCircle, Eye, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { QueryError } from '@/components/ui/query-error';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketType = 'issue' | 'error' | 'log';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  type: TicketType;
  title: string | null;
  description: string | null;
  priority: TicketPriority | null;
  category: string | null;
  error_name: string | null;
  error_message: string | null;
  error_stack: string | null;
  component_stack: string | null;
  log_type: string | null;
  log_message: string | null;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  page_url: string | null;
  browser_info: string | null;
  status: TicketStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', color: 'bg-red-500', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-500', icon: XCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-600 text-white' },
  high: { label: 'High', color: 'bg-orange-500 text-white' },
  medium: { label: 'Medium', color: 'bg-yellow-500 text-black' },
  low: { label: 'Low', color: 'bg-blue-500 text-white' },
};

const typeConfig: Record<TicketType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  issue: { label: 'Issue', icon: AlertCircle },
  error: { label: 'Error', icon: Bug },
  log: { label: 'Log', icon: FileText },
};

export default function TroubleTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: tickets = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['maintenance-tickets', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceTicket[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: TicketStatus; notes?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        if (notes) updateData.resolution_notes = notes;
      }

      const { error } = await supabase
        .from('maintenance_tickets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      toast({ title: 'Status updated', description: 'Ticket status has been updated.' });
      setSelectedTicket(null);
      setResolutionNotes('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.ticket_number.toLowerCase().includes(query) ||
      ticket.title?.toLowerCase().includes(query) ||
      ticket.error_message?.toLowerCase().includes(query) ||
      ticket.user_email?.toLowerCase().includes(query)
    );
  });

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    critical: tickets.filter((t) => t.priority === 'critical' && t.status === 'open').length,
    errors: tickets.filter((t) => t.type === 'error' && t.status === 'open').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trouble Tickets</h1>
          <p className="text-muted-foreground">Manage reported issues and errors</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <Bug className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <QueryError
          message={error?.message || 'Failed to load trouble tickets.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issue">Issues</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="log">Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>Click on a ticket to view details and manage status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title / Error</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const TypeIcon = typeConfig[ticket.type].icon;
                  const StatusIcon = statusConfig[ticket.status].icon;
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-4 w-4" />
                          {typeConfig[ticket.type].label}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {ticket.title || ticket.error_message || ticket.log_message || '-'}
                      </TableCell>
                      <TableCell>
                        {ticket.priority && (
                          <Badge className={priorityConfig[ticket.priority].color}>
                            {priorityConfig[ticket.priority].label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[ticket.status].color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[ticket.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.user_email || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedTicket.ticket_number}</span>
                  <Badge className={`${statusConfig[selectedTicket.status].color} text-white`}>
                    {statusConfig[selectedTicket.status].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {typeConfig[selectedTicket.type].label} reported on{' '}
                  {format(new Date(selectedTicket.created_at), 'MMMM d, yyyy HH:mm')}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="context">Context</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  {selectedTicket.type === 'issue' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <p className="text-sm text-muted-foreground">{selectedTicket.title || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedTicket.description || '-'}
                        </p>
                      </div>
                      {selectedTicket.priority && (
                        <div>
                          <label className="text-sm font-medium">Priority</label>
                          <Badge className={priorityConfig[selectedTicket.priority].color}>
                            {priorityConfig[selectedTicket.priority].label}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTicket.type === 'error' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Error Name</label>
                        <p className="text-sm font-mono text-red-600">{selectedTicket.error_name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Error Message</label>
                        <p className="text-sm text-muted-foreground">{selectedTicket.error_message || '-'}</p>
                      </div>
                      {selectedTicket.error_stack && (
                        <div>
                          <label className="text-sm font-medium">Stack Trace</label>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-40">
                            {selectedTicket.error_stack}
                          </pre>
                        </div>
                      )}
                      {selectedTicket.component_stack && (
                        <div>
                          <label className="text-sm font-medium">Component Stack</label>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-40">
                            {selectedTicket.component_stack}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTicket.type === 'log' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Log Type</label>
                        <p className="text-sm">{selectedTicket.log_type || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message</label>
                        <p className="text-sm text-muted-foreground">{selectedTicket.log_message || '-'}</p>
                      </div>
                      {selectedTicket.metadata && (
                        <div>
                          <label className="text-sm font-medium">Metadata</label>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(selectedTicket.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTicket.resolution_notes && (
                    <div>
                      <label className="text-sm font-medium">Resolution Notes</label>
                      <p className="text-sm text-muted-foreground">{selectedTicket.resolution_notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="context" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Reporter</label>
                    <p className="text-sm text-muted-foreground">{selectedTicket.user_email || 'Anonymous'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Page URL</label>
                    <p className="text-sm text-muted-foreground break-all">{selectedTicket.page_url || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Browser Info</label>
                    <p className="text-sm text-muted-foreground break-all">{selectedTicket.browser_info || '-'}</p>
                  </div>
                  {selectedTicket.category && (
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <p className="text-sm">{selectedTicket.category}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Update Status</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTicket.status !== 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'in_progress' })}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Mark In Progress
                        </Button>
                      )}
                      {selectedTicket.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600"
                          onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'resolved', notes: resolutionNotes })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                      {selectedTicket.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: 'closed', notes: resolutionNotes })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      placeholder="Add notes about how this was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
