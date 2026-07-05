export enum TypeKind {
  Class = "Class",
  Interface = "Interface",
  Enum = "Enum",
  Struct = "Struct",
  Delegate = "Delegate"
}

export interface ISocConstant {
  name: string;
  type: string;
  value: any;
  accessModifier: "Public" | "Private" | "Protected" | "Internal";
}

export interface ISocType {
  name: string;
  fullName: string;
  kind: TypeKind;
  accessModifier: "Public" | "Internal";
  isStatic?: boolean;
  namespaceName: string;
}

// Allows Types and Constants. 
export interface ITypeContainer {
  types: ISocType[];
  constants: ISocConstant[];
}

export interface ISocField {
  name: string;
  type: string;
  accessModifier: "Public" | "Private" | "Protected" | "Internal";
  isStatic: boolean;
  isReadonly?: boolean;
}

export interface ISocProperty {
  name: string;
  type: string;
  accessModifier: "Public" | "Private" | "Protected" | "Internal";
  hasGet: boolean;
  hasSet: boolean;
  isStatic: boolean;
}

export interface ISocMethod {
  name: string;
  returnType: string;
  parameters: { name: string; type: string }[];
  accessModifier: "Public" | "Private" | "Protected" | "Internal";
  isStatic: boolean;
  isVirtual?: boolean;
  isAbstract?: boolean;
  bodySimulated?: string; // pseudocode instructions for assembly inspector
}

export interface ISocEvent {
  name: string;
  handlerType: string;
  accessModifier: "Public" | "Private" | "Protected" | "Internal";
  isStatic: boolean;
}

// Allows methods, fields, properties, events etc.
export interface IInstanceContainer {
  methods: ISocMethod[];
  fields: ISocField[];
  properties: ISocProperty[];
  events: ISocEvent[];
}

// IClass extends ITypeContainer and IInstanceContainer
export interface IClass extends ISocType, ITypeContainer, IInstanceContainer {
  baseClass?: string;
  implementedInterfaces?: string[];
  isAbstract?: boolean;
  isSealed?: boolean;
}

export interface IInterface extends ISocType {
  implementedInterfaces?: string[];
  methods: ISocMethod[];
  properties: ISocProperty[];
}

export interface IEnum extends ISocType, ITypeContainer {
  underlyingType: string;
}

export interface IStruct extends ISocType, ITypeContainer, IInstanceContainer {
}

// Allows only static content
export interface IStaticContainer extends ITypeContainer {
  staticMethods: ISocMethod[];
  staticFields: ISocField[];
  staticProperties: ISocProperty[];
  staticEvents: ISocEvent[];
}

// Namespace implements ITypeContainer.
// A namespace belongs to ITypeContainer (technically nesting types)
export interface ISocNamespace extends ITypeContainer {
  name: string;
  fullName: string;
}

export interface ISocAssembly {
  name: string;
  version: string;
  culture: string;
  publicKeyToken: string;
  namespaces: ISocNamespace[];
  dependencies: { assemblyName: string; version: string }[];
}

// Global SOC Cache (GSOCC)
export interface IGsocCache {
  assemblies: Record<string, ISocAssembly>;
}
