import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog';
import { DocumentEditDialog } from '@/components/documents/DocumentEditDialog';
import { QueryError } from '@/components/ui/query-error';

export default function Documents() {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const {
    documentsQuery,
    categoriesQuery,
    uploadMutation,
    deleteMutation,
    updateMutation,
    getDownloadUrl,
  } = useDocuments();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<{
    id: string;
    title: string;
    description: string | null;
    category_id: string;
  } | null>(null);

  const categories = categoriesQuery.data ?? [];
  const documents = documentsQuery.data ?? [];

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !searchTerm || doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeTab === 'all' || doc.category_id === activeTab;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, activeTab]);

  const handleDownload = async (filePath: string) => {
    try {
      const url = await getDownloadUrl(filePath);
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Error', description: 'Failed to generate download link.', variant: 'destructive' });
    }
  };

  const handleUpload = (data: { file: File; title: string; description?: string; categoryId: string }) => {
    uploadMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Document uploaded successfully' });
        setUploadOpen(false);
      },
      onError: (error) => {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleUpdate = (data: { id: string; title: string; description?: string; categoryId: string }) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast({ title: 'Document updated successfully' });
        setEditingDoc(null);
      },
      onError: (error) => {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleDelete = (id: string, filePath: string) => {
    deleteMutation.mutate(
      { id, filePath },
      {
        onSuccess: () => {
          toast({ title: 'Document deleted successfully' });
        },
        onError: (error) => {
          toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Browse manuals, training materials, and reference documents
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {documentsQuery.isError && (
        <QueryError
          message={documentsQuery.error?.message || 'Failed to load documents.'}
          onRetry={() => documentsQuery.refetch()}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {documentsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDownload={handleDownload}
                  onEdit={() =>
                    setEditingDoc({
                      id: doc.id,
                      title: doc.title,
                      description: doc.description,
                      category_id: doc.category_id,
                    })
                  }
                  onDelete={() => handleDelete(doc.id, doc.file_path)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || activeTab !== 'all'
                  ? 'No documents match your filters'
                  : 'No documents uploaded yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categories}
        onUpload={handleUpload}
        isPending={uploadMutation.isPending}
      />

      <DocumentEditDialog
        open={!!editingDoc}
        onOpenChange={(open) => !open && setEditingDoc(null)}
        categories={categories}
        document={editingDoc}
        onUpdate={handleUpdate}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
