import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDocuments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, document_categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      categoryId,
    }: {
      file: File;
      title: string;
      description?: string;
      categoryId: string;
    }) => {
      const fileExt = file.name.split('.').pop() ?? 'bin';
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Insert DB record
      const { error: dbError } = await supabase.from('documents').insert({
        title,
        description: description || null,
        category_id: categoryId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        uploaded_by: user?.id ?? null,
      });

      if (dbError) {
        // Rollback: remove the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      if (dbError) throw dbError;

      // Remove file from storage (best effort)
      await supabase.storage.from('documents').remove([filePath]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      categoryId,
    }: {
      id: string;
      title: string;
      description?: string;
      categoryId: string;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          title,
          description: description || null,
          category_id: categoryId,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documentsQuery,
    categoriesQuery,
    uploadMutation,
    deleteMutation,
    updateMutation,
    getDownloadUrl,
  };
}
