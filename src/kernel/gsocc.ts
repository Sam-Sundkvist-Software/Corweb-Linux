import { ISocAssembly, TypeKind, ISocNamespace, IGsocCache } from "../types/soc";

// Helper to create meaningful premade assemblies split by purpose
export const createPremadeAssemblies = (): Record<string, ISocAssembly> => {
  const assemblies: Record<string, ISocAssembly> = {};

  // 1. TLML.Collections (Data Structures)
  assemblies["TLML.Collections"] = {
    name: "TLML.Collections",
    version: "1.0.0.0",
    culture: "neutral",
    publicKeyToken: "col7d21a93b5a1c",
    dependencies: [
      { assemblyName: "TLML.Lang", version: "1.0.0.0" }
    ],
    namespaces: [
      {
        name: "TLML.Collections",
        fullName: "TLML.Collections",
        types: [
          {
            name: "Stack",
            fullName: "TLML.Collections.Stack",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Collections",
            baseClass: "System.Object",
            types: [],
            constants: [],
            fields: [
              { name: "_items", type: "System.Object[]", accessModifier: "Private", isStatic: false },
              { name: "_size", type: "System.Int32", accessModifier: "Private", isStatic: false }
            ],
            properties: [
              { name: "Count", type: "System.Int32", accessModifier: "Public", hasGet: true, hasSet: false, isStatic: false }
            ],
            events: [],
            methods: [
              {
                name: "Push",
                returnType: "System.Void",
                parameters: [{ name: "item", type: "System.Object" }],
                accessModifier: "Public",
                isStatic: false,
                bodySimulated: `// TLML Collections Stack.Push Implementation
.method public void Push(object item)
{
    push.field _items
    push.field _size
    push.arg item
    store.elem
    
    push.field _size
    push.const 1
    add
    store.field _size
    ret
}`
              },
              {
                name: "Pop",
                returnType: "System.Object",
                parameters: [],
                accessModifier: "Public",
                isStatic: false,
                bodySimulated: `// TLML Collections Stack.Pop Implementation
.method public object Pop()
{
    push.field _size
    push.const 1
    sub
    store.field _size

    push.field _items
    push.field _size
    push.const Null
    store.elem

    ret
}`
              },
              {
                name: "Clear",
                returnType: "System.Void",
                parameters: [],
                accessModifier: "Public",
                isStatic: false,
                bodySimulated: `// TLML Collections Stack.Clear Implementation
.method public void Clear()
{
    push.const 0
    store.field _size
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      }
    ]
  };

  // 2. TLML.Cryptography (Cryptographic Utilities)
  assemblies["TLML.Cryptography"] = {
    name: "TLML.Cryptography",
    version: "1.0.0.0",
    culture: "neutral",
    publicKeyToken: "crypto9b1a52e0bf7",
    dependencies: [
      { assemblyName: "TLML.Lang", version: "1.0.0.0" }
    ],
    namespaces: [
      {
        name: "TLML.Cryptography",
        fullName: "TLML.Cryptography",
        types: [
          {
            name: "Sha256",
            fullName: "TLML.Cryptography.Sha256",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Cryptography",
            baseClass: "System.Object",
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "ComputeHash",
                returnType: "System.String",
                parameters: [{ name: "input", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML SHA256 ComputeHash Mock Execution
.method public static string ComputeHash(string input)
{
    push.arg input
    call TLML.Lang.StringUtil.ToUpper
    store.local 0

    push.local 0
    push.const "HASHED_SHA256"
    add
    ret
}`
              }
            ]
          } as any,
          {
            name: "Aes",
            fullName: "TLML.Cryptography.Aes",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Cryptography",
            baseClass: "System.Object",
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "Encrypt",
                returnType: "System.String",
                parameters: [
                  { name: "plainText", type: "System.String" },
                  { name: "key", type: "System.String" }
                ],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML AES Encryption Mock Implementation
.method public static string Encrypt(string plainText, string key)
{
    push.arg plainText
    push.arg key
    add
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      }
    ]
  };

  // 3. TLML.Diagnostics (Tracing & Measurements)
  assemblies["TLML.Diagnostics"] = {
    name: "TLML.Diagnostics",
    version: "1.0.0.0",
    culture: "neutral",
    publicKeyToken: "diag2d1e0fc4a9d",
    dependencies: [
      { assemblyName: "TLML.Lang", version: "1.0.0.0" }
    ],
    namespaces: [
      {
        name: "TLML.Diagnostics",
        fullName: "TLML.Diagnostics",
        types: [
          {
            name: "TraceLogger",
            fullName: "TLML.Diagnostics.TraceLogger",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Diagnostics",
            baseClass: "System.Object",
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "LogInfo",
                returnType: "System.Void",
                parameters: [{ name: "message", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML TraceLogger.LogInfo Implementation
.method public static void LogInfo(string message)
{
    push.const "[INFO]: "
    push.arg message
    add
    call TLML.Lang.Console.WriteLine
    ret
}`
              },
              {
                name: "LogError",
                returnType: "System.Void",
                parameters: [{ name: "message", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML TraceLogger.LogError Implementation
.method public static void LogError(string message)
{
    push.const "[ERROR]: "
    push.arg message
    add
    call TLML.Lang.Console.WriteLine
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      }
    ]
  };

  // 4. TLML.Lang (Core System Assembly)
  assemblies["TLML.Lang"] = {
    name: "TLML.Lang",
    version: "1.0.0.0",
    culture: "neutral",
    publicKeyToken: "tlmllang7c8a91b",
    dependencies: [],
    namespaces: [
      {
        name: "TLML.Lang",
        fullName: "TLML.Lang",
        types: [
          {
            name: "Console",
            fullName: "TLML.Lang.Console",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang",
            isStatic: true,
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "WriteLine",
                returnType: "System.Void",
                parameters: [{ name: "value", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.WriteLine
.method public static void WriteLine(string value)
{
    push.arg value
    call Native.ConsoleWrite
    ret
}`
              },
              {
                name: "Write",
                returnType: "System.Void",
                parameters: [{ name: "value", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.Write
.method public static void Write(string value)
{
    push.arg value
    call Native.ConsoleWrite
    ret
}`
              },
              {
                name: "ReadLine",
                returnType: "System.String",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.ReadLine
.method public static string ReadLine()
{
    call Native.ConsoleRead
    ret
}`
              },
              {
                name: "Clear",
                returnType: "System.Void",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.Clear
.method public static void Clear()
{
    call Native.ConsoleClear
    ret
}`
              },
              {
                name: "Beep",
                returnType: "System.Void",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.Beep
.method public static void Beep()
{
    call Native.ConsoleBeep
    ret
}`
              },
              {
                name: "SetColor",
                returnType: "System.Void",
                parameters: [{ name: "color", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.SetColor
.method public static void SetColor(string color)
{
    push.arg color
    call Native.ConsoleSetColor
    ret
}`
              }
            ]
          } as any,
          {
            name: "Math",
            fullName: "TLML.Lang.Math",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang",
            isStatic: true,
            types: [],
            constants: [
              { name: "PI", type: "System.Double", value: 3.141592653589793, accessModifier: "Public" },
              { name: "E", type: "System.Double", value: 2.718281828459045, accessModifier: "Public" }
            ],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "Sqrt",
                returnType: "System.Double",
                parameters: [{ name: "d", type: "System.Double" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Sqrt
.method public static double Sqrt(double d)
{
    push.arg d
    call Native.MathSqrt
    ret
}`
              },
              {
                name: "Abs",
                returnType: "System.Double",
                parameters: [{ name: "d", type: "System.Double" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Abs
.method public static double Abs(double d)
{
    push.arg d
    call Native.MathAbs
    ret
}`
              },
              {
                name: "Pow",
                returnType: "System.Double",
                parameters: [
                  { name: "base", type: "System.Double" },
                  { name: "exponent", type: "System.Double" }
                ],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Pow
.method public static double Pow(double base, double exponent)
{
    push.arg base
    push.arg exponent
    call Native.MathPow
    ret
}`
              },
              {
                name: "Random",
                returnType: "System.Double",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Random
.method public static double Random()
{
    call Native.MathRandom
    ret
}`
              },
              {
                name: "Max",
                returnType: "System.Double",
                parameters: [
                  { name: "a", type: "System.Double" },
                  { name: "b", type: "System.Double" }
                ],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Max
.method public static double Max(double a, double b)
{
    push.arg a
    push.arg b
    call Native.MathMax
    ret
}`
              },
              {
                name: "Min",
                returnType: "System.Double",
                parameters: [
                  { name: "a", type: "System.Double" },
                  { name: "b", type: "System.Double" }
                ],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Min
.method public static double Min(double a, double b)
{
    push.arg a
    push.arg b
    call Native.MathMin
    ret
}`
              },
              {
                name: "Round",
                returnType: "System.Double",
                parameters: [{ name: "d", type: "System.Double" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Round
.method public static double Round(double d)
{
    push.arg d
    call Native.MathRound
    ret
}`
              }
            ]
          } as any,
          {
            name: "Environment",
            fullName: "TLML.Lang.Environment",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang",
            isStatic: true,
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "GetTime",
                returnType: "System.Double",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Environment.GetTime
.method public static double GetTime()
{
    call Native.EnvGetTime
    ret
}`
              },
              {
                name: "GetOSVersion",
                returnType: "System.String",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Environment.GetOSVersion
.method public static string GetOSVersion()
{
    call Native.EnvGetOSVersion
    ret
}`
              },
              {
                name: "GetCurrentUser",
                returnType: "System.String",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Environment.GetCurrentUser
.method public static string GetCurrentUser()
{
    call Native.EnvGetCurrentUser
    ret
}`
              }
            ]
          } as any,
          {
            name: "StringUtil",
            fullName: "TLML.Lang.StringUtil",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang",
            isStatic: true,
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "Concat",
                returnType: "System.String",
                parameters: [
                  { name: "a", type: "System.String" },
                  { name: "b", type: "System.String" }
                ],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard StringUtil.Concat
.method public static string Concat(string a, string b)
{
    push.arg a
    push.arg b
    call Native.StringConcat
    ret
}`
              },
              {
                name: "Length",
                returnType: "System.Double",
                parameters: [{ name: "s", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard StringUtil.Length
.method public static double Length(string s)
{
    push.arg s
    call Native.StringLength
    ret
}`
              },
              {
                name: "ToUpper",
                returnType: "System.String",
                parameters: [{ name: "s", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard StringUtil.ToUpper
.method public static string ToUpper(string s)
{
    push.arg s
    call Native.StringToUpper
    ret
}`
              },
              {
                name: "ToLower",
                returnType: "System.String",
                parameters: [{ name: "s", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard StringUtil.ToLower
.method public static string ToLower(string s)
{
    push.arg s
    call Native.StringToLower
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      },
      {
        name: "TLML.Lang.Console",
        fullName: "TLML.Lang.Console",
        types: [
          {
            name: "Console",
            fullName: "TLML.Lang.Console.Console",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang.Console",
            isStatic: true,
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "WriteLine",
                returnType: "System.Void",
                parameters: [{ name: "value", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.WriteLine
.method public static void WriteLine(string value)
{
    push.arg value
    call Native.ConsoleWrite
    ret
}`
              },
              {
                name: "Write",
                returnType: "System.Void",
                parameters: [{ name: "value", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.Write
.method public static void Write(string value)
{
    push.arg value
    call Native.ConsoleWrite
    ret
}`
              },
              {
                name: "ReadLine",
                returnType: "System.String",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.ReadLine
.method public static string ReadLine()
{
    call Native.ConsoleRead
    ret
}`
              },
              {
                name: "Clear",
                returnType: "System.Void",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.Clear
.method public static void Clear()
{
    call Native.ConsoleClear
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      },
      {
        name: "TLML.Lang.System",
        fullName: "TLML.Lang.System",
        types: [
          {
            name: "Console",
            fullName: "TLML.Lang.System.Console",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang.System",
            isStatic: true,
            types: [],
            constants: [],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "WriteLine",
                returnType: "System.Void",
                parameters: [{ name: "value", type: "System.String" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Console.WriteLine
.method public static void WriteLine(string value)
{
    push.arg value
    call Native.ConsoleWrite
    ret
}`
              }
            ]
          } as any,
          {
            name: "Math",
            fullName: "TLML.Lang.System.Math",
            kind: TypeKind.Class,
            accessModifier: "Public",
            namespaceName: "TLML.Lang.System",
            isStatic: true,
            types: [],
            constants: [
              { name: "PI", type: "System.Double", value: 3.141592653589793, accessModifier: "Public" },
              { name: "E", type: "System.Double", value: 2.718281828459045, accessModifier: "Public" }
            ],
            fields: [],
            properties: [],
            events: [],
            methods: [
              {
                name: "Sqrt",
                returnType: "System.Double",
                parameters: [{ name: "d", type: "System.Double" }],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Sqrt
.method public static double Sqrt(double d)
{
    push.arg d
    call Native.MathSqrt
    ret
}`
              },
              {
                name: "Random",
                returnType: "System.Double",
                parameters: [],
                accessModifier: "Public",
                isStatic: true,
                bodySimulated: `// TLML.Lang Standard Math.Random
.method public static double Random()
{
    call Native.MathRandom
    ret
}`
              }
            ]
          } as any
        ],
        constants: []
      }
    ]
  };

  return assemblies;
};

// Global SOC Cache initializer helper
export const initGsocCache = (): IGsocCache => {
  if (typeof window !== "undefined") {
    if (!(window as any).GSOCC) {
      (window as any).GSOCC = {
        assemblies: createPremadeAssemblies()
      };
    }
    return (window as any).GSOCC;
  }
  return { assemblies: createPremadeAssemblies() };
};
