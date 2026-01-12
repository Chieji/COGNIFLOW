import { useStore } from '../store';
import { useMemo } from 'react';

export function useGraph() {
  const notes = useStore((state) => state.notes);
  const connections = useStore((state) => state.connections || []);

  const graphNodes = useMemo(() => 
    notes.map((note) => ({ id: note.id, label: note.title })),
    [notes]
  );

  return { notes, connections, graphNodes };
}
