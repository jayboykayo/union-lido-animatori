import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Ascolta nuovi messaggi in tempo reale su un canale.
 * @param {string} channel  - Nome canale Supabase Realtime
 * @param {object} filter   - Filtro Postgres { column, value }
 * @param {function} onMessage - Callback con il nuovo messaggio
 */
export function useRealtime(channel, filter, onMessage) {
  const callbackRef = useRef(onMessage)
  callbackRef.current = onMessage

  useEffect(() => {
    if (!channel) return

    const sub = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        (payload) => callbackRef.current(payload.new)
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channel])
}

/**
 * Ascolta cambiamenti generici su una tabella.
 */
export function useTableRealtime(tableName, event = '*', onPayload) {
  const callbackRef = useRef(onPayload)
  callbackRef.current = onPayload

  useEffect(() => {
    const sub = supabase
      .channel(`table-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table: tableName },
        (payload) => callbackRef.current(payload)
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [tableName, event])
}
