'use client';
import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { KanbanColumn } from './kanban-column';
import { IssueCard } from './issue-card';
import { IssueCreateModal } from '@/components/issues/issue-create-modal';
import { IssueDetailDrawer } from '@/components/issues/issue-detail-drawer';
import type { Issue, IssueStatus, ProjectMember } from '@/types';

interface Column { key: IssueStatus; label: string; color: string; issues: Issue[] }

interface Props {
  columns: Column[];
  onMove: (issueId: string, status: string, position: number) => void;
  projectId: string;
  sprintId?: string;
}

export function KanbanBoard({ columns: initialColumns, onMove, projectId, sprintId }: Props) {
  // Local optimistic state — mirrors server columns but updates immediately on drag
  const [cols, setCols] = useState<Column[]>(initialColumns);
  // Sync when server data changes (but not while dragging)
  const isDragging = useRef(false);
  if (!isDragging.current) {
    const serverJson = JSON.stringify(initialColumns.map((c) => ({ k: c.key, ids: c.issues.map((i) => i.id) })));
    const localJson  = JSON.stringify(cols.map((c) => ({ k: c.key, ids: c.issues.map((i) => i.id) })));
    if (serverJson !== localJson) setCols(initialColumns);
  }

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [activeTargetKey, setActiveTargetKey] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<IssueStatus | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  // Track the column the card came from — onDragOver moves it before handleDragEnd fires
  const srcColKeyRef = useRef<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  });
  const members: ProjectMember[] = project?.members ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  /** Find which column an id belongs to (column key or issue id) */
  const findColumn = useCallback((id: string): Column | undefined => {
    return cols.find((c) => c.key === id || c.issues.some((i) => i.id === id));
  }, [cols]);

  const handleDragStart = (event: DragStartEvent) => {
    isDragging.current = true;
    const activeId = String(event.active.id);
    const issue = cols.flatMap((c) => c.issues).find((i) => i.id === activeId);
    setActiveIssue(issue ?? null);
    srcColKeyRef.current = cols.find((c) => c.issues.some((i) => i.id === activeId))?.key ?? null;
  };

  /** Live update: move card between columns as you hover */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId   = String(over.id);
    if (activeId === overId) return;

    const activeCol = findColumn(activeId);
    const overCol   = findColumn(overId);
    if (!activeCol || !overCol || activeCol.key === overCol.key) return;

    setActiveTargetKey(overCol.key);
    setCols((prev) => {
      const src  = prev.find((c) => c.key === activeCol.key)!;
      const dest = prev.find((c) => c.key === overCol.key)!;
      const card = src.issues.find((i) => i.id === activeId)!;

      // Determine insertion index in destination column
      const overIndex = dest.issues.findIndex((i) => i.id === overId);
      const insertAt  = overIndex >= 0 ? overIndex : dest.issues.length;

      return prev.map((c) => {
        if (c.key === src.key)  return { ...c, issues: c.issues.filter((i) => i.id !== activeId) };
        if (c.key === dest.key) {
          const next = [...dest.issues];
          next.splice(insertAt, 0, { ...card, status: dest.key as IssueStatus });
          return { ...c, issues: next };
        }
        return c;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    isDragging.current = false;
    const { active, over } = event;
    setActiveIssue(null);
    setActiveTargetKey(null);

    const origColKey = srcColKeyRef.current;
    srcColKeyRef.current = null;

    if (!over || !origColKey) return;

    const activeId = String(active.id);
    const overId   = String(over.id);

    // overCol is determined from the pre-optimistic state (origColKey) vs where we dropped
    const overCol = cols.find((c) => c.key === overId || c.issues.some((i) => i.id === overId));
    if (!overCol) return;

    if (origColKey === overCol.key) {
      // Same-column reorder: onDragOver didn't touch cols for this, so positions are still original
      const col = cols.find((c) => c.key === origColKey)!;
      const oldIndex = col.issues.findIndex((i) => i.id === activeId);
      const newIndex = col.issues.findIndex((i) => i.id === overId);
      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = arrayMove(col.issues, oldIndex, newIndex);
        setCols((prev) => prev.map((c) => c.key === col.key ? { ...c, issues: reordered } : c));
        onMove(activeId, col.key, newIndex + 1);
      }
    } else {
      // Cross-column: card already moved optimistically in onDragOver; fire the server call
      const destCol = cols.find((c) => c.key === overCol.key)!;
      const position = destCol.issues.findIndex((i) => i.id === activeId);
      onMove(activeId, overCol.key, position >= 0 ? position + 1 : destCol.issues.length);
    }
  };

  const handleDragCancel = () => {
    isDragging.current = false;
    setActiveIssue(null);
    setActiveTargetKey(null);
    setCols(initialColumns); // restore
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
          {cols.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              projectId={projectId}
              isDragTarget={activeTargetKey === col.key}
              onAddIssue={(status) => setCreateStatus(status)}
              onCardClick={(issue) => setSelectedIssueId(issue.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeIssue ? <IssueCard issue={activeIssue} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {createStatus && (
        <IssueCreateModal
          projectId={projectId}
          sprintId={sprintId}
          defaultStatus={createStatus}
          members={members}
          onClose={() => setCreateStatus(null)}
        />
      )}

      {selectedIssueId && (
        <IssueDetailDrawer
          projectId={projectId}
          issueId={selectedIssueId}
          members={members}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
    </>
  );
}
