import React, { createContext, useContext, useMemo, forwardRef } from "react";

// Definitions of rules and style values
export interface StyleRegistry {
  [selector: string]: React.CSSProperties;
}

export interface StyleSystemContextType {
  rules: StyleRegistry;
  inheritedProps: React.CSSProperties;
}

// Create core Context for standard rules and active inherited props representing active JS overrides
export const StyleSystemContext = createContext<StyleSystemContextType>({
  rules: {},
  inheritedProps: {},
});

export const CSS_PROPERTIES_SET = new Set([
  "alignContent", "alignItems", "alignSelf", "aspectRatio", "background", "backgroundColor",
  "backgroundImage", "backgroundPosition", "backgroundRepeat", "backgroundSize", "border",
  "borderBottom", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius",
  "borderBottomStyle", "borderBottomWidth", "borderColor", "borderLeft", "borderLeftColor",
  "borderLeftStyle", "borderLeftWidth", "borderRadius", "borderRight", "borderRightColor",
  "borderRightStyle", "borderRightWidth", "borderStyle", "borderTop", "borderTopColor",
  "borderTopLeftRadius", "borderTopRightRadius", "borderTopStyle", "borderTopWidth", "borderWidth",
  "bottom", "boxShadow", "boxSizing", "clear", "clip", "color", "columnCount", "columnGap",
  "columnRule", "columns", "content", "cursor", "display", "flex", "flexBasis", "flexDirection",
  "flexFlow", "flexGrow", "flexShrink", "flexWrap", "float", "font", "fontFamily", "fontSize",
  "fontSizeAdjust", "fontStretch", "fontStyle", "fontVariant", "fontWeight", "gap", "grid",
  "gridArea", "gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridColumn", "gridColumnEnd",
  "gridColumnGap", "gridColumnStart", "gridRow", "gridRowEnd", "gridRowGap", "gridRowStart",
  "gridTemplate", "gridTemplateAreas", "gridTemplateColumns", "gridTemplateRows", "height",
  "justifyContent", "justifyItems", "justifySelf", "left", "letterSpacing", "lineHeight",
  "listStyle", "margin", "marginBottom", "marginLeft", "marginRight", "marginTop", "maxHeight",
  "maxWidth", "minHeight", "minWidth", "opacity", "order", "outline", "overflow", "overflowX",
  "overflowY", "padding", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop",
  "pointerEvents", "position", "quotes", "resize", "right", "rotate", "rowGap", "scale",
  "scrollBehavior", "textAlign", "textDecoration", "textIndent", "textOverflow", "textShadow",
  "textTransform", "top", "transform", "transition", "userSelect", "verticalAlign", "visibility",
  "whiteSpace", "width", "wordBreak", "wordSpacing", "wordWrap", "writingMode", "zIndex"
]);

// Helper to filter style properties versus other attributes
export function extractStyleProps(props: any): { styleProps: React.CSSProperties; otherProps: any } {
  const styleProps: any = {};
  const otherProps: any = {};

  for (const key of Object.keys(props)) {
    if (CSS_PROPERTIES_SET.has(key)) {
      styleProps[key] = props[key];
    } else {
      otherProps[key] = props[key];
    }
  }

  return { styleProps, otherProps };
}

// Main Style Provider Component
export function TlnxStyleProvider({
  rules = {},
  inheritedProps = {},
  children,
}: {
  rules?: StyleRegistry;
  inheritedProps?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const parent = useContext(StyleSystemContext);

  const merged = useMemo(() => {
    const mergedRules = { ...parent.rules };
    
    // Deeply merge incoming selector rules
    Object.keys(rules).forEach((key) => {
      mergedRules[key] = {
        ...mergedRules[key],
        ...rules[key],
      };
    });

    return {
      rules: mergedRules,
      inheritedProps: {
        ...parent.inheritedProps,
        ...inheritedProps,
      },
    };
  }, [parent, rules, inheritedProps]);

  return (
    <StyleSystemContext.Provider value={merged}>
      {children}
    </StyleSystemContext.Provider>
  );
}

// Hook to resolve style definitions for any given selector name
export function useStyleSystem(
  tagName: string,
  className?: string,
  id?: string,
  styleProps?: React.CSSProperties,
  inlineStyle?: React.CSSProperties
): { resolvedStyle: React.CSSProperties; nextInheritedProps: React.CSSProperties } {
  const { rules, inheritedProps } = useContext(StyleSystemContext);

  const { resolvedStyle, nextInheritedProps } = useMemo(() => {
    // 1. Inherited baseline propagates down until changed
    let resolved: React.CSSProperties = { ...inheritedProps };

    // 2. Class-based rules propagate to children. We resolve class selectors from rules (lowest priority classes)
    if (className) {
      const classes = className.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        const clsSelector = `.${cls}`;
        if (rules[clsSelector]) {
          resolved = { ...resolved, ...rules[clsSelector] };
        }
      }
    }

    // 3. Tagname selector rules, e.g. "div", "button"
    if (tagName && rules[tagName]) {
      resolved = { ...resolved, ...rules[tagName] };
    }

    // 4. ID selector rule, e.g. "#win-x"
    if (id) {
      const idSelector = `#${id}`;
      if (rules[idSelector]) {
        resolved = { ...resolved, ...rules[idSelector] };
      }
    }

    // 5. Incoming style props overrides passed manually to the TSX element
    if (styleProps) {
      resolved = { ...resolved, ...styleProps };
    }

    // 6. Inline style attribute overrides (ultimate element-level priority)
    if (inlineStyle) {
      resolved = { ...resolved, ...inlineStyle };
    }

    return {
      resolvedStyle: resolved,
      nextInheritedProps: resolved, // Children inside this element inherit these resolved styles
    };
  }, [rules, inheritedProps, tagName, className, id, styleProps, inlineStyle]);

  return { resolvedStyle, nextInheritedProps };
}

// Define the generic type for Tlnx element factories
export type TlnxElementProps<E extends React.ElementType> = {
  as?: E;
  children?: React.ReactNode;
} & React.CSSProperties & Omit<React.ComponentPropsWithRef<E>, "as" | "style"> & {
  style?: React.CSSProperties;
};

// Create a component that automatically merges systems styles and sets provider
const TlnxElementInternal = <E extends React.ElementType = "div">(
  props: TlnxElementProps<E>,
  ref: React.Ref<any>
) => {
  const { as: Component = "div", className, id, children, style, ...remaining } = props;
  const { styleProps, otherProps } = extractStyleProps(remaining);

  const tagName = typeof Component === "string" ? Component : "";
  const { resolvedStyle, nextInheritedProps } = useStyleSystem(tagName, className, id, styleProps, style);

  // Re-emit context values so children can inherit the updated values
  const nextContextValue = useMemo(() => {
    return {
      rules: {}, // Rules are already merged on parent provider
      inheritedProps: nextInheritedProps,
    };
  }, [nextInheritedProps]);

  return (
    <Component ref={ref} className={className} id={id} style={resolvedStyle} {...otherProps}>
      <StyleSystemContext.Provider value={nextContextValue}>
        {children}
      </StyleSystemContext.Provider>
    </Component>
  );
};

// Export the generic TSX wrapper component
export const TlnxElement = forwardRef(TlnxElementInternal);

// Create handy Tag factories (e.g. Tlnx.div, Tlnx.button, etc.)
type TlnxFactory = {
  [K in keyof React.JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
    Omit<React.ComponentPropsWithRef<K>, "style"> & React.CSSProperties & { style?: React.CSSProperties }
  >;
};

const tagNames = [
  "div", "span", "button", "input", "select", "p", "h1", "h2", "h3", "label",
  "form", "main", "header", "footer", "aside", "section", "textarea", "a", "img"
] as const;

export const Tlnx = {} as TlnxFactory;

tagNames.forEach((tag) => {
  (Tlnx as any)[tag] = forwardRef((props: any, ref: any) => {
    return <TlnxElement as={tag} ref={ref} {...props} />;
  });
});
