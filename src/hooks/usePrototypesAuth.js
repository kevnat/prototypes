import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const SESSION_KEY = 'proto_access_session';

function getSession() {
  try {
    const v = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return !!(v && v.expiry > Date.now());
  } catch { return false; }
}

export function usePrototypesAuth() {
  const [isUnlocked, setIsUnlocked] = useState(() => getSession());
  const [storedHash, setStoredHash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('flywheel_board_state')
          .select('value')
          .eq('key', 'proto_access_hash')
          .single();
        if (data) setStoredHash(data.value);
      } catch (err) {
        console.warn('usePrototypesAuth: could not load hash', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unlock = useCallback(async (passphrase) => {
    if (!storedHash) return false;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(passphrase));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    if (hashHex === storedHash) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + 8 * 60 * 60 * 1000 }));
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [storedHash]);

  return { isUnlocked, loading, unlock };
}
