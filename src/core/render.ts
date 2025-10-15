import { Fiber, createFiber, emptyFiber } from "../types/render"

function createDom(fiber: any): any {
  // Instantiate the element
  const dom =
    fiber.type == "TEXT_ELEMENT" // We still have to be considerate of primitive types here
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  // Assign the element props to the node
  const isProperty = (key: string) => key !== "children" // The children prop is handled separately, so we define a helper function here to check if the prop key is 'children'. Returns true/false
  Object.keys(fiber.props)
    .filter(isProperty) // Exclude the 'children' prop from being assigned
    .forEach(name => { // Assign each prop key-value pair to the dom element in a loop
      dom[name] = fiber.props[name]
    })

  return dom
}

const isEvent = (key: string): boolean => key.startsWith("on");
const isProperty = (key: string): boolean =>
  key !== "children" && !isEvent(key);

const isNew = (prev: Record<string, any>, next: Record<string, any>) => (key: string): boolean =>
  prev[key] !== next[key];

const isGone = (prev: Record<string, any>, next: Record<string, any>) => (key: string): boolean =>
  !(key in next);

function updateDom(
  dom: HTMLElement | Text,
  prevProps: Record<string, any>,
  nextProps: Record<string, any>
): void {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      (dom as any)[name] = ""; // Reset the property
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      (dom as any)[name] = nextProps[name]; // Assign the new property
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function commitRoot(): void {
  deletions.forEach(commitWork);
  commitWork(wipRoot?.child);
  currentRoot = wipRoot;
  wipRoot = emptyFiber;
}


function commitWork(fiber: Fiber | null): void {
  if (!fiber) {
    return;
  }

  // Get the DOM parent
  const domParent = fiber.parent?.dom;
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent?.appendChild(fiber.dom);
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate?.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent?.removeChild(fiber.dom as Node);
  }

  // Recursively commit the child and sibling fibers
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

export function render(element: any, container: HTMLElement): void {
  wipRoot = emptyFiber;
  wipRoot.dom = container;
  wipRoot.props = { children: [] };
  wipRoot.alternate = currentRoot;

  deletions = [];
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork: Fiber | null = emptyFiber;
let currentRoot: Fiber = emptyFiber;
let wipRoot: Fiber = emptyFiber;
let deletions: Fiber[] = [];

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function isNullFiber(fiber: Fiber): boolean {
  return (
    fiber.type === emptyFiber.type &&
    JSON.stringify(fiber.props) === JSON.stringify(emptyFiber.props) &&
    fiber.state === emptyFiber.state &&
    fiber.child === emptyFiber.child &&
    fiber.sibling === emptyFiber.sibling &&
    fiber.parent === emptyFiber.parent &&
    fiber.dom === emptyFiber.dom &&
    fiber.effectTag === emptyFiber.effectTag
  );
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent || emptyFiber;
    if (isNullFiber(nextFiber)) {
      return null;
    }
  }

  return null; // Explicitly return null if no next fiber is found
}

function reconcileChildren(wipFiber: Fiber, elements: any[]): void {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber = emptyFiber;

  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber: Fiber | null = null;

    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
        child: null,
        sibling: null,
        state: null,
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
        child: null,
        sibling: null,
        state: null,
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
  }
}