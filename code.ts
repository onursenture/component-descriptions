figma.showUI(__html__, { width: 480, height: 520 });

// Recursively find all component and component set nodes in the document
function findAllComponents(node: BaseNode): (ComponentNode | ComponentSetNode)[] {
  const components: (ComponentNode | ComponentSetNode)[] = [];

  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    components.push(node);
  }

  if ('children' in node) {
    for (const child of node.children) {
      components.push(...findAllComponents(child));
    }
  }

  return components;
}

function getAllComponents(): (ComponentNode | ComponentSetNode)[] {
  return findAllComponents(figma.root);
}

function getComponentNames(): string[] {
  const components = getAllComponents();
  return components.map(c => c.name);
}

figma.ui.onmessage = (msg) => {
  if (msg.type === 'get-components') {
    figma.ui.postMessage({
      type: 'component-names',
      names: getComponentNames()
    });
  }

  if (msg.type === 'apply-descriptions') {
    const entries: { componentName: string; description: string }[] = msg.entries;
    const allComponents = getAllComponents();
    let updated = 0;
    const notFound: string[] = [];

    for (const entry of entries) {
      // Find component by name (case-insensitive match)
      const component = allComponents.find(
        c => c.name.toLowerCase() === entry.componentName.toLowerCase()
      );

      if (component) {
        component.description = entry.description;
        updated++;
      } else {
        notFound.push(entry.componentName);
      }
    }

    figma.ui.postMessage({
      type: 'result',
      updated,
      notFound
    });
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
