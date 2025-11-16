class ErDB {
  constructor() {
    this.entities = new Map();
    this.relationships = [];
    this.direction = 'TB';

    // Bind methods as own properties for Jison parser compatibility
    // (Parser uses hasOwnProperty which doesn't see prototype methods)
    this.addEntity = this.addEntity.bind(this);
    this.addAttributes = this.addAttributes.bind(this);
    this.addRelationship = this.addRelationship.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.setClass = this.setClass.bind(this);
    this.addClass = this.addClass.bind(this);
    this.setAccTitle = this.setAccTitle.bind(this);
    this.setAccDescription = this.setAccDescription.bind(this);
    this.addCssStyles = this.addCssStyles.bind(this);
    this.getEntities = this.getEntities.bind(this);
    this.getRelationships = this.getRelationships.bind(this);
    this.clear = this.clear.bind(this);
    this.getData = this.getData.bind(this);
  }

  addEntity(name, alias = '') {
    if (!this.entities.has(name)) {
      this.entities.set(name, {
        id: `entity-${name}-${this.entities.size}`,
        label: name,
        attributes: [],
        alias: alias,
      });
      console.log('Added entity:', name);
    } else if (!this.entities.get(name).alias && alias) {
      this.entities.get(name).alias = alias;
      console.log('Added alias to entity:', name, alias);
    }
    return this.entities.get(name);
  }

  addAttributes(entityName, attribs) {
    const entity = this.addEntity(entityName);
    // Reverse order due to parser construction
    for (let i = attribs.length - 1; i >= 0; i--) {
      entity.attributes.push(attribs[i]);
      console.log('Added attribute:', attribs[i].name);
    }
  }

  addRelationship(entA, roleA, entB, relSpec) {
    const entityA = this.entities.get(entA);
    const entityB = this.entities.get(entB);
    
    if (!entityA || !entityB) {
      console.warn('Cannot add relationship - entity not found');
      return;
    }

    const rel = {
      entityA: entityA.id,
      roleA: roleA,
      entityB: entityB.id,
      relSpec: relSpec
    };

    this.relationships.push(rel);
    console.log('Added relationship:', rel);
  }

  setDirection(dir) {
    this.direction = dir;
  }

  // Stub methods expected by parser
  setClass(entities, className) {
    console.log('setClass:', entities, className);
  }

  addClass(className) {
    console.log('addClass:', className);
  }

  setAccTitle(title) {
    console.log('setAccTitle:', title);
  }

  setAccDescription(description) {
    console.log('setAccDescription:', description);
  }

  addCssStyles(styles) {
    console.log('addCssStyles:', styles);
  }

  // Cardinality and Identification enums (used by parser)
  Cardinality = {
    ZERO_OR_ONE: 'ZERO_OR_ONE',
    ZERO_OR_MORE: 'ZERO_OR_MORE',
    ONE_OR_MORE: 'ONE_OR_MORE',
    ONLY_ONE: 'ONLY_ONE'
  };

  Identification = {
    NON_IDENTIFYING: 'NON_IDENTIFYING',
    IDENTIFYING: 'IDENTIFYING'
  };

  getEntities() {
    return this.entities;
  }

  getRelationships() {
    return this.relationships;
  }

  clear() {
    this.entities = new Map();
    this.relationships = [];
  }

  // Return simple JSON structure instead of complex nodes/edges
  getData() {
    return {
      entities: Array.from(this.entities.values()),
      relationships: this.relationships,
      direction: this.direction
    };
  }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = new ErDB();
}

// For browser (global)
if (typeof window !== 'undefined') {
  window.erDb = new ErDB();
}