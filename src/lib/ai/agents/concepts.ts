export interface ConceptNode {
  id: string;
  label: string;
  kind:
    | "core"
    | "requirement"
    | "concept"
    | "missing"
    | "action";
  description: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  relation:
    | "requires"
    | "leads to"
    | "defines"
    | "unclear";
}

export interface ConceptAnalysis {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}


export function analyzeConcepts(
  text: string
): ConceptAnalysis {

  const nodes: ConceptNode[] = [];

  const edges: ConceptEdge[] = [];


  const id = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-");


  const addNode = (
    label: string,
    kind: ConceptNode["kind"],
    description: string
  ) => {
    nodes.push({
      id: id(label),
      label,
      kind,
      description,
    });
  };


  addNode(
    "Main Goal",
    "core",
    "The final outcome the user wants to achieve."
  );


  const sentences = text
    .split(/[.!?]/)
    .filter(Boolean);


  const goal =
    sentences[0] ??
    text;


  addNode(
    goal.slice(0, 40),
    "concept",
    "Primary task detected from the user's input."
  );


  edges.push({
    from: "main-goal",
    to: id(goal.slice(0,40)),
    relation: "defines",
  });


  if (
    text.includes("don't know") ||
    text.includes("do not know") ||
    text.includes("not sure")
  ) {

    addNode(
      "Missing Understanding",
      "missing",
      "The user lacks clarity about the next step."
    );


    edges.push({
      from: id(goal.slice(0,40)),
      to: "missing-understanding",
      relation: "unclear",
    });


    addNode(
      "Define the first decision",
      "action",
      "Choose the smallest decision that unlocks progress."
    );


    edges.push({
      from: "missing-understanding",
      to: "define-the-first-decision",
      relation: "leads to",
    });
  }


  addNode(
    "Requirements",
    "requirement",
    "Things needed before execution."
  );


  edges.push({
    from: id(goal.slice(0,40)),
    to: "requirements",
    relation: "requires",
  });


  return {
    nodes,
    edges,
  };
}
