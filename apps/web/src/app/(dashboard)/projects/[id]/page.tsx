'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, sprintsApi } from '@/lib/api';
import Link from 'next/link';
import { LayoutGrid, ListTodo, FileText, BarChart2, Settings, CircleDot } from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => projectsApi.get(id) });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints', id], queryFn: () => sprintsApi.list(id) });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <p className="text-gray-500">Project not found</p>;

  const activeSprint = sprints.find((s: any) => s.status === 'active');

  const tabs = [
    { label: 'Issues', href: `/projects/${id}/issues`, icon: CircleDot },
    { label: 'Board', href: `/projects/${id}/board`, icon: LayoutGrid },
    { label: 'Backlog', href: `/projects/${id}/backlog`, icon: ListTodo },
    { label: 'Docs', href: `/projects/${id}/docs`, icon: FileText },
    { label: 'Analytics', href: `/projects/${id}/analytics`, icon: BarChart2 },
    { label: 'Settings', href: `/projects/${id}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{project.icon || '📁'}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>}
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full capitalize ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{project.status}</span>
      </div>

      {activeSprint && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Active Sprint</p>
            <p className="text-indigo-900 font-semibold">{activeSprint.name}</p>
            {activeSprint.goal && <p className="text-indigo-700 text-sm mt-0.5">{activeSprint.goal}</p>}
          </div>
          <Link href={`/projects/${id}/board`} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700">Open Board</Link>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-t-lg transition-colors border-b-2 border-transparent hover:border-primary-500">
            <Icon size={15} /> {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Sprints ({sprints.length})</h2>
        {sprints.length === 0 ? (
          <p className="text-gray-400 text-sm">No sprints yet</p>
        ) : (
          <div className="space-y-2">
            {sprints.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  {s.goal && <p className="text-xs text-gray-500 mt-0.5">{s.goal}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${s.status === 'active' ? 'bg-green-100 text-green-700' : s.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
