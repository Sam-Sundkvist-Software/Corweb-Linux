export enum ProcessState {
  RUNNING = "RUNNING",
  SUSPENDED = "SUSPENDED",
  ZOMBIE = "ZOMBIE",
  SERVICE = "SERVICE",
}

export interface OSUser {
  username: string;
  passwordHash?: string;
  role: string;
  fullName: string;
  avatar: string;
}

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  dependencies: string[];
  author: string;
  icon?: string;
  path?: string;
  pathType?: "web" | "internal";
}

export interface SystemSettings {
  hostname?: string;
  networking_enabled?: boolean;
  system_sound?: boolean;
  syslog_verbosity?: string;
  allow_regular_user_system_writes?: boolean;
  restrict_process_kill?: boolean;
  allow_guest_terminal?: boolean;
  simulated_cpu_threads?: number;
  kernel_panic_on_missing_sysconfig?: boolean;
  custom_wallpaper_color_1?: string;
  custom_wallpaper_color_2?: string;
  virtual_memory_enabled?: boolean;
  swap_file_size?: number;
  swappiness_factor?: number;
  ram_size_allocated?: number;
  cache_eviction_policy?: string;
  current_desktop_theme?: string;
  font_preset?: string;
  window_bevel_style?: string;
  pointer_cursor_enforcement?: boolean;
  show_desktop_grid?: boolean;
  daemon_flag_editor_enabled?: boolean;
  daemon_file_crawler_enabled?: boolean;
  daemon_cron_scheduler_enabled?: boolean;
  daemon_audio_synth_enabled?: boolean;
  boot_log_verbose?: boolean;
  shutdown_grace_seconds?: number;
  [customKey: string]: unknown;
}

export interface Process {
  pid: number;
  name: string;
  state: ProcessState;
  owner: string;
  memoryUsage: number; // in KB
  cpuUsage: number; // percentage
  logs: string[];
  startTime: number;
  isBackground: boolean;
  onSysCall?: (callName: string, args: unknown) => void;
  args?: string[];
  cwd?: string;
  onStarted?: () => void;
  onStopped?: () => void;
}

export enum NodeType {
  FILE = "FILE",
  DIRECTORY = "DIRECTORY",
}

export interface VFSNode {
  name: string;
  type: NodeType;
  createdAt: number;
  content?: string; // for files
  children?: { [key: string]: VFSNode }; // for directories
}

export interface DiskState {
  root: VFSNode;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  zIndex: number;
  args?: string[];
  cwd?: string;
  parentWindowId?: string;
  dialogData?: DialogInstance;
}

export interface DialogInstance {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "question" | "input" | "import";
  ownerWindowId?: string; // If present, the corresponding WindowFrame is disabled
  options?: string[]; // Buttons (e.g., ["OK"], ["Yes", "No"], etc.)
  inputValue?: string; // If type is "input", can hold initial/current value
  onClose?: (result: unknown) => void;
}

export interface DaemonService {
  name: string;
  description: string;
  status: "active" | "inactive" | "failed";
  pid: number | null;
  logs: string[];
}

export interface SystemCallInterface {
  pid: number;
  // File operations
  readFile: (filePath: string) => string;
  writeFile: (filePath: string, content: string) => boolean;
  createDirectory: (dirPath: string) => boolean;
  deleteNode: (nodePath: string) => boolean;
  listDir: (dirPath: string) => { name: string; type: NodeType }[];
  getCurrentUser: () => string;
  getCurrentUserRole: () => string;
  // Authentication & account system
  loginUser: (username: string, passwordHash: string) => boolean;
  logoutUser: () => void;
  getSettings: () => SystemSettings;
  saveSettings: (settings: SystemSettings) => boolean;
  getUsers: () => OSUser[];
  addUser: (username: string, passwordHash: string, role: string, fullName: string, avatar: string) => boolean;
  deleteUser: (username: string) => boolean;
  triggerKernelPanic: (message: string) => void;
  // Process operations
  getProcesses: () => { pid: number; name: string; state: string; memoryUsage: number; cpuUsage: number; owner: string; args?: string[]; cwd?: string }[];
  spawnProcess: (name: string, isBackground: boolean, args?: string[], cwd?: string) => number;
  killProcess: (pid: number) => boolean;
  suspendProcess?: (pid: number) => boolean;
  resumeProcess?: (pid: number) => boolean;
  spawnCustomProcess?: (name: string, owner: string, memory: number, cpu: number, isService: boolean) => number;
  // Systemd operations
  getServices: () => DaemonService[];
  controlService: (name: string, action: "start" | "stop" | "restart") => boolean;
  // Logging
  syslog: (message: string) => void;
  getLogs: () => string[];
  // Window Dialog operations
  openDialog?: (
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "question" | "input" | "import",
    options?: string[],
    onClose?: (result: unknown) => void,
    initialInputVal?: string
  ) => string;
  closeDialog?: (id: string, result: unknown) => void;
}
