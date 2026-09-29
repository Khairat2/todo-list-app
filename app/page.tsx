"use client";

import {
  startTransition,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

type TaskStatus = "To Do" | "In Progress" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Filter = "All" | TaskStatus;
type Theme = "light" | "dark";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
};

type TaskDetails = Pick<Task, "description" | "priority" | "status" | "dueDate">;
type TaskDraft = Omit<Task, "id">;

const storageKey = "todo-list-app.tasks.v1";
const themeStorageKey = "todo-list-app.theme.v1";
const statuses: TaskStatus[] = ["To Do", "In Progress", "Completed"];
const priorities: Priority[] = ["Low", "Medium", "High"];
const filters: Filter[] = ["All", ...statuses];
const blankDetails: TaskDetails = {
  description: "",
  priority: "Medium",
  status: "To Do",
  dueDate: "",
};

function isTaskStatus(value: unknown): value is TaskStatus {
  return statuses.includes(value as TaskStatus);
}

function isPriority(value: unknown): value is Priority {
  return priorities.includes(value as Priority);
}

function normalizeTask(value: unknown): Task | null {
  if (typeof value !== "object" || value === null) return null;

  const savedTask = value as Record<string, unknown>;
  if (typeof savedTask.id !== "string" || typeof savedTask.title !== "string") {
    return null;
  }

  const legacyCompleted = savedTask.completed === true;
  return {
    id: savedTask.id,
    title: savedTask.title,
    description:
      typeof savedTask.description === "string" ? savedTask.description : "",
    priority: isPriority(savedTask.priority) ? savedTask.priority : "Medium",
    status: isTaskStatus(savedTask.status)
      ? savedTask.status
      : legacyCompleted
        ? "Completed"
        : "To Do",
    dueDate:
      typeof savedTask.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(savedTask.dueDate)
        ? savedTask.dueDate
        : "",
  };
}

function statusClass(status: TaskStatus) {
  if (status === "Completed") return "status-completed";
  if (status === "In Progress") return "status-progress";
  return "status-todo";
}

function isOverdue(dueDate: string, status: TaskStatus) {
  if (!dueDate || status === "Completed") return false;

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dueDate < todayString;
}

function formatDueDate(dueDate: string, status: TaskStatus) {
  const date = new Date(`${dueDate}T00:00:00`);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return isOverdue(dueDate, status)
    ? `Overdue: ${formattedDate}`
    : `Due ${formattedDate}`;
}

type TaskDetailsFieldsProps = {
  idPrefix: string;
  values: TaskDetails;
  onChange: (field: keyof TaskDetails, value: string) => void;
};

function TaskDetailsFields({ idPrefix, values, onChange }: TaskDetailsFieldsProps) {
  return (
    <div className="task-fields">
      <label className="field-label field-description" htmlFor={`${idPrefix}-description`}>
        Description
        <textarea
          id={`${idPrefix}-description`}
          className="field-input min-h-[76px] resize-y"
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Add a few helpful details..."
          rows={2}
        />
      </label>
      <label className="field-label" htmlFor={`${idPrefix}-priority`}>
        Priority
        <select
          id={`${idPrefix}-priority`}
          className="field-input"
          value={values.priority}
          onChange={(event) => onChange("priority", event.target.value)}
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label" htmlFor={`${idPrefix}-status`}>
        Status
        <select
          id={`${idPrefix}-status`}
          className="field-input"
          value={values.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label" htmlFor={`${idPrefix}-due-date`}>
        Due date
        <input
          id={`${idPrefix}-due-date`}
          className="field-input"
          type="date"
          value={values.dueDate}
          onChange={(event) => onChange("dueDate", event.target.value)}
        />
      </label>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState<TaskDetails>(blankDetails);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaskDraft | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let initialTheme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    try {
      const savedTheme = window.localStorage.getItem(themeStorageKey);
      if (savedTheme === "light" || savedTheme === "dark") {
        initialTheme = savedTheme;
      }
    } catch {
      // Fall back to the system preference when browser storage is unavailable.
    }

    startTransition(() => setTheme(initialTheme));
  }, []);

  useEffect(() => {
    let savedTasks: Task[] = [];

    try {
      const storedTasks = window.localStorage.getItem(storageKey);
      if (storedTasks) {
        const parsedTasks: unknown = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          savedTasks = parsedTasks
            .map(normalizeTask)
            .filter((task): task is Task => task !== null);
        }
      }
    } catch {
      savedTasks = [];
    }

    startTransition(() => {
      setTasks(savedTasks);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [isLoaded, tasks]);

  const statusCounts = {
    "To Do": tasks.filter((task) => task.status === "To Do").length,
    "In Progress": tasks.filter((task) => task.status === "In Progress").length,
    Completed: tasks.filter((task) => task.status === "Completed").length,
  };
  const completionPercentage =
    tasks.length === 0 ? 0 : Math.round((statusCounts.Completed / tasks.length) * 100);
  const visibleTasks = tasks.filter(
    (task) => activeFilter === "All" || task.status === activeFilter,
  );
  const taskCreationStyle = {
    "--task-create-surface": theme === "dark" ? "#28242b" : "#ffffff",
    "--task-create-input": theme === "dark" ? "#211e24" : "#ffffff",
    "--task-create-ink": theme === "dark" ? "#f3eaf0" : "#382a30",
    "--task-create-muted": theme === "dark" ? "#c0afb7" : "#88777e",
    "--task-create-border": theme === "dark" ? "#51434c" : "#f0e1e6",
  } as CSSProperties;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setTasks((currentTasks) => [
      ...currentTasks,
      { id: crypto.randomUUID(), title, ...newDetails },
    ]);
    setNewTitle("");
    setNewDetails(blankDetails);
    setActiveFilter("All");
    setIsCreatingTask(false);
  }

  function cancelTaskCreation() {
    setNewTitle("");
    setNewDetails(blankDetails);
    setIsCreatingTask(false);
  }

  function changeStatus(taskId: string, status: TaskStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  }

  function toggleComplete(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "Completed" ? "To Do" : "Completed" }
          : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditDraft(null);
    }
  }

  function clearCompleted() {
    setTasks((currentTasks) => currentTasks.filter((task) => task.status !== "Completed"));
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Keep the selected theme for this session if browser storage is unavailable.
    }
  }

  function beginEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTaskId || !editDraft || !editDraft.title.trim()) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTaskId
          ? { ...editDraft, title: editDraft.title.trim(), id: task.id }
          : task,
      ),
    );
    setEditingTaskId(null);
    setEditDraft(null);
  }

  return (
    <main
      className="app-shell min-h-screen px-4 py-6 sm:px-8 sm:py-10"
      data-theme={theme}
    >
      <div className="mx-auto w-full max-w-[980px]">
        <header className="flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="text-sm font-bold tracking-[0.12em] text-[var(--ink)]">
              DAYMARK
            </span>
          </div>
          <div className="flex justify-end">
            <button
              className="theme-toggle"
              type="button"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
                  <path d="M16.5 3.5v3M15 5h3M20 8v2M19 9h2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <section className="pt-8 sm:pt-11">
          <div className="mb-6 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[var(--pink-dark)]">
                A LITTLE SPACE FOR YOU
              </p>
              <h1 className="page-title text-[38px] font-semibold leading-[1.08] text-[var(--ink)] sm:text-[46px]">
                Your day, gently sorted.
              </h1>
            </div>
            <span className="hidden pb-1 text-2xl text-[var(--pink-soft)] sm:block" aria-hidden="true">
              &#10022;
            </span>
          </div>

          <section className="todo-card overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_18px_54px_rgba(132,71,91,0.09)]">
            <div className="px-5 py-6 sm:px-8 sm:py-7">
              <div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Task overview
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                    {statusCounts.Completed} of {tasks.length} {tasks.length === 1 ? "task" : "tasks"} completed
                  </p>
                </div>
              </div>
              <div className="overview-metrics mt-4 grid grid-cols-3 gap-3">
                <div className="overview-metric">
                  <span className="overview-metric-count">{statusCounts["To Do"]}</span>
                  <span className="overview-metric-label">To Do</span>
                </div>
                <div className="overview-metric">
                  <span className="overview-metric-count">{statusCounts["In Progress"]}</span>
                  <span className="overview-metric-label">In Progress</span>
                </div>
                <div className="overview-metric">
                  <span className="overview-metric-count">{statusCounts.Completed}</span>
                  <span className="overview-metric-label">Completed</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[var(--pink-dark)]">
                <span>Overall progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div
                className="progress-track mt-4 h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Tasks completed"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercentage}
              >
                <div
                  className="progress-fill h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="border-y border-[var(--line)] bg-[#fffafb] px-5 py-5 sm:px-8">
              {!isCreatingTask ? (
                <button
                  className="add-task-trigger"
                  type="button"
                  onClick={() => setIsCreatingTask(true)}
                >
                  <span aria-hidden="true">+</span>
                  Add Task
                </button>
              ) : (
                <div className="task-create-panel" style={taskCreationStyle}>
                  <div className="task-create-heading">
                    <h2>Create a task</h2>
                    <p>Start with a title, then add any helpful details.</p>
                  </div>
                  <form onSubmit={addTask} className="task-create-form">
                    <label className="field-label" htmlFor="new-task-title">
                      Title
                      <input
                        id="new-task-title"
                        className="field-input"
                        type="text"
                        value={newTitle}
                        onChange={(event) => setNewTitle(event.target.value)}
                        placeholder="What would you like to get done?"
                        required
                        autoComplete="off"
                      />
                    </label>
                    <TaskDetailsFields
                      idPrefix="new-task"
                      values={newDetails}
                      onChange={(field, value) =>
                        setNewDetails((current) => ({ ...current, [field]: value }))
                      }
                    />
                    <div className="task-create-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={cancelTaskCreation}
                      >
                        Cancel
                      </button>
                      <button
                        className="add-button rounded px-5 py-2.5 text-sm font-semibold text-white"
                        type="submit"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="px-5 pb-2 pt-5 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <nav className="filter-tabs flex flex-wrap items-center gap-1" aria-label="Filter tasks">
                  {filters.map((filter) => (
                    <button
                      className={`rounded px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pink-dark)] ${
                        activeFilter === filter
                          ? "bg-[var(--pink)] text-white shadow-sm"
                          : "text-[var(--muted)] hover:bg-[#fbedf1] hover:text-[var(--pink-dark)]"
                      }`}
                      key={filter}
                      type="button"
                      aria-pressed={activeFilter === filter}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </nav>
                {statusCounts.Completed > 0 && (
                  <button
                    className="w-fit rounded px-2 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--pink-dark)] focus-visible:outline-2 focus-visible:outline-[var(--pink-dark)]"
                    type="button"
                    onClick={clearCompleted}
                  >
                    Clear completed
                  </button>
                )}
              </div>

              <ul className="mt-4 flex flex-col gap-3 pb-4">
                {!isLoaded ? (
                  <li className="py-10 text-center text-sm text-[var(--muted)]">
                    Loading your tasks...
                  </li>
                ) : visibleTasks.length > 0 ? (
                  visibleTasks.map((task) => (
                    <li className="task-card rounded-md border border-[var(--line)] bg-white p-4 sm:p-5" key={task.id}>
                      {editingTaskId === task.id && editDraft ? (
                        <form onSubmit={saveEdit} className="space-y-4">
                          <label className="field-label" htmlFor={`edit-${task.id}-title`}>
                            Task title
                            <input
                              id={`edit-${task.id}-title`}
                              className="field-input"
                              value={editDraft.title}
                              onChange={(event) =>
                                setEditDraft({ ...editDraft, title: event.target.value })
                              }
                              required
                            />
                          </label>
                          <TaskDetailsFields
                            idPrefix={`edit-${task.id}`}
                            values={editDraft}
                            onChange={(field, value) =>
                              setEditDraft({ ...editDraft, [field]: value })
                            }
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => {
                                setEditingTaskId(null);
                                setEditDraft(null);
                              }}
                            >
                              Cancel
                            </button>
                            <button className="add-button rounded px-4 py-2 text-sm font-semibold text-white" type="submit">
                              Save changes
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start gap-3">
                          <button
                            className="task-toggle mt-1 grid size-[22px] shrink-0 place-items-center rounded-full border border-[#d7b9c3] bg-white transition-colors hover:border-[var(--pink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pink-dark)]"
                            type="button"
                            aria-label={
                              task.status === "Completed"
                                ? `Mark ${task.title} as To Do`
                                : `Mark ${task.title} completed`
                            }
                            aria-pressed={task.status === "Completed"}
                            data-completed={task.status === "Completed"}
                            onClick={() => toggleComplete(task.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                              <div className="min-w-0 flex-1">
                                <h2
                                  className={`break-words text-[15px] font-semibold leading-6 ${
                                    task.status === "Completed"
                                      ? "completed-task-title line-through"
                                      : "text-[var(--ink)]"
                                  }`}
                                >
                                  {task.title}
                                </h2>
                                {task.description && (
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--muted)]">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  className="task-action"
                                  type="button"
                                  onClick={() => beginEditing(task)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="task-action hover:text-[#aa435f]"
                                  type="button"
                                  aria-label={`Delete ${task.title}`}
                                  onClick={() => deleteTask(task.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                {task.priority} priority
                              </span>
                              <label className="sr-only" htmlFor={`status-${task.id}`}>
                                Change status for {task.title}
                              </label>
                              <select
                                id={`status-${task.id}`}
                                className={`status-select ${statusClass(task.status)}`}
                                value={task.status}
                                onChange={(event) =>
                                  changeStatus(task.id, event.target.value as TaskStatus)
                                }
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              {task.dueDate && (
                                <span
                                  className={`due-badge ${
                                    isOverdue(task.dueDate, task.status) ? "due-overdue" : ""
                                  }`}
                                >
                                  {formatDueDate(task.dueDate, task.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="empty-state flex min-h-[210px] flex-col items-center justify-center rounded-md border border-dashed border-[var(--line)] bg-[#fffafb] px-5 py-10 text-center">
                    <span className="empty-mark mb-4" aria-hidden="true">
                      <span />
                    </span>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {tasks.length === 0
                        ? "A little room to begin."
                        : `No ${activeFilter.toLowerCase()} tasks right now.`}
                    </p>
                    <p className="mt-1 max-w-[300px] text-sm leading-6 text-[var(--muted)]">
                      {tasks.length === 0
                        ? "Create your first task and make today feel a little more manageable."
                        : "Choose another status filter to see more of your list."}
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}