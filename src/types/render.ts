export type Fiber = {
  type: string;
  props: any;
  state: any;
  child: Fiber | null;
  sibling: Fiber | null;
  parent: Fiber | null;
  dom: HTMLElement | Text | null;
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
}

// Since this is TypeScript, we can't assign values to a null object
// Instead, we create an "empty" fiber object to represent the absence of a fiber
// So, if the fiber is empty, logically that means it's null
export const emptyFiber: Fiber = {
  type: "",
  props: {},
  state: null,
  child: null,
  sibling: null,
  parent: null,
  dom: null,
  effectTag: undefined,
};

export const createFiber = (type: string, props: any, parent: Fiber | null): Fiber => ({
  type,
  props,
  parent,
  dom: null,
  child: null,
  sibling: null,
  state: null,
  effectTag: undefined,
});