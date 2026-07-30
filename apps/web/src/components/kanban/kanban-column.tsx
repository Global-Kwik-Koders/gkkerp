'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { IssueCard } from './issue-card';
import { cn } from '@/lib/utils';
import type { Issue, IssueStatus } from '@/types';

interface Column { key: IssueStatus; label: string; color: string; issues: Issue[] }

interface Props {
  column: Column;
  projectId: string;
  isDragTarget?: boolean;  // true when this column is the current drag destination
  onAddIssue: (status: IssueStatus) => void;
  onCardClick: (issue: Issue) => void;
}

export function KanbanColumn({ column, projectId: _projectId, isDragTarget, onAddIssue, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl bg-gray-100 border border-gray-200 transition-colors',
        (isOver || isDragTarget) && 'bg-indigo-50 border-indigo-200',
      )}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
          <span className="text-sm font-semibold text-gray-700">{column.label}</span>
          <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded-full border border-gray-200">
            {column.issues.length}
          </span>
        </div>
        <button
          onClick={() => onAddIssue(column.key)}
          className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400 hover:text-gray-600"
          title={`Add issue to ${column.label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      <SortableContext items={column.issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 px-2 pb-2 min-h-[100px]">
          {column.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onCardClick={onCardClick} />
          ))}
          {column.issues.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs text-gray-400">Drop here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
