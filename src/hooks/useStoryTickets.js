import { useState, useEffect } from 'react';
import { db } from '../lib/database.js';

export const useStoryTickets = (prototypeId, seedData) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let data = await db.getStoryTickets(prototypeId);
        if (data.length === 0 && seedData?.length) {
          data = await db.upsertStoryTickets(prototypeId, seedData);
        }
        setTickets(data || []);
      } catch (err) {
        console.error('Error fetching story tickets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [prototypeId]);

  // Updates by sort_order (the story display number, 1-N).
  // Internally resolves to the DB id so callers don't need to track it.
  const updateStoryTicket = async (sortOrder, updates) => {
    const target = tickets.find(t => t.sort_order === sortOrder);
    if (!target) return;
    const data = await db.updateStoryTicket(target.id, updates);
    setTickets(prev => prev.map(t => t.id === target.id ? data : t));
    return data;
  };

  const deleteStoryTicket = async (sortOrder) => {
    const target = tickets.find(t => t.sort_order === sortOrder);
    if (!target) return;
    await db.deleteStoryTicket(target.id);
    setTickets(prev => prev.filter(t => t.id !== target.id));
  };

  const epic = tickets.find(t => t.type === 'epic') || null;
  const stories = tickets.filter(t => t.type === 'story');

  return { epic, stories, loading, error, updateStoryTicket, deleteStoryTicket };
};
