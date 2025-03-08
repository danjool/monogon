// Example Manager for Mermaid Diagram Optimizer
// Manages loading and switching between example diagrams

// Collection of example diagrams
const exampleDiagrams = [
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

    %% Main flow components
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
    %% Core mathematical properties (placing fundamental concepts at top)
    Addition[Addition]
    ScalarMult[Scalar Multiplication]
    Dimension[Dimension n]
    
    %% Core vector space concepts (reading up the graph)
    Vec[Vectors] -->|belong to| VS[Vector Space]
    VS -->|closed under| Addition
    VS -->|closed under| ScalarMult
    VS -->|has| Dimension
    
    %% Dual vector space concepts (reading up)
    CoVec[Co-vectors] -->|belong to| DVS[Dual Vector Space]
    DVS -->|isomorphic to| VS
    
    %% Symmetric bilinear form (reading up)
    Symmetry["B(u,v) = B(v,u)"] -->|property of| SBF[Symmetric Bilinear Form]
    SBF -->|is a| BForm
    
    %% Bilinearity properties (fundamental property)
    BL1["f(αu₁ + βu₂, v) = αf(u₁, v) + βf(u₂, v)"] -->|property of| BForm[Bilinear Form]
    BL2["f(u, αv₁ + βv₂) = αf(u, v₁) + βf(u, v₂)"] -->|property of| BForm
    
    %% Inner product (reading up)
    IPNotation["u·v := B(u,v)"] -->|notation for| IP[Inner Product]
    IP -->|defined by| SBF
    
    %% Norm (reading up)
    NormFormula["‖u‖ := √|u·u|"] -->|formula for| Norm["Norm ‖u‖"]
    Norm -->|defined by| IP
    
    %% Normed vector space (reading up)
    AngleMeasure[Angle measurement] -->|enabled by| NVS[Normed Vector Space]
    DistMeasure[Distance measurement] -->|enabled by| NVS
    SBF -->|belongs to| NVS
    NVS -->|is a| VS
    
    %% 3D Geometric interpretation example
    subgraph Example3D[3D Geometric Interpretation]
        Lines[Lines through origin] -->|represented by| Vec
        Planes[Planes through origin] -->|represented by| CoVec
        IncidenceCondition["Line lies in Plane <br> ⟨θ, v⟩ = 0"] -->|both| Lines
        IncidenceCondition -->|both| Planes
    end
    
    %% Connection to PGA (reading up)
    PGA[Projective Geometric Algebra] -->|founded on| VS
    PGA -->|founded on| DVS
    PGA -->|uses metrics from| NVS`
  },
  {
    id: 'software-architecture',
    name: 'Software Architecture Patterns',
    description: 'A complex diagram showing relationships between software architecture patterns.  Claude-3.7-sonnet made the whole graph from a light prompt.  Do not judge.  Test cases are a good use case for generative language models.',
    code: `flowchart TD
    %% Main architectural patterns
    MVC[Model-View-Controller]
    MVVM[Model-View-ViewModel]
    Layered[Layered Architecture]
    Microservices[Microservices]
    EventDriven[Event-Driven Architecture]
    
    %% Pattern relationships
    MVC -->|evolved into| MVVM
    Layered -->|can be implemented with| MVC
    Monolithic -->|can be decomposed into| Microservices
    Microservices -->|often uses| EventDriven
    
    %% Components and concepts
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
    
    %% Cross-cutting concerns
    Security[Security] -->|concern for| MVC
    Security -->|concern for| MVVM
    Security -->|concern for| Layered
    Security -->|concern for| Microservices
    Security -->|concern for| EventDriven
    
    Scalability[Scalability] -->|challenge for| Monolithic
    Scalability -->|benefit of| Microservices
    
    Complexity[Complexity] -->|challenge for| Microservices
    Complexity -->|challenge for| EventDriven
    
    %% Additional patterns
    CQRS[Command Query Responsibility Segregation] -->|often used with| EventDriven
    Saga[Saga Pattern] -->|manages transactions in| Microservices
    BFF[Backend For Frontend] -->|pattern for| Microservices
    
    %% Legacy systems
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