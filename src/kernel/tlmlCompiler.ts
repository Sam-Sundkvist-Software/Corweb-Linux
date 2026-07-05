import { ISocAssembly, ISocNamespace, ISocMethod, TypeKind } from "../types/soc";
import { TlmlInstructionRegistry } from "./instructionRegistry";

// Helper for Levenshtein Distance (error suggestions)
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function findClosestMatch(target: string, possibilities: string[]): string | null {
  let bestDist = 4; // Threshold
  let bestMatch: string | null = null;
  possibilities.forEach(p => {
    const d = getLevenshteinDistance(target, p);
    if (d < bestDist) {
      bestDist = d;
      bestMatch = p;
    }
  });
  return bestMatch;
}

// System namespaces restricted list
export const SYSTEM_NAMESPACES = ["System", "TLML.Lang.System", "TLML.Lang.Console", "TLML.Lang"];

// Standard list of compiler keywords & instructions
export const TLML_INSTRUCTIONS = TlmlInstructionRegistry.getInstance().getNames();

export const TLML_DIRECTIVES = [
  ".assembly", ".version", ".import assembly", ".import namespace", ".namespace", ".class", ".method"
];

export const TLML_TYPES = [
  "void", "string", "int", "uint", "double", "float", "bool", "char", "object"
];

// Parser & Compiler Function
export function compileTLML(code: string, globalGsoc: any): { assembly: ISocAssembly | null; errors: string[] } {
  const errors: string[] = [];
  let assemblyName = "MyAssembly";
  let assemblyVersion = "1.0.0.0";
  const importedAssemblies: string[] = ["TLML.Lang"];
  const importedNamespaces: string[] = ["TLML.Lang.Console", "TLML.Lang", "TLML.Lang.System"];

  const asmRegex = /^\s*\.assembly\s+([\w\.]+)/i;
  const verRegex = /^\s*\.version\s+([\d\.]+)/i;
  const importAsmRegex = /^\s*\.import\s+assembly\s+([\w\.]+)/i;
  const importNsRegex = /^\s*\.import\s+namespace\s+([\w\.]+)/i;
  const namespaceRegex = /^\s*\.namespace\s+([\w\.]+)/i;
  const classRegex = /^\s*\.class\s+(?:public|private|internal)?\s*(?:static)?\s*([\w\.]+)/i;
  const methodRegex = /^\s*\.method\s+(public|private|protected|internal)?\s*(static)?\s*([\w\.]+)\s+([\w\.]+)\(([^)]*)\)/i;

  const fieldRegex = /^\s*\.field\s+(public|private|protected|internal)?\s*(static)?\s*([\w\.]+)\s+(\w+)/i;

  const lines = code.split("\n");
  let currentNamespace: ISocNamespace | null = null;
  let currentClass: any = null;
  let currentMethod: ISocMethod | null = null;
  let methodBodyLines: string[] = [];
  const namespaces: ISocNamespace[] = [];
  let openBrackets = 0;

  const activeGlobalAssemblies = globalGsoc ? Object.keys(globalGsoc.assemblies) : ["TLML.Lang"];

  // 1. Optimized Pre-pass to extract all local method signatures (enabling forward references without re-scanning)
  const fileLocalMethods: string[] = [];
  let preLastNamespace = "";
  let preLastClass = "";
  lines.forEach(line => {
    const commentIdx = line.indexOf("//");
    const cleanLine = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    const trimmed = cleanLine.trim();
    if (!trimmed) return;

    const nsM = trimmed.match(namespaceRegex);
    if (nsM) preLastNamespace = nsM[1];

    const clM = trimmed.match(classRegex);
    if (clM) preLastClass = clM[1];

    const methM = trimmed.match(methodRegex);
    if (methM) {
      const methName = methM[4];
      if (preLastNamespace && preLastClass) {
        fileLocalMethods.push(`${preLastNamespace}.${preLastClass}.${methName}`);
      }
      if (preLastClass) {
        fileLocalMethods.push(`${preLastClass}.${methName}`);
      }
      fileLocalMethods.push(methName);
    }
  });

  // 2. Pre-build the entire possible call targets list once to solve O(N*M) scaling issue
  const allPossibleTypes: string[] = [
    "TLML.Lang.Console.WriteLine",
    "TLML.Lang.Console.Write",
    "TLML.Lang.Console.ReadLine",
    "TLML.Lang.Console.Clear",
    "TLML.Lang.Console.Beep",
    "TLML.Lang.Console.SetColor",
    "TLML.Lang.Math.Sqrt",
    "TLML.Lang.Math.Abs",
    "TLML.Lang.Math.Pow",
    "TLML.Lang.Math.Random",
    "TLML.Lang.Math.Max",
    "TLML.Lang.Math.Min",
    "TLML.Lang.Math.Round",
    "TLML.Lang.Environment.GetTime",
    "TLML.Lang.Environment.GetOSVersion",
    "TLML.Lang.Environment.GetCurrentUser",
    "TLML.Lang.StringUtil.Concat",
    "TLML.Lang.StringUtil.Length",
    "TLML.Lang.StringUtil.ToUpper",
    "TLML.Lang.StringUtil.ToLower",
    "TLML.Lang.Console.Console.WriteLine",
    "TLML.Lang.Console.Console.Write",
    "TLML.Lang.Console.Console.ReadLine",
    "TLML.Lang.Console.Console.Clear",
    "TLML.Lang.Console.Console.Beep",
    ...fileLocalMethods
  ];

  if (globalGsoc) {
    Object.keys(globalGsoc.assemblies || {}).forEach(asmName => {
      const asm = globalGsoc.assemblies[asmName];
      if (asm && asm.namespaces) {
        asm.namespaces.forEach((ns: any) => {
          if (ns.types) {
            ns.types.forEach((t: any) => {
              if (t.methods) {
                t.methods.forEach((m: any) => {
                  allPossibleTypes.push(`${t.fullName}.${m.name}`);
                  allPossibleTypes.push(`${m.name}`);
                });
              }
            });
          }
        });
      }
    });
  }

  // 3. Main Compiler Single Pass
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Clean trailing comments and trim
    const commentIdx = line.indexOf("//");
    const cleanLine = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    const trimmed = cleanLine.trim();

    if (!trimmed) return;

    if (trimmed.includes("{")) openBrackets++;
    if (trimmed.includes("}")) {
      openBrackets--;
      if (currentMethod) {
        currentMethod.bodySimulated = methodBodyLines.join("\n");
        if (currentClass) {
          currentClass.methods.push(currentMethod);
        }
        currentMethod = null;
        methodBodyLines = [];
      } else if (currentClass && openBrackets === 1) {
        currentClass = null;
      } else if (currentNamespace && openBrackets === 0) {
        currentNamespace = null;
      }
    }

    // Compute scope at this point in iteration
    let currentScope: "ROOT" | "NAMESPACE" | "CLASS" | "METHOD" = "ROOT";
    if (currentMethod) {
      currentScope = "METHOD";
    } else if (currentClass) {
      currentScope = "CLASS";
    } else if (currentNamespace) {
      currentScope = "NAMESPACE";
    } else {
      currentScope = "ROOT";
    }

    if (asmRegex.test(trimmed)) {
      if (currentScope !== "ROOT") {
        errors.push(`Line ${lineNum}: Directive '.assembly' is only allowed at the root scope (outside of namespaces/classes).`);
        return;
      }
      const match = trimmed.match(asmRegex);
      if (match) assemblyName = match[1];
    } else if (verRegex.test(trimmed)) {
      if (currentScope !== "ROOT") {
        errors.push(`Line ${lineNum}: Directive '.version' is only allowed at the root scope.`);
        return;
      }
      const match = trimmed.match(verRegex);
      if (match) assemblyVersion = match[1];
    } else if (importAsmRegex.test(trimmed)) {
      if (currentScope !== "ROOT") {
        errors.push(`Line ${lineNum}: Directive '.import assembly' is only allowed at the root scope.`);
        return;
      }
      const match = trimmed.match(importAsmRegex);
      if (match) {
        const name = match[1];
        if (!activeGlobalAssemblies.includes(name)) {
          errors.push(`Line ${lineNum}: Referenced assembly '${name}' could not be resolved in VFS /sys/lib/ or GSOCC registry. Did you register it?`);
        } else {
          importedAssemblies.push(name);
        }
      }
    } else if (importNsRegex.test(trimmed)) {
      if (currentScope !== "ROOT") {
        errors.push(`Line ${lineNum}: Directive '.import namespace' is only allowed at the root scope.`);
        return;
      }
      const match = trimmed.match(importNsRegex);
      if (match) {
        importedNamespaces.push(match[1]);
      }
    } else if (namespaceRegex.test(trimmed)) {
      if (currentScope !== "ROOT") {
        errors.push(`Line ${lineNum}: Namespace declaration '.namespace' is only allowed at the root scope.`);
        return;
      }
      const match = trimmed.match(namespaceRegex);
      if (match) {
        const nsName = match[1];
        const isSystemAssembly = assemblyName === "TLML.Lang" || assemblyName.startsWith("TLML.Lang.");
        if (SYSTEM_NAMESPACES.includes(nsName) && !isSystemAssembly) {
          errors.push(`Line ${lineNum}: Namespace '${nsName}' is a reserved system namespace. Non-system assembly '${assemblyName}' cannot modify system namespaces.`);
        }
        currentNamespace = {
          name: nsName,
          fullName: nsName,
          types: [],
          constants: []
        };
        namespaces.push(currentNamespace);
      }
    } else if (classRegex.test(trimmed)) {
      if (currentScope !== "NAMESPACE") {
        if (currentScope === "ROOT") {
          errors.push(`Line ${lineNum}: Class declaration outside of valid namespace block.`);
        } else if (currentScope === "CLASS") {
          errors.push(`Line ${lineNum}: Nested class declarations are not supported.`);
        } else if (currentScope === "METHOD") {
          errors.push(`Line ${lineNum}: Class declaration '.class' is not allowed inside a method.`);
        }
        return;
      }
      const match = trimmed.match(classRegex);
      if (match && currentNamespace) {
        currentClass = {
          name: match[1],
          fullName: `${currentNamespace.name}.${match[1]}`,
          kind: TypeKind.Class,
          accessModifier: "Public",
          namespaceName: currentNamespace.name,
          types: [],
          constants: [],
          methods: [],
          fields: [],
          properties: [],
          events: []
        };
        currentNamespace.types.push(currentClass);
      }
    } else if (methodRegex.test(trimmed)) {
      if (currentScope !== "CLASS") {
        if (currentScope === "ROOT" || currentScope === "NAMESPACE") {
          errors.push(`Line ${lineNum}: Method declaration outside of class structure.`);
        } else if (currentScope === "METHOD") {
          errors.push(`Line ${lineNum}: Nested method declarations are not supported.`);
        }
        return;
      }
      const match = trimmed.match(methodRegex);
      if (match) {
        const modifier = match[1] || "Public";
        const isStatic = !!match[2];
        const retType = match[3];
        const name = match[4];
        const rawParams = match[5];

        const parameters = rawParams ? rawParams.split(",").map(p => {
          const pParts = p.trim().split(/\s+/);
          return {
            type: pParts[0],
            name: pParts[1] || "param"
          };
        }) : [];

        currentMethod = {
          name,
          returnType: retType,
          parameters,
          accessModifier: modifier as any,
          isStatic,
          bodySimulated: ""
        };
        methodBodyLines = [];
      }
    } else if (fieldRegex.test(trimmed)) {
      if (currentScope !== "CLASS") {
        if (currentScope === "ROOT" || currentScope === "NAMESPACE") {
          errors.push(`Line ${lineNum}: Field declaration must be inside a class.`);
        } else if (currentScope === "METHOD") {
          errors.push(`Line ${lineNum}: Fields cannot be declared inside a method. Use local variable slots instead.`);
        }
        return;
      }
      const match = trimmed.match(fieldRegex);
      if (match && currentClass) {
        const modifier = match[1] || "Public";
        const isStatic = !!match[2];
        const fType = match[3];
        const fName = match[4];
        currentClass.fields.push({
          name: fName,
          type: fType,
          accessModifier: (modifier.charAt(0).toUpperCase() + modifier.slice(1)) as any,
          isStatic
        });
      }
    } else {
      // Standalone brackets skip
      if (trimmed === "{" || trimmed === "}") return;

      if (currentScope === "METHOD") {
        methodBodyLines.push(trimmed);

        const parts = trimmed.split(/\s+/);
        const command = parts[0];
        const argValue = parts.slice(1).join(" ");

        // Correctly handle labels (e.g. `:loop_head` or `:end`)
        if (command.startsWith(":")) {
          return;
        }

        if (!TLML_INSTRUCTIONS.includes(command)) {
          errors.push(`Line ${lineNum}: Unresolved stack VM bytecode instruction operator '${command}'.`);
        } else if (command === "call") {
          let foundTarget = false;
          const callTarget = argValue.trim();

          if (allPossibleTypes.includes(callTarget)) {
            foundTarget = true;
          }

          if (!foundTarget) {
            const closest = findClosestMatch(callTarget, allPossibleTypes);
            const recommendation = closest ? `. Did you mean '${closest}'?` : "";
            errors.push(`Line ${lineNum}: Cannot resolve compilation call to target reference '${callTarget}'${recommendation}`);
          }
        }
      } else {
        // Not in METHOD scope, meaning any instruction or labels are compilation errors!
        if (trimmed.startsWith(":")) {
          errors.push(`Line ${lineNum}: Jump label '${trimmed}' must be defined inside a method body.`);
        } else {
          const parts = trimmed.split(/\s+/);
          const command = parts[0];
          if (TLML_INSTRUCTIONS.includes(command)) {
            errors.push(`Line ${lineNum}: Stack instruction '${command}' is not allowed in ${currentScope.toLowerCase()} scope. All instructions must be inside a '.method' body.`);
          } else {
            errors.push(`Line ${lineNum}: Unrecognized statement or syntax '${trimmed}' in ${currentScope.toLowerCase()} scope.`);
          }
        }
      }
    }
  });

  if (openBrackets !== 0) {
    errors.push("Compilation Error: Mismatching bracket structure. Ensure all namespaces, classes, and methods are closed properly with '}'.");
  }

  if (errors.length > 0) {
    return { assembly: null, errors };
  }

  const assemblyOutput: ISocAssembly = {
    name: assemblyName,
    version: assemblyVersion,
    culture: "neutral",
    publicKeyToken: "tuxcompile7d21a93b",
    namespaces,
    dependencies: importedAssemblies.map(name => ({ assemblyName: name, version: "1.0.0.0" }))
  };

  return { assembly: assemblyOutput, errors: [] };
}

// TLML Language Server Mock/Service
export interface TlmlCompletionItem {
  label: string;
  kind: number; // Monaco CompletionItemKind (Method=1, Function=2, Field=4, Variable=5, Class=6, Keyword=13, Snippet=25)
  insertText: string;
  detail?: string;
  documentation?: string;
}

export class TlmlLanguageServer {
  private static assemblyCache: Record<string, any> = {};
  private static instructionCache: TlmlCompletionItem[] | null = null;
  private static lastCodeImports: string = "";

  private getImportedAssemblies(code: string): string[] {
    const importAsmRegex = /^\s*\.import\s+assembly\s+([\w\.]+)/gi;
    const imports: string[] = ["TLML.Lang"]; // default
    let match;
    while ((match = importAsmRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    return Array.from(new Set(imports));
  }

  public static invalidateInstructionCache() {
    TlmlLanguageServer.instructionCache = null;
  }

  lint(code: string, globalGsoc: any): string[] {
    const { errors } = compileTLML(code, globalGsoc);
    return errors;
  }

  getHover(code: string, line: number, column: number, word: string, globalGsoc: any): { contents: { value: string }[] } | null {
    if (!word) return null;

    // 1. Check if it's a VM instruction
    const inst = TlmlInstructionRegistry.getInstance().get(word);
    if (inst) {
      return {
        contents: [
          { value: `**Instruction: \`${inst.name}\`**` },
          { value: `*Category: ${inst.category.toUpperCase()}*` },
          { value: inst.description },
          { value: inst.snippet ? `**Code Snippet:**\n\`\`\`assembly\n${inst.snippet}\n\`\`\`` : "" }
        ]
      };
    }

    // 2. Check if it's a directive
    if (word.startsWith(".")) {
      const directiveDesc: Record<string, { title: string, desc: string, syntax: string }> = {
        ".assembly": {
          title: "Assembly Declaration Directive",
          desc: "Defines the semantic name of the compiled assembly binary. This must be placed at the root level of your file.",
          syntax: ".assembly <assembly_name>"
        },
        ".version": {
          title: "Version Declaration Directive",
          desc: "Specifies the semantic version of the output assembly module.",
          syntax: ".version <major>.<minor>.<build>.<revision>"
        },
        ".import": {
          title: "Import Directive",
          desc: "Imports a dependency assembly library from GSOCC VFS (such as `TLML.Lang`) or registers a namespace mapping reference (`.import namespace Name`).",
          syntax: ".import assembly <assembly_name>\n.import namespace <namespace_path>"
        },
        ".namespace": {
          title: "Namespace Scope Directive",
          desc: "Establishes a logical grouping namespace. Code inside a namespace block must be enclosed in curly brackets `{` and `}`.",
          syntax: ".namespace <namespace_path> {\n  ...\n}"
        },
        ".class": {
          title: "Class Definition Directive",
          desc: "Defines a structured object class inside a namespace block. Classes can contain fields and executable methods.",
          syntax: ".class [public|private] [static] <class_name> {\n  ...\n}"
        },
        ".method": {
          title: "Method Definition Directive",
          desc: "Declares an executable bytecode routine inside a class structure. Encloses stacked instructions and local labels.",
          syntax: ".method [public|private] [static] <return_type> <method_name>(<params>) {\n  ...\n}"
        },
        ".field": {
          title: "Field Declaration Directive",
          desc: "Declares a class member field variable to store persistent state.",
          syntax: ".field [public|private] [static] <type> <field_name>"
        }
      };

      const key = Object.keys(directiveDesc).find(d => word.startsWith(d));
      if (key) {
        const info = directiveDesc[key];
        return {
          contents: [
            { value: `**Directive: \`${info.title}\`**` },
            { value: info.desc },
            { value: `**Syntax:**\n\`\`\`assembly\n${info.syntax}\n\`\`\`` }
          ]
        };
      }
    }

    // 3. Check local labels (starts with ':')
    if (word.startsWith(":")) {
      return {
        contents: [
          { value: `**Local Label: \`${word}\`**` },
          { value: "Marks a jump destination address offset inside the current method body. You can redirect control flow here using `jump` or `jump.false` instructions." }
        ]
      };
    }

    // 4. Standard library hover details
    const standardLibs: Record<string, string> = {
      "TLML.Lang.Console.WriteLine": "Writes a string or stack value to the standard output terminal, followed by a newline character.",
      "TLML.Lang.Console.Write": "Writes a string or value directly to the output console without appending a newline.",
      "TLML.Lang.Console.ReadLine": "Suspends execution and prompts the user for keyboard text input. Pushes the entered string onto the evaluation stack.",
      "TLML.Lang.Console.Clear": "Clears all terminal lines and resets console buffers.",
      "TLML.Lang.Console.Beep": "Generates a synthesized hardware beep alert sound via the Web Audio API.",
      "TLML.Lang.Console.SetColor": "Sets the active output console text color. Supports HTML color strings (e.g. '#10b981').",
      "TLML.Lang.Math.Sqrt": "Pops a number, computes its floating-point square root, and pushes the result onto the stack.",
      "TLML.Lang.Math.Abs": "Pops a number and returns its absolute (positive) magnitude.",
      "TLML.Lang.Math.Pow": "Pops exponent (y), pops base (x). Computes x raised to the power of y and pushes the result.",
      "TLML.Lang.Math.Random": "Pushes a pseudo-random floating-point value between 0.0 and 1.0 onto the stack.",
      "TLML.Lang.Math.Max": "Pops two numbers, evaluates which is larger, and pushes that number onto the stack.",
      "TLML.Lang.Math.Min": "Pops two numbers, evaluates which is smaller, and pushes that number onto the stack.",
      "TLML.Lang.Environment.GetTime": "Pushes a formatted string of the current machine local time onto the stack.",
      "TLML.Lang.Environment.GetOSVersion": "Pushes the current environment kernel OS version string onto the stack.",
      "TLML.Lang.Environment.GetCurrentUser": "Pushes the local shell active username ('tux') onto the stack.",
      "TLML.Lang.StringUtil.Concat": "Pops two string values, concatenates them, and pushes the combined result.",
      "TLML.Lang.StringUtil.Length": "Pops a string from the stack and pushes its total integer character count.",
      "TLML.Lang.StringUtil.ToUpper": "Pops a string, converts all alphabetic characters to uppercase, and pushes it.",
      "TLML.Lang.StringUtil.ToLower": "Pops a string, converts all alphabetic characters to lowercase, and pushes it."
    };

    if (standardLibs[word]) {
      return {
        contents: [
          { value: `**Standard Method: \`${word}\`**` },
          { value: standardLibs[word] }
        ]
      };
    }

    const partialKey = Object.keys(standardLibs).find(k => k.endsWith("." + word));
    if (partialKey) {
      return {
        contents: [
          { value: `**Standard Method: \`${partialKey}\`**` },
          { value: standardLibs[partialKey] }
        ]
      };
    }

    // 5. Look for local code declarations
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith(".method") && line.includes(word)) {
        return {
          contents: [
            { value: `**Local Method: \`${word}\`**` },
            { value: `Declared on Line ${i + 1}:\n\`\`\`assembly\n${line}\n\`\`\`` }
          ]
        };
      }
      if (line.startsWith(".class") && line.includes(word)) {
        return {
          contents: [
            { value: `**Local Class: \`${word}\`**` },
            { value: `Declared on Line ${i + 1}:\n\`\`\`assembly\n${line}\n\`\`\`` }
          ]
        };
      }
      if (line.startsWith(".field") && line.includes(word)) {
        return {
          contents: [
            { value: `**Local Field: \`${word}\`**` },
            { value: `Declared on Line ${i + 1}:\n\`\`\`assembly\n${line}\n\`\`\`` }
          ]
        };
      }
    }

    return null;
  }

  getCompletions(code: string, lineIndex: number, colIndex: number, globalGsoc: any): TlmlCompletionItem[] {
    const lines = code.split("\n");
    const currentLine = lines[lineIndex] || "";
    const trimmedLine = currentLine.trim();

    // Context analysis: What are we inside?
    let currentNamespaceName = "";
    let currentClassName = "";
    let currentMethodName = "";
    let currentMethodParams: string[] = [];
    let currentClassFields: string[] = [];

    let openBrackets = 0;
    const namespaceRegex = /^\s*\.namespace\s+([\w\.]+)/i;
    const classRegex = /^\s*\.class\s+(?:public|private|internal)?\s*(?:static)?\s*([\w\.]+)/i;
    const methodRegex = /^\s*\.method\s+(?:public|private|protected|internal)?\s*(?:static)?\s*([\w\.]+)\s+([\w\.]+)\(([^)]*)\)/i;
    const fieldRegex = /^\s*\.field\s+(?:public|private|protected|internal)?\s*(?:static)?\s*([\w\.]+)\s+(\w+)/i;

    for (let i = 0; i < lineIndex; i++) {
      const l = lines[i].trim();
      if (!l || l.startsWith("//")) continue;

      if (l.includes("{")) openBrackets++;
      if (l.includes("}")) openBrackets--;

      if (namespaceRegex.test(l)) {
        const m = l.match(namespaceRegex);
        if (m) currentNamespaceName = m[1];
      } else if (classRegex.test(l)) {
        const m = l.match(classRegex);
        if (m) currentClassName = m[1];
      } else if (methodRegex.test(l)) {
        const m = l.match(methodRegex);
        if (m) {
          currentMethodName = m[2];
          const rawParams = m[3];
          currentMethodParams = rawParams ? rawParams.split(",").map(p => {
            const parts = p.trim().split(/\s+/);
            return parts[1] || "";
          }).filter(p => p !== "") : [];
        }
      } else if (fieldRegex.test(l)) {
        const m = l.match(fieldRegex);
        if (m) {
          currentClassFields.push(m[2]);
        }
      }

      // If bracket closed completely, clear scope
      if (openBrackets === 0) {
        currentNamespaceName = "";
        currentClassName = "";
        currentMethodName = "";
        currentMethodParams = [];
        currentClassFields = [];
      } else if (openBrackets === 1) {
        currentClassName = "";
        currentMethodName = "";
        currentMethodParams = [];
        currentClassFields = [];
      } else if (openBrackets === 2) {
        currentMethodName = "";
        currentMethodParams = [];
      }
    }

    const items: TlmlCompletionItem[] = [];

    // Helper to add instruction details
    const addInstruction = (label: string, detail: string, doc: string) => {
      items.push({
        label,
        kind: 13, // Keyword
        insertText: label,
        detail,
        documentation: doc
      });
    };

    // Load explicitly imported assemblies to local cache, or reuse cache
    const currentImports = this.getImportedAssemblies(code);
    const importsKey = currentImports.sort().join(",");
    
    if (importsKey !== TlmlLanguageServer.lastCodeImports) {
      TlmlLanguageServer.assemblyCache = {};
      currentImports.forEach(asmName => {
        if (globalGsoc && globalGsoc.assemblies && globalGsoc.assemblies[asmName]) {
          TlmlLanguageServer.assemblyCache[asmName] = globalGsoc.assemblies[asmName];
        }
      });
      TlmlLanguageServer.lastCodeImports = importsKey;
    }

    // Case 1: Typing a call reference (e.g., inside method after `call `)
    if (trimmedLine.startsWith("call")) {
      // Complete standard library calls
      const calls = [
        { label: "TLML.Lang.Console.WriteLine", doc: "Writes line value to console output line buffer." },
        { label: "TLML.Lang.Console.Write", doc: "Writes character or string value to console output line buffer." },
        { label: "TLML.Lang.Console.ReadLine", doc: "Pauses stack VM to receive string value from standard input line." },
        { label: "TLML.Lang.Console.Clear", doc: "Clears diagnostics panel outputs." },
        { label: "TLML.Lang.Console.Beep", doc: "Synthesizes standard tone chime." },
        { label: "TLML.Lang.Console.SetColor", doc: "Sets console output text color (e.g. 'green', 'yellow')." },
        { label: "TLML.Lang.Math.Sqrt", doc: "Calculates the square root of popped stack value." },
        { label: "TLML.Lang.Math.Abs", doc: "Returns the absolute magnitude of popped stack value." },
        { label: "TLML.Lang.Math.Pow", doc: "Raises base to exponent (pops exponent first, then base)." },
        { label: "TLML.Lang.Math.Random", doc: "Pushes double value between 0.0 and 1.0 onto virtual stack." },
        { label: "TLML.Lang.Math.Max", doc: "Compares two popped values, pushing the higher one." },
        { label: "TLML.Lang.Math.Min", doc: "Compares two popped values, pushing the lower one." },
        { label: "TLML.Lang.Math.Round", doc: "Rounds popped float or double to nearest integer." },
        { label: "TLML.Lang.Environment.GetTime", doc: "Pushes current Unix Epoch millisecond timestamp." },
        { label: "TLML.Lang.Environment.GetOSVersion", doc: "Pushes operating system version string." },
        { label: "TLML.Lang.Environment.GetCurrentUser", doc: "Pushes active logged-in user name string." },
        { label: "TLML.Lang.StringUtil.Concat", doc: "Concatenates two popped string elements." },
        { label: "TLML.Lang.StringUtil.Length", doc: "Pushes length integer of popped string element." },
        { label: "TLML.Lang.StringUtil.ToUpper", doc: "Converts popped string to uppercase form." },
        { label: "TLML.Lang.StringUtil.ToLower", doc: "Converts popped string to lowercase form." }
      ];

      // Add standard calls
      calls.forEach(c => {
        items.push({
          label: c.label,
          kind: 1, // Method
          insertText: c.label,
          detail: "System Library Call",
          documentation: c.doc
        });
      });

      // Add local class methods defined in this file
      lines.forEach(l => {
        const mMatch = l.match(methodRegex);
        if (mMatch) {
          const mName = mMatch[2];
          items.push({
            label: mName,
            kind: 2, // Function
            insertText: mName,
            detail: "Local Method Call",
            documentation: `Invoke local method '${mName}' defined in class.`
          });
        }
      });

      // Add dynamic assemblies methods from cache
      Object.keys(TlmlLanguageServer.assemblyCache).forEach(asmName => {
        const asm = TlmlLanguageServer.assemblyCache[asmName];
        if (asm && asm.namespaces) {
          asm.namespaces.forEach((ns: any) => {
            if (ns.types) {
              ns.types.forEach((t: any) => {
                if (t.methods) {
                  t.methods.forEach((m: any) => {
                    const fullName = `${t.fullName}.${m.name}`;
                    items.push({
                      label: fullName,
                      kind: 1,
                      insertText: fullName,
                      detail: `Assembly ${asmName}`,
                      documentation: `Call referenced assembly method '${fullName}'`
                    });
                  });
                }
              });
            }
          });
        }
      });

      return items;
    }

    // Case for fields completion (e.g. push.field, store.field)
    if (trimmedLine.startsWith("push.field") || trimmedLine.startsWith("store.field")) {
      currentClassFields.forEach(f => {
        items.push({
          label: f,
          kind: 4, // Field
          insertText: f,
          detail: "Class Field",
          documentation: `Class member field variable '${f}'`
        });
      });
      return items;
    }

    // Case for local jump label completions (e.g. jump, jump.false)
    if (trimmedLine.startsWith("jump") || trimmedLine.startsWith("jump.false")) {
      const labels: string[] = [];
      lines.forEach(l => {
        const commentIdx = l.indexOf("//");
        const cleanL = commentIdx !== -1 ? l.substring(0, commentIdx) : l;
        const trimmed = cleanL.trim();
        if (trimmed.startsWith(":")) {
          labels.push(trimmed);
        }
      });
      labels.forEach(lbl => {
        items.push({
          label: lbl,
          kind: 5, // Variable / Label
          insertText: lbl,
          detail: "Local Jump Label",
          documentation: `Jump to offset marked by label '${lbl}'`
        });
      });
      return items;
    }

    // Case 2: Inside a method and requesting arguments / parameters (e.g. `push.arg ` or `store.arg `)
    if (trimmedLine.startsWith("push.arg") || trimmedLine.startsWith("store.arg")) {
      currentMethodParams.forEach(p => {
        items.push({
          label: p,
          kind: 5, // Variable
          insertText: p,
          detail: "Method Parameter",
          documentation: `Method argument variable '${p}'`
        });
      });
      return items;
    }

    // Case 3: Inside a method and requesting local registers (e.g. `push.local ` or `store.local `)
    if (trimmedLine.startsWith("push.local") || trimmedLine.startsWith("store.local")) {
      // Offer generic local slot options
      for (let i = 0; i < 5; i++) {
        items.push({
          label: String(i),
          kind: 5, // Variable
          insertText: String(i),
          detail: `Local Variable Register [${i}]`,
          documentation: `Stack frame virtual local register slot ${i}.`
        });
      }
      return items;
    }

    // Case 4: Inside a method body
    if (currentMethodName !== "") {
      // Load instructions into cache if not present
      if (!TlmlLanguageServer.instructionCache) {
        TlmlLanguageServer.instructionCache = TlmlInstructionRegistry.getInstance().getAll().map(inst => ({
          label: inst.name,
          kind: 13, // Keyword
          insertText: inst.snippet || inst.name,
          detail: `[${inst.category.toUpperCase()}] Instruction`,
          documentation: inst.description
        }));
      }
      
      items.push(...TlmlLanguageServer.instructionCache);
      return items;
    }

    // Case 5: Inside class body
    if (currentClassName !== "") {
      items.push({
        label: ".method",
        kind: 13,
        insertText: ".method public static void Main()\n{\n    ret\n}",
        detail: "Method declaration snippet",
        documentation: "Declare a new compiled method instruction stream."
      });
      items.push({
        label: ".field",
        kind: 13,
        insertText: ".field private int myField",
        detail: "Field declaration snippet"
      });
      return items;
    }

    // Case 6: Inside namespace body
    if (currentNamespaceName !== "") {
      items.push({
        label: ".class",
        kind: 13,
        insertText: ".class public Program\n{\n    \n}",
        detail: "Class structure block declaration"
      });
      return items;
    }

    // Case 7: Outside any scope (assembly definitions)
    items.push({
      label: ".assembly",
      kind: 13,
      insertText: ".assembly MyCompiledCode",
      detail: "Define current assembly output name."
    });
    items.push({
      label: ".version",
      kind: 13,
      insertText: ".version 1.0.0.0",
      detail: "Define assembly semantic version."
    });
    items.push({
      label: ".import assembly",
      kind: 13,
      insertText: ".import assembly TLML.Lang",
      detail: "Import dependency assembly library from GSOCC cache."
    });
    items.push({
      label: ".import namespace",
      kind: 13,
      insertText: ".import namespace TLML.Lang.Console",
      detail: "Import namespace path mappings helper."
    });
    items.push({
      label: ".namespace",
      kind: 13,
      insertText: ".namespace MyCustomApp\n{\n    \n}",
      detail: "Declare workspace container namespace scope."
    });

    return items;
  }
}
