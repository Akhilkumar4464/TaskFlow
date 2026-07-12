import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Render ghost card during drag
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-indigo-500/80 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl p-3.5 min-h-[85px]"
      />
    );
  }

  // Helper for label coloring
  const getLabelStyles = (label) => {
    switch (label.toLowerCase()) {
      case 'bug':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
      case 'feature':
        return 'bg-sky-50 text-sky-650 dark:bg-sky-950/30 dark:text-sky-400';
      case 'urgent':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-slate-800 hover:shadow-md border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all select-none space-y-2 group flex flex-col justify-between"
    >
      <div className="space-y-2">
        {/* Labels banner */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((label, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${getLabelStyles(
                  label
                )}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Task Title */}
        <h5 className="font-bold text-xs.5 text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
          {task.title}
        </h5>

        {/* Short Description */}
        {task.description && (
          <p className="text-[10px] text-slate-450 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Assignee Footer */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex justify-end items-center pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/40">
          <div className="flex -space-x-1 overflow-hidden">
            {task.assignees.map((asg) => (
              <div
                key={asg._id}
                className="h-4.5 w-4.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-850"
                title={asg.name}
              >
                {asg.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
