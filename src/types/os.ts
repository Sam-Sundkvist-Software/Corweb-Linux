export enum ProcessState {
  RUNNING = "RUNNING",
  SUSPENDED = "SUSPENDED",
  ZOMBIE = "ZOMBIE",
  SERVICE = "SERVICE",
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
  onSysCall?: (callName: string, args: any) => void;
  args?: string[];
  cwd?: string;
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
}

export interface DialogInstance {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "question" | "input" | "import";
  ownerWindowId?: string; // If present, the corresponding WindowFrame is disabled
  options?: string[]; // Buttons (e.g., ["OK"], ["Yes", "No"], etc.)
  inputValue?: string; // If type is "input", can hold initial/current value
  onClose?: (result: any) => void;
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
  getSettings: () => any;
  saveSettings: (settings: any) => boolean;
  getUsers: () => any[];
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
    onClose?: (result: any) => void,
    initialInputVal?: string
  ) => string;
  closeDialog?: (id: string, result: any) => void;
}
