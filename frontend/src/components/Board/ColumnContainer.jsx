import React, { useState } from 'react';
import { useSortable, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Plus, Trash2, X, Check } from 'lucide-react';

export const ColumnContainer = ({
  column,
  tasks,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  onTaskClick,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = columnTitle.trim();
    if (finalTitle && finalTitle !== column.title) {
      onRenameColumn(column._id, finalTitle);
    }
    setIsEditingTitle(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-76 flex-shrink-0 flex flex-col bg-slate-200/50 dark:bg-slate-800/20 border border-dashed border-slate-300 dark:border-slate-700/60 rounded-2xl min-h-[500px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-76 flex-shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 max-h-[calc(100vh-12rem)] overflow-hidden shadow-sm"
    >
      {/* Column Drag Handle & Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 flex-grow min-w-0">
          {isEditingTitle ? (
            <form
              onSubmit={handleTitleSubmit}
              className="flex-grow flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                autoFocus
                className="w-full px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </form>
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className="text-xs.5 font-bold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md transition-all duration-150"
              title="Click to rename column"
            >
              {column.title}
            </h3>
          )}
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-md font-bold">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteColumn(column._id);
          }}
          className="p-1 text-slate-450 hover:text-red-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition-colors"
          title="Delete Column"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="flex-grow overflow-y-auto p-3.5 space-y-2.5 scroll-smooth">
        <SortableContext items={tasks.map((t) => t._id)}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Empty Column
            </span>
          </div>
        )}
      </div>

      {/* Column Footer Action */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/20">
        <button
          onClick={() => onAddTask(column._id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xxs font-bold uppercase tracking-wider rounded-xl border border-dashed border-slate-250 hover:border-indigo-500 dark:border-slate-800 hover:dark:border-indigo-400 text-slate-450 dark:text-slate-500 hover:text-indigo-600 hover:dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-850/80 shadow-sm transition-all duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};

export default ColumnContainer;
