import React from "react";
import { 
  Boxes, 
  Braces, 
  Shapes, 
  Box, 
  List, 
  BoxSelect, 
  Wrench, 
  ChevronsLeftRight, 
  Zap, 
  Briefcase, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Lock, 
  Link, 
  Mail, 
  Activity,
  Hexagon
} from "lucide-react";
import { 
  ISocAssembly, 
  ISocNamespace, 
  ISocType, 
  ISocMethod, 
  ISocProperty, 
  ISocField, 
  ISocEvent, 
  ISocConstant, 
  TypeKind 
} from "../../../types/soc";

interface TreeViewProps {
  cache: Record<string, ISocAssembly>;
  expandedNodes: Record<string, boolean>;
  toggleNode: (id: string) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  searchQuery: string;
}

export const TreeView: React.FC<TreeViewProps> = ({
  cache,
  expandedNodes,
  toggleNode,
  selectedItem,
  setSelectedItem,
  searchQuery
}) => {

  const getModifierIcon = (mod?: string, isSpecial?: boolean) => {
    if (isSpecial) return <span title="Special Signature"><Activity className="w-3 h-3 text-red-500 shrink-0" /></span>;
    if (!mod) return null;
    switch (mod.toLowerCase()) {
      case "private":
        return <span title="Private"><Lock className="w-3 h-3 text-gray-500 shrink-0" /></span>;
      case "protected":
        return <span title="Protected"><Link className="w-3 h-3 text-blue-500 shrink-0" /></span>;
      case "internal":
        return <span title="Internal"><Mail className="w-3 h-3 text-amber-500 shrink-0" /></span>;
      default:
        return null;
    }
  };

  const typeMatchesSearch = (type: ISocType): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (type.name.toLowerCase().includes(query)) return true;
    
    // Check members
    const classType = type as any;
    if (classType.methods?.some((m: any) => m.name.toLowerCase().includes(query))) return true;
    if (classType.fields?.some((f: any) => f.name.toLowerCase().includes(query))) return true;
    if (classType.properties?.some((p: any) => p.name.toLowerCase().includes(query))) return true;
    if (classType.events?.some((e: any) => e.name.toLowerCase().includes(query))) return true;
    if (classType.constants?.some((c: any) => c.name.toLowerCase().includes(query))) return true;

    return false;
  };

  const namespaceHasMatches = (ns: ISocNamespace): boolean => {
    if (!searchQuery) return true;
    return ns.types.some(typeMatchesSearch);
  };

  const renderRow = ({
    level,
    hasChildren,
    isExpanded,
    onToggle,
    isSelected,
    onClick,
    icon,
    label,
    modifier,
    isSpecial
  }: {
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    isSelected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    modifier?: string;
    isSpecial?: boolean;
  }) => {
    return (
      <div 
        className={`relative flex items-center py-1 group hover:bg-[#ebebe7] cursor-pointer min-w-0 pr-1 select-none transition-colors duration-100 ${
          isSelected ? "bg-blue-100 text-blue-900 font-semibold border-r-2 border-r-blue-600" : "text-gray-800"
        }`}
        style={{ paddingLeft: `${level * 14 + 4}px` }}
        onClick={onClick}
      >
        {/* Visual guide vertical dashed/dotted lines */}
        {Array.from({ length: level }).map((_, idx) => (
          <div
            key={idx}
            style={{ left: `${idx * 14 + 10}px` }}
            className="absolute top-0 bottom-0 w-[1px] border-l border-dotted border-gray-300 pointer-events-none"
          />
        ))}

        {/* Chevron tree expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="tree-btn w-4 h-4 flex items-center justify-center mr-0.5 shrink-0 z-10 hover:bg-gray-200 rounded transition-all cursor-pointer text-gray-500 hover:text-black"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Label, Icon & Modifiers */}
        <div className="flex items-center space-x-1.5 min-w-0 flex-1 pl-0.5 z-10">
          <span className="shrink-0">{icon}</span>
          {getModifierIcon(modifier, isSpecial)}
          <span className="truncate select-none text-[11px] font-mono tracking-tight leading-none">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-0.5 relative py-1">
      {Object.values(cache).map((asm) => {
        const asmId = `asm_${asm.name}`;
        const isAsmExpanded = !!expandedNodes[asmId];
        const isAsmSelected = selectedItem.type === "assembly" && selectedItem.assemblyName === asm.name;

        return (
          <div key={asm.name} className="space-y-0.5">
            {/* Assembly Root Row */}
            {renderRow({
              level: 1,
              hasChildren: true,
              isExpanded: isAsmExpanded,
              onToggle: () => toggleNode(asmId),
              isSelected: isAsmSelected,
              onClick: () => setSelectedItem({ type: "assembly", assemblyName: asm.name }),
              icon: <Boxes className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
              label: asm.name,
              modifier: undefined,
              isSpecial: false
            })}

            {/* Assembly Children */}
            {isAsmExpanded && (
              <div className="space-y-0.5">
                {/* References Leaf */}
                {renderRow({
                  level: 2,
                  hasChildren: false,
                  isExpanded: false,
                  onToggle: () => {},
                  isSelected: selectedItem.type === "references" && selectedItem.assemblyName === asm.name,
                  onClick: () => setSelectedItem({ type: "references", assemblyName: asm.name }),
                  icon: <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
                  label: "References",
                  modifier: undefined,
                  isSpecial: false
                })}

                {/* Namespaces */}
                {asm.namespaces.map((ns) => {
                  if (!namespaceHasMatches(ns)) return null;
                  const nsId = `ns_${asm.name}_${ns.name}`;
                  const isNsExpanded = !!expandedNodes[nsId];
                  const isNsSelected = selectedItem.type === "namespace" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name;

                  return (
                    <div key={ns.name} className="space-y-0.5">
                      {renderRow({
                        level: 2,
                        hasChildren: true,
                        isExpanded: isNsExpanded,
                        onToggle: () => toggleNode(nsId),
                        isSelected: isNsSelected,
                        onClick: () => setSelectedItem({ type: "namespace", assemblyName: asm.name, namespaceName: ns.name }),
                        icon: <Braces className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
                        label: ns.name.split('.').pop() || ns.name,
                        modifier: undefined,
                        isSpecial: false
                      })}

                      {/* Namespace Types */}
                      {isNsExpanded && (
                        <div className="space-y-0.5">
                          {ns.types.map((type) => {
                            if (!typeMatchesSearch(type)) return null;
                            const typeId = `type_${asm.name}_${ns.name}_${type.name}`;
                            const isTypeExpanded = !!expandedNodes[typeId];
                            const isTypeSelected = selectedItem.type === "type" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name;

                            // Determine icon for type
                            let typeIcon = <Shapes className="w-3.5 h-3.5 text-blue-600 shrink-0" />; // Default Class
                            if (type.kind === TypeKind.Interface) {
                              typeIcon = <ChevronsLeftRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
                            } else if (type.kind === TypeKind.Enum) {
                              typeIcon = <List className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
                            } else if (type.kind === TypeKind.Struct) {
                              typeIcon = <Hexagon className="w-3.5 h-3.5 text-cyan-600 shrink-0" />;
                            } else if (type.kind === TypeKind.Delegate) {
                              typeIcon = <Briefcase className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
                            }

                            const isComplexType = type.kind === TypeKind.Class || type.kind === TypeKind.Struct;

                            return (
                              <div key={type.name} className="space-y-0.5">
                                {renderRow({
                                  level: 3,
                                  hasChildren: isComplexType,
                                  isExpanded: isTypeExpanded,
                                  onToggle: () => toggleNode(typeId),
                                  isSelected: isTypeSelected,
                                  onClick: () => setSelectedItem({ type: "type", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name }),
                                  icon: typeIcon,
                                  label: type.name,
                                  modifier: type.accessModifier,
                                  isSpecial: (type as any).isSpecial
                                })}

                                {/* Type Members */}
                                {isTypeExpanded && isComplexType && (
                                  <div className="space-y-0.5">
                                    {/* Constants */}
                                    {((type as any).constants || []).map((c: ISocConstant) => (
                                      <div key={c.name}>
                                        {renderRow({
                                          level: 4,
                                          hasChildren: false,
                                          isExpanded: false,
                                          onToggle: () => {},
                                          isSelected: selectedItem.type === "constant" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name && selectedItem.name === c.name,
                                          onClick: () => setSelectedItem({ type: "constant", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name, name: c.name }),
                                          icon: <BoxSelect className="w-3 h-3 text-[#75507b] shrink-0" />, // cuboid
                                          label: c.name,
                                          modifier: c.accessModifier,
                                          isSpecial: false
                                        })}
                                      </div>
                                    ))}

                                    {/* Fields */}
                                    {((type as any).fields || []).map((f: ISocField) => (
                                      <div key={f.name}>
                                        {renderRow({
                                          level: 4,
                                          hasChildren: false,
                                          isExpanded: false,
                                          onToggle: () => {},
                                          isSelected: selectedItem.type === "field" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name && selectedItem.name === f.name,
                                          onClick: () => setSelectedItem({ type: "field", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name, name: f.name }),
                                          icon: <BoxSelect className="w-3 h-3 text-indigo-600 shrink-0" />, // cuboid/field
                                          label: f.name,
                                          modifier: f.accessModifier,
                                          isSpecial: (f as any).isSpecial
                                        })}
                                      </div>
                                    ))}

                                    {/* Properties */}
                                    {((type as any).properties || []).map((p: ISocProperty) => (
                                      <div key={p.name}>
                                        {renderRow({
                                          level: 4,
                                          hasChildren: false,
                                          isExpanded: false,
                                          onToggle: () => {},
                                          isSelected: selectedItem.type === "property" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name && selectedItem.name === p.name,
                                          onClick: () => setSelectedItem({ type: "property", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name, name: p.name }),
                                          icon: <Wrench className="w-3 h-3 text-sky-600 shrink-0" />,
                                          label: p.name,
                                          modifier: p.accessModifier,
                                          isSpecial: false
                                        })}
                                      </div>
                                    ))}

                                    {/* Events */}
                                    {((type as any).events || []).map((e: ISocEvent) => (
                                      <div key={e.name}>
                                        {renderRow({
                                          level: 4,
                                          hasChildren: false,
                                          isExpanded: false,
                                          onToggle: () => {},
                                          isSelected: selectedItem.type === "event" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name && selectedItem.name === e.name,
                                          onClick: () => setSelectedItem({ type: "event", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name, name: e.name }),
                                          icon: <Zap className="w-3 h-3 text-yellow-500 shrink-0" />,
                                          label: e.name,
                                          modifier: e.accessModifier,
                                          isSpecial: false
                                        })}
                                      </div>
                                    ))}

                                    {/* Methods */}
                                    {((type as any).methods || []).map((m: ISocMethod) => (
                                      <div key={m.name}>
                                        {renderRow({
                                          level: 4,
                                          hasChildren: false,
                                          isExpanded: false,
                                          onToggle: () => {},
                                          isSelected: selectedItem.type === "method" && selectedItem.assemblyName === asm.name && selectedItem.namespaceName === ns.name && selectedItem.typeName === type.name && selectedItem.name === m.name,
                                          onClick: () => setSelectedItem({ type: "method", assemblyName: asm.name, namespaceName: ns.name, typeName: type.name, name: m.name }),
                                          icon: <Box className="w-3 h-3 text-emerald-600 shrink-0" />,
                                          label: `${m.name}()`,
                                          modifier: m.accessModifier,
                                          isSpecial: (m as any).isSpecial
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
