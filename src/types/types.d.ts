// Global types for Re-React
declare global {
  interface Rereact {
    createElement: (type: string, props: any, ...children: any[]) => any;
    render: (element: any, container: HTMLElement) => void;
  }
}

export { };