import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const KEYS = ['pfr_overrides', 'pfr_hidden', 'pfr_techdebt', 'pfr_groom'];

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useFlywheelBoard() {
  const [overrides,   setOverridesState]  = useState(() => lsGet('pfr_overrides', {}));
  const [hidden,      setHiddenState]     = useState(() => lsGet('pfr_hidden',    []));
  const [showTD,      setShowTDState]     = useState(() => lsGet('pfr_techdebt',  false));
  const [groomState,  setGroomStateRaw]   = useState(() => lsGet('pfr_groom',     {}));
  const [loaded,      setLoaded]          = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('flywheel_board_state')
          .select('key, value')
          .in('key', KEYS);
        if (error) throw error;

        const byKey = {};
        (data || []).forEach(row => { byKey[row.key] = row.value; });

        if (byKey.pfr_overrides !== undefined) { setOverridesState(byKey.pfr_overrides); lsSet('pfr_overrides', byKey.pfr_overrides); }
        if (byKey.pfr_hidden    !== undefined) { setHiddenState(byKey.pfr_hidden);        lsSet('pfr_hidden',    byKey.pfr_hidden); }
        if (byKey.pfr_techdebt  !== undefined) { setShowTDState(byKey.pfr_techdebt);      lsSet('pfr_techdebt',  byKey.pfr_techdebt); }
        if (byKey.pfr_groom     !== undefined) { setGroomStateRaw(byKey.pfr_groom);       lsSet('pfr_groom',     byKey.pfr_groom); }
      } catch (err) {
        console.warn('useFlywheelBoard: Supabase load failed, using localStorage', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (key, value) => {
    lsSet(key, value);
    try {
      await supabase
        .from('flywheel_board_state')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    } catch (err) {
      console.warn('useFlywheelBoard: Supabase write failed', err);
    }
  }, []);

  const setOverrides  = useCallback(next => { setOverridesState(next);  persist('pfr_overrides', next); }, [persist]);
  const setHidden     = useCallback(next => { setHiddenState(next);     persist('pfr_hidden',    next); }, [persist]);
  const setShowTD     = useCallback(next => { setShowTDState(next);     persist('pfr_techdebt',  next); }, [persist]);
  const setGroomState = useCallback(next => { setGroomStateRaw(next);   persist('pfr_groom',     next); }, [persist]);

  return { overrides, setOverrides, hidden, setHidden, showTD, setShowTD, groomState, setGroomState, loaded };
}
