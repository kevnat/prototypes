import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSupabaseComments = (prototypeId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('prototype_id', prototypeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (comment) => {
    try {
      if (!comment.text || !comment.author || !comment.tab) {
        throw new Error('Missing required fields');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            ...comment,
            prototype_id: prototypeId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setComments((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const updateComment = async (commentId, updates) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? data : comment))
      );
      return data;
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [prototypeId]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refreshComments: fetchComments,
  };
};
