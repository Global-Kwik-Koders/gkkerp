'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { sprintsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  projectId: string;
  onClose: () => void;
}

export function SprintCreateModal({ projectId, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', goal: '', start_date: '', end_date: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      sprintsApi.create(projectId, {
        name: form.name,
        goal: form.goal || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        status: 'planning',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success('Sprint created');
      onClose();
    },
    onError: () => toast.error('Failed to create sprint'),
  });

  const field =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); form.name.trim() && mutate(); }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Create Sprint</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Sprint Name *</label>
            <input
              autoFocus
              value={form.name}
              onChange={field('name')}
              placeholder="Sprint 2"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Sprint Goal</label>
            <input
              value={form.goal}
              onChange={field('goal')}
              placeholder="What do you want to achieve in this sprint?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={field('start_date')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={field('end_date')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!form.name.trim() || isPending}
            className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Sprint'}
          </button>
        </div>
      </form>
    </div>
  );
}
