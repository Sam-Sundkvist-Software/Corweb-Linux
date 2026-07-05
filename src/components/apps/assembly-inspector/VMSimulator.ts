import { ManagedVirtualMachine } from "../../../kernel/mvm";

export interface VMState {
  pc: number;
  instructions: string[];
  stack: string[];
  vars: Record<string, string>;
  logs: string[];
  isCompleted: boolean;
}

export function parseTLMLInstructions(bodyText: string): string[] {
  const rawLines = bodyText.split("\n");
  const parsed: string[] = [];
  rawLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("//") && trimmed !== "{" && trimmed !== "}") {
      parsed.push(trimmed);
    }
  });
  return parsed;
}

export function initialVMState(methodName: string, bodyText: string): VMState {
  const instructions = parseTLMLInstructions(bodyText);
  return {
    pc: 0,
    instructions,
    stack: [],
    vars: {},
    logs: [`[System VIRTUAL CPU Core Initialized] Loaded method '${methodName}'. Ready to step.`],
    isCompleted: false
  };
}

export function stepTLML(state: VMState): VMState {
  const vm = new ManagedVirtualMachine();
  
  // Reconstruct MVM state
  vm.state = {
    pc: state.pc,
    instructions: state.instructions,
    stack: state.stack,
    vars: state.vars,
    args: {},
    logs: [],
    isCompleted: state.isCompleted,
    hasError: false
  };

  vm.step();

  // Return new VMState mapped from MVM
  return {
    pc: vm.state.pc,
    instructions: vm.state.instructions,
    stack: vm.state.stack,
    vars: vm.state.vars,
    logs: [...state.logs, ...vm.state.logs],
    isCompleted: vm.state.isCompleted || vm.state.pc >= vm.state.instructions.length
  };
}
