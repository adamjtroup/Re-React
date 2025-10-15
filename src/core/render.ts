import { Fiber, createFiber, emptyFiber } from "../types/render"

function createDOM(fiber: any): any {
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

export function render(element: any, container: HTMLElement): void {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork: any = null

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
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

function performUnitOfWork(fiber: any): Fiber {
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }

  if (fiber.return) {
    fiber.return.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = emptyFiber;

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = createFiber(element.type, element.props, fiber);

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return emptyFiber;
}