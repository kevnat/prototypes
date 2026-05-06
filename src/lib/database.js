import { config } from './config.js';
import { supabase } from './supabaseClient.js';

// MySQL client will be initialized only if needed
let mysqlConnection = null;

const initMySQLConnection = async () => {
  if (mysqlConnection) return mysqlConnection;

  try {
    // For browser environment, we'll use fetch to communicate with a backend API
    // This is a placeholder - you'll need to implement a backend API for MySQL operations
    console.log('MySQL connection would be initialized here for backend');
    return {
      query: async (sql, params) => {
        console.log('MySQL Query:', sql, params);
        // This would make API calls to your backend
        throw new Error('MySQL backend API not implemented yet');
      }
    };
  } catch (error) {
    console.error('Failed to connect to MySQL:', error);
    throw error;
  }
};

// Database abstraction layer
export const db = {
  async getComments(prototypeId) {
    if (config.database.provider === 'supabase') {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('prototype_id', prototypeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } else {
      // MySQL implementation
      const mysql = await initMySQLConnection();
      const result = await mysql.query(
        'SELECT * FROM comments WHERE prototype_id = ? ORDER BY created_at DESC',
        [prototypeId]
      );
      return result;
    }
  },

  async addComment(prototypeId, comment) {
    if (config.database.provider === 'supabase') {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          ...comment,
          prototype_id: prototypeId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // MySQL implementation
      const mysql = await initMySQLConnection();
      const result = await mysql.query(
        'INSERT INTO comments (prototype_id, text, author, tab, created_at) VALUES (?, ?, ?, ?, NOW())',
        [prototypeId, comment.text, comment.author, comment.tab]
      );

      // Return the inserted comment with generated ID
      return {
        id: result.insertId,
        prototype_id: prototypeId,
        ...comment,
        created_at: new Date().toISOString()
      };
    }
  },

  async updateComment(commentId, updates) {
    if (config.database.provider === 'supabase') {
      const { data, error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // MySQL implementation
      const mysql = await initMySQLConnection();
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);

      await mysql.query(
        `UPDATE comments SET ${setClause} WHERE id = ?`,
        [...values, commentId]
      );

      // Return updated comment
      const result = await mysql.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      return result[0];
    }
  },

  async deleteComment(commentId) {
    if (config.database.provider === 'supabase') {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } else {
      // MySQL implementation
      const mysql = await initMySQLConnection();
      await mysql.query('DELETE FROM comments WHERE id = ?', [commentId]);
    }
  },

  // Story tickets — Supabase only
  // Table: story_tickets (id, prototype_id, type, ticket_key, title, description, sort_order, created_at, updated_at)
  // Unique constraint: (prototype_id, ticket_key)

  async getStoryTickets(prototypeId) {
    const { data, error } = await supabase
      .from('story_tickets')
      .select('*')
      .eq('prototype_id', prototypeId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertStoryTickets(prototypeId, tickets) {
    const rows = tickets.map(t => ({ ...t, prototype_id: prototypeId }));
    const { error } = await supabase
      .from('story_tickets')
      .upsert(rows, { onConflict: 'prototype_id,ticket_key' });
    if (error) throw error;
    // Re-fetch so the returned array is ordered correctly
    return this.getStoryTickets(prototypeId);
  },

  async updateStoryTicket(id, updates) {
    const { data, error } = await supabase
      .from('story_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteStoryTicket(id) {
    const { error } = await supabase
      .from('story_tickets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Helper to create MySQL tables if they don't exist
export const initializeDatabase = async () => {
  if (config.database.provider === 'mysql') {
    try {
      const mysql = await initMySQLConnection();
      await mysql.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          prototype_id VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          author VARCHAR(255) NOT NULL,
          tab VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_prototype_id (prototype_id)
        )
      `);
      console.log('✅ MySQL tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MySQL tables:', error);
    }
  }
};