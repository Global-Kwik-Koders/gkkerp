'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Bug, CheckSquare, BookOpen, Zap } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { PRIORITY_CONFIG, type Issue } from '@/types';

const TYPE_ICON = { bug: Bug, task: CheckSquare, story: BookOpen, epic: Zap };
const TYPE_COLOR = { bug: 'text-red-500', task: 'text-blue-500', story: 'text-green-500', epic: 'text-purple-500' };

interface Props {
  issue: Issue;
  isDragging?: boolean;
  onCardClick?: (issue: Issue) => void;
}

export function IssueCard({ issue, isDragging, onCardClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: issue.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = TYPE_ICON[issue.type];
  const priority = PRIORITY_CONFIG[issue.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-100 select-none flex items-stretch group',
        (isDragging || isSortDragging) && 'opacity-40 shadow-lg',
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="px-1.5 flex items-center opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity text-gray-300 hover:text-gray-500 shrink-0"
      >
        <GripVertical size={14} />
      </div>

      {/* Clickable card body */}
      <div
        className="flex-1 p-3 cursor-pointer min-w-0"
        onClick={() => onCardClick?.(issue)}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className={cn('mt-0.5 shrink-0', TYPE_COLOR[issue.type])}>
            <Icon size={14} />
          </div>
          <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{issue.title}</p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priority.color }} />
            <span className="text-xs text-gray-400">{priority.label}</span>
            {issue.story_points != null && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{issue.story_points}pt</span>
            )}
          </div>
          {issue.assignee_name && (
            <div
              className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0"
              title={issue.assignee_name}
            >
              {getInitials(issue.assignee_name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
