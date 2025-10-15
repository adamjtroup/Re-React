export function createElement(type: string, props: any, ...children: any[]) {
  return {
    type: type,
    props: {
      ...props,
      children: children.map(child => // Map through all children and convert any non-object values (primitive data) to text elements
        typeof child === "object"
          ? child
          : createTextElement(child) // Helper function to create text-based elements
      )
    }
  }
}

function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT", // Always hardcoded to be a text element
    props: { // Props values will never change between any text elements
      nodeValue: text,
      children: []
    }
  }
}