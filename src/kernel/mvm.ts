import { ISocAssembly, ISocMethod } from "../types/soc";
import { TlmlInstructionRegistry } from "./instructionRegistry";

export interface MvmState {
  pc: number;
  instructions: string[];
  stack: string[];
  vars: Record<string, string>;
  args: Record<string, string>;
  logs: string[];
  isCompleted: boolean;
  hasError: boolean;
}

export class ManagedVirtualMachine {
  state: MvmState;
  onBeep?: () => void;
  onSetColor?: (color: string) => void;
  onReadLine?: () => string;

  constructor() {
    this.state = this.getInitialState();
  }

  getInitialState(): MvmState {
    return {
      pc: 0,
      instructions: [],
      stack: [],
      vars: {},
      args: {},
      logs: [],
      isCompleted: false,
      hasError: false
    };
  }

  loadMethod(methodName: string, bodyText: string, initialArgs: Record<string, string> = {}) {
    const rawLines = bodyText.split("\n");
    const instructions: string[] = [];
    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("//") && trimmed !== "{" && trimmed !== "}") {
        instructions.push(trimmed);
      }
    });

    this.state = {
      pc: 0,
      instructions,
      stack: [],
      vars: {},
      args: initialArgs,
      logs: [`[MVM] Virtual CPU loaded '${methodName}'. Instructions count: ${instructions.length}`],
      isCompleted: false,
      hasError: false
    };
  }

  step() {
    if (this.state.isCompleted || this.state.hasError) return;
    if (this.state.pc >= this.state.instructions.length) {
      this.state.isCompleted = true;
      this.state.logs.push("[MVM] Program reached end (RET implicit).");
      return;
    }

    const currentLine = this.state.instructions[this.state.pc];
    const cleanLine = currentLine.trim();

    this.state.logs.push(`PC[${String(this.state.pc).padStart(3, "0")}]: ${cleanLine}`);
    let newPC = this.state.pc + 1;

    if (cleanLine.startsWith(":")) {
      // Label declaration, skip
      this.state.pc = newPC;
      return;
    }

    const parts = cleanLine.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    try {
      const registry = TlmlInstructionRegistry.getInstance();
      const inst = registry.get(cmd);
      if (inst) {
        const result = inst.execute(this, arg);
        if (typeof result === "number") {
          newPC = result;
        }
      } else {
        throw new Error(`Unknown instruction '${cmd}'`);
      }
    } catch (e: any) {
      this.state.hasError = true;
      this.state.logs.push(`[MVM Error] ${e.message}`);
    }

    this.state.pc = newPC;
  }

  findLabelPC(labelName: string): number {
    const cleanLabel = labelName.startsWith(":") ? labelName : `:${labelName}`;
    return this.state.instructions.findIndex(line => line.trim() === cleanLabel);
  }

  executeCall(callTarget: string) {
    const target = callTarget.trim();
    if (target.includes("Console.WriteLine") || target === "Native.ConsoleWrite") {
      const popped = this.state.stack.pop() || "";
      const text = String(popped).replace(/"/g, "");
      this.state.logs.push(`[Console.Out] ${text}`);
    } else if (target.includes("Console.Write")) {
      const popped = this.state.stack.pop() || "";
      const text = String(popped).replace(/"/g, "");
      const lastIdx = this.state.logs.length - 1;
      if (lastIdx >= 0 && this.state.logs[lastIdx].startsWith("[Console.Out] ")) {
        this.state.logs[lastIdx] += text;
      } else {
        this.state.logs.push(`[Console.Out] ${text}`);
      }
    } else if (target.includes("Console.ReadLine") || target === "Native.ConsoleRead") {
      let inputVal = "tux_input";
      if (this.onReadLine) {
        inputVal = this.onReadLine();
      } else {
        try {
          const prompted = window.prompt("Enter console input:");
          if (prompted !== null) inputVal = prompted;
        } catch {}
      }
      this.state.stack.push(`"${inputVal}"`);
      this.state.logs.push(`[Console.In] Read: "${inputVal}"`);
    } else if (target.includes("Console.Clear") || target === "Native.ConsoleClear") {
      this.state.logs = this.state.logs.filter(l => !l.startsWith("[Console.Out]"));
    } else if (target.includes("Console.Beep")) {
      if (this.onBeep) {
        this.onBeep();
      } else {
        this.state.logs.push(`[Console.Out] *BEEP*`);
      }
    } else if (target.includes("Console.SetColor")) {
      const color = (this.state.stack.pop() || "").replace(/"/g, "");
      if (this.onSetColor) {
        this.onSetColor(color);
      } else {
        this.state.logs.push(`[Console.Out] (Text color set to: ${color})`);
      }
    } else if (target.includes("Math.Sqrt") || target === "Native.MathSqrt") {
      if (this.state.stack.length > 0) {
        const val = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(isNaN(Math.sqrt(val)) ? 0 : Math.sqrt(val)));
      }
    } else if (target.includes("Math.Abs")) {
      if (this.state.stack.length > 0) {
        const val = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(isNaN(Math.abs(val)) ? 0 : Math.abs(val)));
      }
    } else if (target.includes("Math.Pow")) {
      if (this.state.stack.length >= 2) {
        const exponent = parseFloat(this.state.stack.pop()!);
        const base = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(isNaN(Math.pow(base, exponent)) ? 0 : Math.pow(base, exponent)));
      }
    } else if (target.includes("Math.Random") || target === "Native.MathRandom") {
      this.state.stack.push(String(Math.random()));
    } else if (target.includes("Math.Max")) {
      if (this.state.stack.length >= 2) {
        const b = parseFloat(this.state.stack.pop()!);
        const a = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(Math.max(a, b)));
      }
    } else if (target.includes("Math.Min")) {
      if (this.state.stack.length >= 2) {
        const b = parseFloat(this.state.stack.pop()!);
        const a = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(Math.min(a, b)));
      }
    } else if (target.includes("Math.Round")) {
      if (this.state.stack.length > 0) {
        const val = parseFloat(this.state.stack.pop()!);
        this.state.stack.push(String(Math.round(val)));
      }
    } else if (target.includes("Environment.GetTime")) {
      this.state.stack.push(String(Date.now()));
    } else if (target.includes("Environment.GetOSVersion")) {
      this.state.stack.push('"TrashLinux v0.04a-stable"');
    } else if (target.includes("Environment.GetCurrentUser")) {
      this.state.stack.push('"tux"');
    } else if (target.includes("StringUtil.Concat")) {
      if (this.state.stack.length >= 2) {
        const b = String(this.state.stack.pop()!).replace(/"/g, "");
        const a = String(this.state.stack.pop()!).replace(/"/g, "");
        this.state.stack.push(`"${a}${b}"`);
      }
    } else if (target.includes("StringUtil.Length")) {
      if (this.state.stack.length > 0) {
        const s = String(this.state.stack.pop()!).replace(/"/g, "");
        this.state.stack.push(String(s.length));
      }
    } else if (target.includes("StringUtil.ToUpper")) {
      if (this.state.stack.length > 0) {
        const s = String(this.state.stack.pop()!).replace(/"/g, "");
        this.state.stack.push(`"${s.toUpperCase()}"`);
      }
    } else if (target.includes("StringUtil.ToLower")) {
      if (this.state.stack.length > 0) {
        const s = String(this.state.stack.pop()!).replace(/"/g, "");
        this.state.stack.push(`"${s.toLowerCase()}"`);
      }
    } else {
      this.state.stack.push(`ResultOf_${target.split(".").pop() || "call"}`);
    }
  }
}
