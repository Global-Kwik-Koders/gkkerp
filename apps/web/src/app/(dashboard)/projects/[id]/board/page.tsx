'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi, sprintsApi } from '@/lib/api';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { ISSUE_STATUS_COLUMNS, type Issue } from '@/types';
import toast from 'react-hot-toast';

export default function BoardPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: sprints = [] } = useQuery({ queryKey: ['sprints', projectId], queryFn: () => sprintsApi.list(projectId) });
  const activeSprint = sprints.find((s: any) => s.status === 'active');

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', projectId, activeSprint?.id],
    queryFn: () => issuesApi.list(projectId, activeSprint?.id),
    enabled: !!projectId,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: string; position: number }) =>
      issuesApi.move(projectId, id, { status, position }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues', projectId] }),
    onError: () => toast.error('Failed to move issue'),
  });

  const columns = ISSUE_STATUS_COLUMNS.map((col) => ({
    ...col,
    issues: (issues as Issue[]).filter((i) => i.status === col.key).sort((a, b) => a.position - b.position),
  }));

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {activeSprint ? activeSprint.name : 'Kanban Board'}
        </h1>
        {activeSprint && (
          <div className="text-sm text-gray-500">
            {activeSprint.start_date} → {activeSprint.end_date}
          </div>
        )}
      </div>
      <KanbanBoard
        columns={columns}
        onMove={(issueId, status, position) => moveMutation.mutate({ id: issueId, status, position })}
        projectId={projectId}
        sprintId={activeSprint?.id}
      />
    </div>
  );
}
