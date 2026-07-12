import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import useBoardStore from '../../store/useBoardStore';
import useAuthStore from '../../store/useAuthStore';
import { useSocket } from '../../context/SocketContext';
import ColumnContainer from './ColumnContainer';
import Modal from '../Common/Modal';
import { Plus, Trash2, Tag, UserPlus, FileText } from 'lucide-react';

export const KanbanBoard = () => {
  const {
    activeBoard,
    moveTaskLocal,
    reorderColumnsLocal,
    createColumn,
    updateColumnTitle,
    deleteColumn,
    createTask,
    updateTaskDetails,
    deleteTask,
  } = useBoardStore();

  const { emitBoardUpdate } = useSocket();
  const { user } = useAuthStore();

  // Modal and state management for Tasks
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskLabels, setTaskLabels] = useState([]);
  const [taskAssignees, setTaskAssignees] = useState([]);

  // State for Column creation
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // State for Task creation
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Configure PointerSensor so drag starts after moving 8 pixels.
  // This allows buttons, inputs, and text selection clicks inside containers to fire.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!activeBoard) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-8 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500">
        <FolderKanbanIcon className="h-16 w-16 mb-4 text-indigo-500/40 animate-pulse" />
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Welcome to TaskFlow
        </h2>
        <p className="text-xs text-slate-450 mt-1 max-w-sm text-center">
          Create or select a board from the sidebar to organize your workflows in real-time.
        </p>
      </div>
    );
  }

  // Handle Drag & Drop Ends
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // A. Dragging Columns
    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      const activeIdx = activeBoard.columns.findIndex((c) => c._id === activeId);
      const overIdx = activeBoard.columns.findIndex((c) => c._id === overId);

      const updatedIds = [...activeBoard.columns.map((c) => c._id)];
      const [movedColId] = updatedIds.splice(activeIdx, 1);
      updatedIds.splice(overIdx, 0, movedColId);

      reorderColumnsLocal(activeBoard._id, updatedIds, activeIdx, overIdx);
      emitBoardUpdate('column:reordered', { boardId: activeBoard._id });
      return;
    }

    // B. Dragging Tasks
    const taskId = activeId;
    let sourceCol = null;
    let sourceIdx = -1;

    // Locate source
    activeBoard.columns.forEach((col) => {
      const idx = col.tasks.findIndex((t) => t._id === taskId);
      if (idx !== -1) {
        sourceCol = col;
        sourceIdx = idx;
      }
    });

    if (!sourceCol) return;

    let destCol = null;
    let destIdx = -1;

    // Resolve destination
    const columnOver = activeBoard.columns.find((col) => col._id === overId);
    if (columnOver) {
      destCol = columnOver;
      destIdx = columnOver.tasks.length;
    } else {
      activeBoard.columns.forEach((col) => {
        const idx = col.tasks.findIndex((t) => t._id === overId);
        if (idx !== -1) {
          destCol = col;
          destIdx = idx;
        }
      });
    }

    if (!destCol) return;

    moveTaskLocal(taskId, sourceCol._id, destCol._id, sourceIdx, destIdx);
    emitBoardUpdate('task:moved', { taskId, fromCol: sourceCol._id, toCol: destCol._id });
  };

  // Add Column Submit
  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    await createColumn(newColumnTitle.trim(), activeBoard._id);
    emitBoardUpdate('column:created', { title: newColumnTitle });
    setNewColumnTitle('');
    setIsCreatingColumn(false);
  };

  // Add Task Initiation
  const triggerAddTask = (colId) => {
    setTargetColumnId(colId);
    setIsCreatingTask(true);
  };

  // Add Task Submit
  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !targetColumnId) return;

    await createTask(newTaskTitle.trim(), '', [], activeBoard._id, targetColumnId);
    emitBoardUpdate('task:created', { colId: targetColumnId });
    setNewTaskTitle('');
    setIsCreatingTask(false);
  };

  // Task click opens details modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskLabels(task.labels || []);
    setTaskAssignees(task.assignees?.map((a) => a._id) || []);
    setIsTaskModalOpen(true);
  };

  // Task Edit Submit
  const handleTaskUpdate = async () => {
    if (!selectedTask) return;
    const updated = await updateTaskDetails(
      selectedTask._id,
      taskTitle.trim(),
      taskDesc.trim(),
      taskLabels,
      taskAssignees
    );
    if (updated) {
      emitBoardUpdate('task:updated', { taskId: selectedTask._id });
    }
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  // Task Delete
  const handleTaskDelete = async () => {
    if (!selectedTask) return;
    await deleteTask(selectedTask._id);
    emitBoardUpdate('task:deleted', { taskId: selectedTask._id });
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  // Labels list
  const availableLabels = ['Bug', 'Feature', 'Urgent'];

  // Board users (owner + members)
  const boardUsers = activeBoard
    ? [activeBoard.owner, ...activeBoard.members]
    : [];

  const handleLabelToggle = (label) => {
    setTaskLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleAssigneeToggle = (userId) => {
    setTaskAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-6">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Kanban Horizontal Columns Scroll Pane */}
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 items-start select-none">
          <SortableContext
            items={activeBoard.columns.map((c) => c._id)}
            strategy={horizontalListSortingStrategy}
          >
            {activeBoard.columns.map((column) => (
              <ColumnContainer
                key={column._id}
                column={column}
                tasks={column.tasks || []}
                onAddTask={triggerAddTask}
                onDeleteColumn={async (colId) => {
                  await deleteColumn(colId);
                  emitBoardUpdate('column:deleted', { colId });
                }}
                onRenameColumn={async (colId, title) => {
                  await updateColumnTitle(colId, title);
                  emitBoardUpdate('column:updated', { colId });
                }}
                onTaskClick={handleTaskClick}
              />
            ))}
          </SortableContext>

          {/* Add Column Button */}
          {isCreatingColumn ? (
            <form
              onSubmit={handleAddColumn}
              className="w-76 flex-shrink-0 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"
            >
              <input
                type="text"
                placeholder="Column Title..."
                required
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingColumn(false)}
                  className="px-3 py-1.5 text-xxs font-bold uppercase tracking-wider rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xxs font-bold uppercase tracking-wider rounded-lg bg-indigo-650 text-white hover:bg-indigo-750"
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingColumn(true)}
              className="w-76 flex-shrink-0 flex items-center justify-center gap-1.5 py-4 border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-400 hover:dark:border-indigo-400/80 rounded-2xl text-slate-450 dark:text-slate-500 hover:text-indigo-600 hover:dark:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-all duration-150"
            >
              <Plus className="h-4.5 w-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Add Column
              </span>
            </button>
          )}
        </div>
      </DndContext>

      {/* Task Creation Modal */}
      <Modal
        isOpen={isCreatingTask}
        onClose={() => setIsCreatingTask(false)}
        title="Add New Task"
      >
        <form onSubmit={handleAddTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design landing page"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-indigo-600 text-white hover:bg-indigo-755 shadow-md shadow-indigo-600/10"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details / Edit Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Task Editor"
      >
        {selectedTask && (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Title</span>
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-805 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Description</span>
              </label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={3}
                placeholder="Add detail description for this task..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-805 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              />
            </div>

            {/* Labels selection */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
                <Tag className="h-3.5 w-3.5" />
                <span>Labels</span>
              </label>
              <div className="flex gap-2">
                {availableLabels.map((lbl) => {
                  const isActive = taskLabels.includes(lbl);
                  return (
                    <button
                      key={lbl}
                      onClick={() => handleLabelToggle(lbl)}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xxs font-extrabold uppercase tracking-wider border transition-all ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 hover:dark:bg-slate-800'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Members Assignment */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Assign Members</span>
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {boardUsers.map((bu) => {
                  const isAssigned = taskAssignees.includes(bu._id);
                  return (
                    <button
                      key={bu._id}
                      onClick={() => handleAssigneeToggle(bu._id)}
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-2 text-xxs font-semibold rounded-lg border transition-all ${
                        isAssigned
                          ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 text-indigo-750 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-805 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{bu.name} ({bu.email})</span>
                      {isAssigned && <span className="text-[9px] font-bold">Assigned</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <button
                onClick={handleTaskDelete}
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xxs uppercase tracking-wider border border-rose-200/50 dark:border-rose-900/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Task</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-450 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold rounded-xl text-xxs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTaskUpdate}
                  type="button"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xxs uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Internal icon helper to prevent missing imports
const FolderKanbanIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h10" />
    <path d="M7 12h10" />
    <path d="M7 17h10" />
  </svg>
);

export default KanbanBoard;
