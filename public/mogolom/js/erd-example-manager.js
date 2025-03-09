// Example Manager for ER Diagram Optimizer
// Manages loading and switching between example ER diagrams

// Collection of example ER diagrams
const exampleDiagrams = [
  {
    id: 'erd-mogolom-example',
    name: 'Mogolom Example',
    description: 'A simple ER diagram',
    code: `erDiagram
    User ||--o{ MermaidCode : "creates/pastes"
    MermaidCode ||--|| Parser : "processed by"
    Parser ||--|| LayoutEngine : "uses"
    LayoutEngine ||--o{ Diagram : "generates"
    Diagram ||--|| Outcome : "leads to"
    Outcome }|--|| User : "experienced by"
    
    MermaidCode {
        string content
        date createdAt
    }
    
    Parser {
        string version
    }
    
    LayoutEngine {
        string algorithm
    }
    
    Diagram {
        string svgContent
        int complexity
    }
    
    Outcome {
        string type
        string description
    }
    
    MermaidCode ||--o{ MOGOLOMOptimizer : "input to"
    Diagram ||--o{ MOGOLOMOptimizer : "analyzed by"
    MOGOLOMOptimizer ||--o{ MermaidCode : "produces improved"
    
    MOGOLOMOptimizer {
        int iterations
        float score
    }
    
    MOGOLOMOptimizer ||--|| EdgeAnalysis : "performs"
    MOGOLOMOptimizer ||--|| NodeAnalysis : "performs"
    EdgeAnalysis ||--|| ScoreCalculation : "contributes to"
    NodeAnalysis ||--|| ScoreCalculation : "contributes to"
    ScoreCalculation ||--|| Variation : "evaluates"
    Variation ||--o{ MermaidCode : "becomes"
    
    EdgeAnalysis {
        int crossingCount
    }
    
    NodeAnalysis {
        int intersectionCount
    }
    
    ScoreCalculation {
        float totalScore
        float weight
    }
    
    Variation {
        string type
        int attemptNumber
    }`
  },
  {
    id: 'order-example',
    name: 'Order Example',
    description: 'A simple order system ER diagram',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
  },
  {
    id: 'order-with-attributes',
    name: 'Order with Attributes',
    description: 'Order system with entity attributes',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }`
  },
  {
    id: 'car-driver-example',
    name: 'Car Driver Example',
    description: 'Example with identifying and non-identifying relationships',
    code: `erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicence PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes`
  },
  {
    id: 'library-system',
    name: 'Library System',
    description: 'A library management system ER diagram',
    code: `erDiagram
    LIBRARY ||--|{ BOOK : contains
    BOOK }o--|| PUBLISHER : published_by
    BOOK ||--o{ BOOK_COPY : has
    BOOK_COPY ||--o{ CHECKOUT : involved_in
    MEMBER ||--o{ CHECKOUT : makes
    BOOK_COPY {
        string copyId PK
        string bookId FK
        string status
        date acquisitionDate
    }
    BOOK {
        string bookId PK
        string title
        string ISBN
        string[] authors
        int publicationYear
        string publisherId FK
    }
    LIBRARY {
        string libraryId PK
        string name
        string address
        string phone
    }
    PUBLISHER {
        string publisherId PK
        string name
        string address
    }
    MEMBER {
        string memberId PK
        string name
        string email
        date joinDate
        string status
    }
    CHECKOUT {
        string checkoutId PK
        string copyId FK
        string memberId FK
        date checkoutDate
        date dueDate
        date returnDate
    }`
  },
  {
    id: 'university-system',
    name: 'University System',
    description: 'A university management system ER diagram',
    code: `erDiagram
    STUDENT }|..|{ COURSE : enrolls
    PROFESSOR ||--o{ COURSE : teaches
    DEPARTMENT ||--|{ PROFESSOR : employs
    DEPARTMENT ||--|{ COURSE : offers
    STUDENT {
        string studentId PK
        string name
        string email
        date enrollmentDate
        string major
    }
    PROFESSOR {
        string professorId PK
        string name
        string email
        string title
        string departmentId FK
    }
    COURSE {
        string courseId PK
        string title
        int credits
        string departmentId FK
        string professorId FK
    }
    DEPARTMENT {
        string departmentId PK
        string name
        string building
        string budget
    }
    ENROLLMENT {
        string studentId PK, FK
        string courseId PK, FK
        string semester
        string grade
    }`
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
    
    // Directly call the global renderDiagram function
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

// Export functions for use in other modules
window.ExampleManager = {
  getExamples: () => exampleDiagrams,
  loadExample: loadExampleDiagram,
  init: initExampleManager
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initExampleManager);

// Initialize right away since DOM might already be loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initExampleManager();
}