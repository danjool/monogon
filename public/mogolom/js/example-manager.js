// Example Manager for Mermaid Diagram Optimizer
// Manages loading and switching between example diagrams

// Collection of example diagrams
const exampleDiagrams = [
  {
    id: 'mogolom-architecture',
    name: 'MOGOLOM Architecture',
    description: 'Actual file structure and relationships in MOGOLOM',
    code: `flowchart TD

    
    parseFlow["parse-flow.js.parse()"]
    treeToMermaid["flow-tree-to-mmd.js.convert()"]
    scrambleFlow["flow-scrambler.js.scramble()"]
    CodeEditor["textarea#code-editor"]
    DiagramDiv["div#diagram.mermaid"]
    StatsDiv["div.optimization-stats"]
    OptimizeBtn["button#optimize-btn"]
    ExamplesBtn["button.examples-btn"]
    DiagramDiv --> BetterDiagram
    MessyDiagram -->|"Leads to"| Confusion["😱 Confusion"]
    parseFlow -->|"Tree"| scrambleFlow
    calculateScore -->|"Edge Crossings"| findIntersections
    markIntersections -->|"Highlighted SVG"| DiagramDiv
    findIntersections --> markIntersections
    treeToMermaid -->|"New Code"| tempContainer
    CodeEditor --> renderWithMermaid
    DiagramDiv -->|"SVG"| calculateScore
    scrambleFlow -->|"Shuffled Tree"| treeToMermaid
    calculateScore -->|"Node Overlaps"| findOverlaps
    Templates -->|"Sets"| CodeEditor
    findOverlaps --> markIntersections
    DiagramDiv --> MessyDiagram
    CodeEditor -->|"Mermaid Code"| parseFlow
    calculateScore -->|"Stats"| StatsDiv
    OptimizeBtn --> startOptimization
    startOptimization -->|"Controls"| scrambleFlow
    calculateScore -->|"Guides"| scrambleFlow
    ExamplesBtn --> loadExample
    loadExample -->|"Loads"| Templates
    User -->|"Pastes Code"| CodeEditor
    renderWithMermaid -->|"SVG"| DiagramDiv
    BetterDiagram -->|"Enables"| Understanding["😊 Understanding"]
    Confusion --> User
    Understanding --> User
    User -->|"Clicks"| OptimizeBtn
subgraph renderer["mermaid-renderer.js"]
    renderWithMermaid["render()"]
    markIntersections["markIntersections()"]
end
subgraph mogolom["mogolom.js"]
    direction LR
    startOptimization
    stopOptimization
    analyzeDiagram
end
subgraph examples["example-manager.js"]
    loadExample["loadExampleDiagram()"]
    Templates["exampleDiagrams[]
                            • Architecture
                            • Vector Space
                            • Software Patterns"]
end
subgraph analyzer["svg-analyzer.js"]
    calculateScore["calculateDiagramScore()"]
    findOverlaps["findNodeOverlaps()"]
    findIntersections["findEdgeIntersections()"]
end
User -->|"Picks"| ExamplesBtn`
  },
  {
    id: 'syntax-showcase',
    name: 'Syntax Showcase',
    description: 'Comprehensive example of all Mermaid flowchart syntax elements',
    code: `flowchart TD
    
    defaultNode[Default Node - Rectangle]
    roundNode(Round Node)
    stadiumNode([Stadium Node])
    subroutineNode[[Subroutine Node]]
    cylindricalNode[(Cylindrical Node)]
    circleNode((Circle Node))
    asymmetricNode>Asymmetric Node]
    rhombusNode{Rhombus Node}
    hexagonNode{{Hexagon Node}}
    parallelogramNode[/Parallelogram Node/]
    parallelogramAltNode[\\Parallelogram Alt Node\\]
    trapezoidNode[/Trapezoid Node\\]
    trapezoidAltNode[\\Trapezoid Alt Node/]
    doubleCircleNode(((Double Circle Node)))
    
    defaultNode --> roundNode
    roundNode --- stadiumNode
    stadiumNode -.-> subroutineNode
    subroutineNode -.- cylindricalNode
    cylindricalNode ==> circleNode
    circleNode === asymmetricNode
    asymmetricNode --o rhombusNode
    rhombusNode --x hexagonNode
    hexagonNode o--o parallelogramNode
    parallelogramNode x--x parallelogramAltNode
    parallelogramAltNode <--> trapezoidNode
    trapezoidNode <===> trapezoidAltNode
    trapezoidAltNode <-.-> doubleCircleNode
    
    defaultNode -->|Arrow with text| hexagonNode
    roundNode ---|Line with text| parallelogramNode
    stadiumNode -.-|Dotted with text| trapezoidNode
    cylindricalNode ==|Thick with text|==> doubleCircleNode
    
    %% rhombusNode ~~~ circleNode
    
    chainStart --> chainMiddle --> chainEnd
    multiStart --> multiEnd1 & multiEnd2
    
    subgraph mainGraph["Main Graph"]
        direction LR
        
        subgraph subGraph1["Sub-Graph Level 1"]
            direction RL
            
            subgraph subGraph2["Sub-Graph Level 2"]
                direction TB
                
                subgraph subGraph3["Sub-Graph Level 3"]
                    direction BT
                    deepNode1[Deep Node 1]
                    deepNode2[Deep Node 2]
                    deepNode1 --> deepNode2
                end
                
                midNode1[Mid Node 1]
                midNode2[Mid Node 2]
                midNode1 --> subGraph3
                subGraph3 --> midNode2
            end
            
            highNode1[High Node 1]
            highNode2[High Node 2]
            highNode1 --> subGraph2
            subGraph2 --> highNode2
        end
        
        topNode1[Top Node 1]
        topNode2[Top Node 2]
        topNode1 --> subGraph1
        subGraph1 --> topNode2
    end
    
    entryNode[Entry Node] --> mainGraph
    mainGraph --> exitNode[Exit Node]
    
    subgraph sg1 [Explicit ID Subgraph]
        idNode1[ID Node 1]
        idNode2[ID Node 2]
        idNode1 --> idNode2
    end
    
    multilineNode["This is a multiline
    node with **bold** and _italic_
    text formatting"]
    
    unicodeNode["Unicode: ❤ 🔍 ⚠️"]
    
    specialCharsNode["Node with (special) characters & symbols!"]
    
    minLengthStart[Min Length Start] ---->|Long Link| minLengthEnd[Min Length End]
    
    multilineNode --> unicodeNode --> specialCharsNode --> sg1

    mainGraph --> sg1
    exitNode --> minLengthStart
    minLengthEnd --> chainEnd
    unicodeNode --> subroutineNode
`
  },
  {
    id: 'mogolom-sub-sub-graphs',
    name: 'MOGOLOM Sub-Sub-Graphs',
    description: 'A diagram showing the relationships between sub-sub-graphs in MOGOLOM',
    code: `flowchart TD
    subgraph biggest 
    subgraph bigger
    subgraph adequete
    end
    end
    end
    `
  },
  {
    id: 'mogolom-demo',
    name: 'MOGOLOM Demo',
    description: 'A demo of MOGOLOM',
    code: `flowchart RL
    subgraph LayoutEngine["Layout Engine"]
        parser
        elk["ELK.js"]
    end
    HardToReadDiagram["Hard to Read<br>SVG Diagram"]
    ClearDiagram["Clear<br>SVG Diagram"]
    BadOutcome["😱 Bad Outcome<br>Confusion & Misunderstanding"]
    GoodOutcome["😊 Good Outcome<br>Clarity & Insight"]
    LayoutEngine --> HardToReadDiagram
    Parser  --> LayoutEngine
    OriginalCode --> Parser
    HardToReadDiagram --> BadOutcome
    subgraph "MOGOLOM Optimization"
        EdgeAnalysis["Edge Crossing<br>Analysis"]
        NodeAnalysis["Node Intersection<br>Analysis"]
        ranking["Arbitrary Ranking<"]
        smaller{"smaller?"}
    end
    HardToReadDiagram --> EdgeAnalysis
    HardToReadDiagram --> NodeAnalysis
    ranking --> smaller
    NodeAnalysis --> ranking
    EdgeAnalysis --> ranking
    smaller --> ImprovedCode
    ClearDiagram --> GoodOutcome
    LayoutEngine --> ClearDiagram
    ImprovedCode --> Parser
    OriginalCode["Original Mermaid<br>Syntax Code"]
    ImprovedCode["Improved Mermaid<br>Syntax Code"]
    Parser["Parser"]

    User -->|paste|OriginalCode
    ImprovedCode -->|copy|User
    BadOutcome --> User
    GoodOutcome --> User
    
    `
  },
  {
    id: 'vector-space',
    name: 'Vector Space Concepts',
    description: 'A diagram showing relationships between vector space concepts',
    code: `flowchart BT
    Addition[Addition]
    ScalarMult[Scalar Multiplication]
    Dimension[Dimension n]
    
    Vec[Vectors] -->|belong to| VS[Vector Space]
    VS -->|closed under| Addition
    VS -->|closed under| ScalarMult
    VS -->|has| Dimension
    
    CoVec[Co-vectors] -->|belong to| DVS[Dual Vector Space]
    DVS -->|isomorphic to| VS
    
    Symmetry["B(u,v) = B(v,u)"] -->|property of| SBF[Symmetric Bilinear Form]
    SBF -->|is a| BForm
    
    BL1["f(αu₁ + βu₂, v) = αf(u₁, v) + βf(u₂, v)"] -->|property of| BForm[Bilinear Form]
    BL2["f(u, αv₁ + βv₂) = αf(u, v₁) + βf(u, v₂)"] -->|property of| BForm
    
    IPNotation["u·v := B(u,v)"] -->|notation for| IP[Inner Product]
    IP -->|defined by| SBF
    
    NormFormula["‖u‖ := √|u·u|"] -->|formula for| Norm["Norm ‖u‖"]
    Norm -->|defined by| IP
    
    AngleMeasure[Angle measurement] -->|enabled by| NVS[Normed Vector Space]
    DistMeasure[Distance measurement] -->|enabled by| NVS
    SBF -->|belongs to| NVS
    NVS -->|is a| VS
    
    subgraph Example3D[3D Geometric Interpretation]
        Lines[Lines through origin] -->|represented by| Vec
        Planes[Planes through origin] -->|represented by| CoVec
        IncidenceCondition["Line lies in Plane <br> ⟨θ, v⟩ = 0"] -->|both| Lines
        IncidenceCondition -->|both| Planes
    end
    
    PGA[Projective Geometric Algebra] -->|founded on| VS
    PGA -->|founded on| DVS
    PGA -->|uses metrics from| NVS`
  },
  {
    id: 'software-architecture',
    name: 'Software Architecture Patterns',
    description: 'A complex diagram showing relationships between software architecture patterns.  Claude-3.7-sonnet made the whole graph from a light prompt.  Do not judge.  Test cases are a good use case for generative language models.',
    code: `flowchart TD
    MVC[Model-View-Controller]
    MVVM[Model-View-ViewModel]
    Layered[Layered Architecture]
    Microservices[Microservices]
    EventDriven[Event-Driven Architecture]
    
    MVC -->|evolved into| MVVM
    Layered -->|can be implemented with| MVC
    Monolithic -->|can be decomposed into| Microservices
    Microservices -->|often uses| EventDriven
    
    Model[Data Model] -->|part of| MVC
    View[User Interface] -->|part of| MVC
    Controller[Logic Controller] -->|part of| MVC
    
    ViewModel[View Model] -->|part of| MVVM
    DataBinding[Data Binding] -->|enables| MVVM
    
    Presentation[Presentation Layer] -->|component of| Layered
    Business[Business Layer] -->|component of| Layered
    Persistence[Persistence Layer] -->|component of| Layered
    Database[Database Layer] -->|component of| Layered
    
    API[API Gateway] -->|component of| Microservices
    ServiceDiscovery[Service Discovery] -->|enables| Microservices
    CircuitBreaker[Circuit Breaker] -->|pattern in| Microservices
    
    EventBus[Event Bus] -->|component of| EventDriven
    Publisher[Event Publisher] -->|component of| EventDriven
    Subscriber[Event Subscriber] -->|component of| EventDriven
    
    Security[Security] -->|concern for| MVC
    Security -->|concern for| MVVM
    Security -->|concern for| Layered
    Security -->|concern for| Microservices
    Security -->|concern for| EventDriven
    
    Scalability[Scalability] -->|challenge for| Monolithic
    Scalability -->|benefit of| Microservices
    
    Complexity[Complexity] -->|challenge for| Microservices
    Complexity -->|challenge for| EventDriven
    
    CQRS[Command Query Responsibility Segregation] -->|often used with| EventDriven
    Saga[Saga Pattern] -->|manages transactions in| Microservices
    BFF[Backend For Frontend] -->|pattern for| Microservices
    
    Monolithic[Monolithic Architecture] -->|predecessor to| Layered
    SOA[Service Oriented Architecture] -->|predecessor to| Microservices`
  }
];

// Function to populate the examples dropdown
function populateExamplesDropdown() {
  const examplesList = document.getElementById('examples-list');
  if (!examplesList) return;
  
  // Clear existing buttons
  examplesList.innerHTML = '';
  
  // Add examples
  exampleDiagrams.forEach(example => {
    const button = document.createElement('button');
    button.textContent = example.name;
    button.addEventListener('click', () => {
      loadExampleDiagram(example.id);
    });
    examplesList.appendChild(button);
  });
}

// Function to load an example diagram
function loadExampleDiagram(exampleId) {
  const example = exampleDiagrams.find(ex => ex.id === exampleId);
  if (!example) return;
  
  const codeEditor = document.getElementById('code-editor');
  const diagram = document.getElementById('diagram');
  
  if (codeEditor && diagram) {
    codeEditor.value = example.code;
    
    // Directly call the global renderDiagram function from mogolom.js
    if (window.renderDiagram) {
      window.renderDiagram();
    } else {
      // Fallback: Try to render using mermaid directly
      diagram.textContent = example.code;
      mermaid.render('rendered-diagram', example.code)
        .then(({ svg }) => {
          diagram.innerHTML = svg;
          
          // Ensure SVG is properly sized
          const svgElement = diagram.querySelector('svg');
          if (svgElement) {
            // Remove fixed dimensions that might be constraining the SVG
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
            
            // Set viewBox if it doesn't exist to maintain aspect ratio
            if (!svgElement.getAttribute('viewBox') && 
                svgElement.getAttribute('width') && 
                svgElement.getAttribute('height')) {
              const width = parseFloat(svgElement.getAttribute('width'));
              const height = parseFloat(svgElement.getAttribute('height'));
              svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }
            
            // Add responsive styling
            svgElement.style.width = '100%';
            svgElement.style.minWidth = '300px';
            svgElement.style.height = 'auto';
          }
        })
        .catch(error => {
          console.error('Error rendering diagram:', error);
          diagram.innerHTML = '<div style="color: red; padding: 1rem;">Error rendering diagram</div>';
        });
    }
  }
}

// Initialize example manager
function initExampleManager() {
  populateExamplesDropdown();
  
  // Add event listener to the examples button
  const examplesBtn = document.querySelector('.examples-btn');
  if (examplesBtn) {
    // The dropdown will show/hide on hover via CSS
    // No need for click handler
  }
}

// Export functions
window.ExampleManager = {
  init: initExampleManager,
  loadExample: loadExampleDiagram,
  getExamples: () => exampleDiagrams,
  addExample: (example) => {
    exampleDiagrams.push(example);
    populateExamplesDropdown();
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initExampleManager); 