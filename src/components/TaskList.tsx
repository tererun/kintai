'use client';

import { TaskItem } from '@/types';

interface TaskListProps {
  title: string;
  tasks: TaskItem[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function TaskList({ title, tasks, onRemove, onAdd }: TaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">{title}</h3>
        <button
          onClick={onAdd}
          className="group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          追加
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-[var(--muted)] text-sm">タスクがありません</p>
          <p className="text-[var(--muted)] text-xs mt-1">「追加」ボタンからタスクを追加してください</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)]/30 transition-all duration-200 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                {task.type === 'issue' && (
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
                  </svg>
                )}
                {task.type === 'pr' && (
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                  </svg>
                )}
                {task.type === 'custom' && (
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {task.url ? (
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--accent)] hover:underline truncate block"
                  >
                    {task.title}
                  </a>
                ) : (
                  <span className="text-sm font-medium truncate block">{task.title}</span>
                )}
              </div>
              
              <button
                onClick={() => onRemove(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
