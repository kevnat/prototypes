import { useState, useEffect } from 'react';
import { db } from '../lib/database.js';
import { config } from '../lib/config.js';

export const useComments = (prototypeId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await db.getComments(prototypeId);
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

      const data = await db.addComment(prototypeId, comment);
      setComments((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const updateComment = async (commentId, updates) => {
    try {
      const data = await db.updateComment(commentId, updates);
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
      await db.deleteComment(commentId);
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
    databaseProvider: config.database.provider,
  };
};

// Backward compatibility alias
export const useSupabaseComments = useComments;
