import "./style.css";

import * as THREE from "three";
import * as dat from "dat.gui";
import ForceGraph3D from "3d-force-graph";
import SpriteText from "three-spritetext";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import strata from "./strata.js";
import "d3-force-3d";
import * as d3 from "d3";
import { forceZ } from "d3-force-3d";
import { BooleanKeyframeTrack, Color } from "three";
import pageRankGraph from "pagerank.js";

let bloomPass,
  gui,
  newNodeSetNameController,
  nodeIncludeWordsController,
  searchTextGUIController,
  simulateFolder,
  customController,
  conceptSearchController,
  addNewNodeController,
  addNewRelationController

let elem, maxNodes, fGraph, greatestEdgesPerNode;
let fetchedConcepts = [];
let spreadNode;
let pageRankNode;
let selectedNodes = new Set();
let selectedNeighbors = new Set();
let nodeSets = [];
let nodeSetsFolder;
const highlightNodes = new Set();
const highlightLinks = new Set();
let hoverNode = null;
let forcesDirty = false;
let hue = 0.0;
const PHI = 1.61803398874;
let spawnNewConceptsAt = { x: 0, y: 0, z: 0 };
let lastKeyUp

const imagesFolder = "./images/";
const circleAlphaMap = new THREE.TextureLoader().load(imagesFolder + "orb.png");
const rectAlphaMap = new THREE.TextureLoader().load(
  imagesFolder + "cropped-rect-mask.jpg"
);

// variables we want to wiggle in the gui
const params = {
  linkColor: "rgba(90, 60, 125, 0.3)",
  nodeVisualMode: "labeled", //simple or labeled or edgeCount or pageRank
  edgeMode: "relation",

  nodeThreshold: 2,
  maxNodes: 500,
  velocityDecay: 0.85,

  forceCenterStrength: 0.1,
  forceLinkStrength: 0.1,
  forceChargeStrength: -100,

  d3AlphaDecay: 0.0,

  strength: 100,
  altitude: 200,

  newNodeString: "",
  newRelationString: "", // this one gets decomposed like a:b -> [a,b] to link two nodes by id
  newRelationSource: "",
  newRelationTarget: "",
  newRelationType: "IsA", // this one sets the label on the relation with the key 'relation'
  includeWords: "jonas",
  excludeWords: "centipede",
  loadFilePath: "./data/thinkers.json",// "./data/js-terms.json", //'./data/movies-vs-tropes.ssv', // ./data/fake-2.json //netflix-dark-events.json //animals_TREE
  saveFileName: "new",

  conceptFetchString: "past,present,future", // 'idea,image,meaning,self,object,subject,other,time,tense,future,past,present,case,show,topic,mathematics,science,art,painting,abstraction,concept,specialization,entity,causal_agent,process,physical_process,other,illusion,delusion,rhetorical_device,trope,logical_fallacy,',
  maxEdges: 999,
  minEdges: 40,
  fetchConcepts: async () => {
    if (params.conceptFetchString) fetchConcepts(params.conceptFetchString);
  },
  loadGraphData: async () => {
    loadGraphData(params.loadFilePath);
    searchTextGUIController.setValue(params.includeWords);
  },
  saveGraphJSON: async () => {
    saveGraphJSON();
  },
  searchKey: "id",
  searchValue: "",
  hopLimit: 4,
  newNodeSetName: "",

  clearGraphData: () => {
    clearTropesGraph();
  },
  unpinAllNodes: () => {
    unpinAllNodes();
  },
  removeSelectedNodes: () => {
    removeSelectedNodes();
  },
  removeUnselectedNodes: () => {
    removeUnselectedNodes();
  },
  clearSelectedNodeGraphs: () => {
    clearSelectedNodeGraphs();
  },
  expandNodeSelection: () => {
    expandNodeSelection();
  },
  saveNodeSet: () => {
    saveNodeSet();
  },
  refreshTropesSet: () => {
    fGraph.refresh();
  },
  reheatSimulation: () => {
    fGraph.d3ReheatSimulation();
  },

  palette: {
    color1: "#FF0000",
  },
  // INTERACTIVITY

  pinOnDrag: false,
  swingCameraOnClick: false,
  removeNodeOnClick: false,
  highlightOnHover: true,
  setNodeObjectsToSpriteLabels: 16,
};


//////////////// Data Parsing ////////////////


function parseDelimiterSpacedFile(
  text,
  delimiter = ";",
  includeWords,
  excludeWords
) {
  // do any of the words in a list contains a search string?
  function searchList(listOfWords, searchString) {
    return listOfWords.reduce((tillNow, now) => {
      return tillNow || searchString.indexOf(now) !== -1;
    }, false);
  }
  let color = new THREE.Color();
  color.setHSL((hue += PHI), 0.5, 0.5);
  const tropeSet = new Set();
  let tropeHash = {};
  let movies = text.split("\n");
  let movieTropes = { nodes: [], links: [] };

  movies.forEach((m) => {
    let movieThenTropes = m.split(delimiter);
    let movieTitle = movieThenTropes[0];
    let tropesText = movieThenTropes[1];
    if (movieTitle && tropesText) {
      let tropes = tropesText.split(",");

      if (
        (!includeWords || searchList(includeWords, movieTitle.toLowerCase())) &&
        (!excludeWords || !searchList(excludeWords, movieTitle.toLowerCase()))
      ) {
        let newNode = {
          id: movieTitle,
          type: "movie",
          color: color,
          tropes: [],
        };
        tropes.forEach((t) => {
          if (t.indexOf("Movie") < 0 && t.indexOf("Films") < 0) {
            // hard coded filtering out tropes with listy words in them
            tropeSet.add(t.toLowerCase());
            tropeHash[t.toLowerCase()] = tropeHash[t.toLowerCase()]
              ? tropeHash[t.toLowerCase()] + 1
              : 1;
            newNode.tropes.push(t.toLowerCase());
          }
        });

        movieTropes.nodes.push(newNode);
      }
      let newMovieId = movieTropes.nodes.length - 1;
    }
  });

  let blk = new THREE.Color(0.2, 0.2, 0.3);
  for (let t of tropeSet) {
    if (tropeHash[t] && tropeHash[t] > params.nodeThreshold) {
      movieTropes.nodes.push({ id: t, type: "trope", color: blk });
    }
  }

  for (let m in movieTropes.nodes) {
    let movie = movieTropes.nodes[m];
    if (movie.type === "movie") {
      movie.tropes.forEach((t) => {
        // if we counted edges for this tropes, and it hadd fewer edges than our threshold, and the edge isn't connecting a node with itself
        if (
          tropeHash[t] &&
          tropeHash[t] > params.nodeThreshold &&
          movie.id !== t
        ) {
          movieTropes.links.push({ source: movie.id, target: t });
        }
      });
    }
  }
  return movieTropes;
}

async function parseConceptAPIData(json) {
  console.log("parseConceptAPIData", json);
  let filterRelations = true; // makes this a param or something later in case we need a filter again, now the sql does it
  let allowedRelations = ["IsA", "Synonym", "Antonym"];
  let allowedKeys = [
    "id",
    "relation",
    "source",
    "target",
    "source_id",
    "target_id",
    "weight",
  ];
  let relations = json.relations;
  if (filterRelations) {
    relations = relations.filter((r) => {
      return allowedRelations.indexOf(r.relation) > -1;
    });
  }

  // look for prop nodeAttributeValueToConfigMap and use it to read the node/link attribute-value pairs to map those to desired color, linkStrength, linkDistance 'config' values

  /**
   * TODO:  calc the ratio of src to tgt relations, either in query or in js, decide to bundle concept or not based on that ratio, maybe filter?
   */
  let relatedConcepts = [];
  relations.forEach((r) => {
    let sourceEdgeCount =
      r.concept_name === r.target_name
        ? Number(r.source_edge_count)
        : relations.length;
    let targetEdgeCount =
      r.concept_name === r.source_name
        ? Number(r.target_edge_count)
        : relations.length;

    const tgtConcept = {
      id: r.target_id,
      label: r.target_name,
      concept_id: r.target_id,
      ...spawnNewConceptsAt,
      edgeCount: targetEdgeCount,
    };
    if (targetEdgeCount && r.target_name !== r.source_name)
      relatedConcepts.push(tgtConcept);

    const srcConcept = {
      id: r.source_id,
      label: r.source_name,
      concept_id: r.source_id,
      ...spawnNewConceptsAt,
      edgeCount: sourceEdgeCount,
    };
    if (sourceEdgeCount && r.target_name !== r.source_name)
      relatedConcepts.push(srcConcept);
  });

  relatedConcepts = Array.from(
    new Set(relatedConcepts.map((obj) => JSON.stringify(obj)))
  ).map((stringified) => JSON.parse(stringified));

  // if(params.connectPreexistingNodes){
  //     const nodes = fGraph.graphData().nodes
  //     relatedConcepts.forEach(c => {
  //         const preexistingNode = nodes.find(n=>n.id === c.id)
  //         console.log('relatedConcepts', c, nodes.find(n=>n.id === c.id) )
  //         if(preexistingNode){
  //             // see if there are relationships between these two nodes
  //         }
  //     }
  // )}

  await mergeData({
    nodes: Array.from(relatedConcepts),
    links: relations,
  });
}


//////////////// File IO ////////////////


async function mergeData(data) {
  async function addNeighborsAndNodes() {
    fGraph.graphData().links.forEach((link) => {
      const a = fGraph.graphData().nodes.find((n) => n.id === link.source);
      const b = fGraph.graphData().nodes.find((n) => n.id === link.target);
      if (!a || !b) {
        // console.log('notfound', a,b,link.source, link.target)
        return;
      }

      a.neighbors = a.neighbors ? a.neighbors : [];
      b.neighbors = b.neighbors ? b.neighbors : [];
      a.sources = a.sources ? a.sources : [];
      b.sources = b.sources ? b.sources : [];
      a.targets = a.targets ? a.targets : [];
      b.targets = b.targets ? b.targets : [];
      a.neighbors.push(b);
      a.targets.push(b);
      b.neighbors.push(a);
      b.sources.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });
  }

  async function mergeGraphNodeArrays(a, b) {
    if (!a) a = [];
    if (!b) b = [];
    let c = [];
    for (let i in a) {
      let a1 = a[i];
      let added = false;
      for (let j in b) {
        let b1 = b[j];
        if (a1.id === b1.id) {
          c.push(a1);
          added = true;
        }
      }
      if (!added) {
        c.push(a1);
      }
    }
    for (let j in b) {
      let b1 = b[j];
      let added = false;
      for (let i in a) {
        let a1 = a[i];
        if (a1.id === b1.id) {
          added = true;
        }
      }
      if (!added) {
        c.push(b1);
      }
    }
    return c;
  }

  async function mergeGraphLinkArrays(a, b) {
    if (!a) a = [];
    if (!b) b = [];
    let c = [];
    for (let i in a) {
      let a1 = a[i];
      let added = false;
      for (let j in b) {
        let b1 = b[j];
        if (a1.source === b1.source && a1.target === b1.target) {
          c.push(a1);
          added = true;
        }
      }
      if (!added) {
        c.push(a1);
      }
    }
    for (let j in b) {
      let b1 = b[j];
      let added = false;
      for (let i in a) {
        let a1 = a[i];
        if (a1.source === b1.source && a1.target === b1.target) {
          added = true;
        }
      }
      if (!added) {
        c.push(b1);
      }
    }
    return c;
  }

  forcesDirty = true;

  if (fGraph.graphData().nodes.length < 1) {
    console.log("first data!");
    fGraph.graphData(data);
  } else {
    console.log("new data, mergeGraphNodeArrays, mergeGraphLinkArrays");
    let nodes = await mergeGraphNodeArrays(
      fGraph.graphData().nodes,
      data.nodes
    );
    let edges = await mergeGraphLinkArrays(
      fGraph.graphData().links,
      data.links
    );
    nodes.forEach((n, idx) => {
      n.index = idx;
    });

    let merged = {
      nodes: nodes,
      links: edges,
    };
    fGraph.graphData(merged);
  }
  console.log("mergeData, addNeighborsAndNodes");
  await addNeighborsAndNodes();
}

async function spawnConcept(filePath) {
  let text = await downloadFile(filePath);
  let json = await JSON.parse(text);

  console.log("spawnConcept json", json);
  if (json.presentation && json.presentation.nodeAttributeValueToConfigMap) {
    setColorFromAttributeValueMap(
      json.presentation.nodeAttributeValueToConfigMap
    );
  }
  await mergeData(json.data);
}

async function setColorFromAttributeValueMap(map) {
  console.log("setColorFromAttributeValueMap", map);
  const defaultColor = "red";
  setNodeObjectsToSpriteLabels(16, (node) => {
    Object.keys(map).forEach((attr) => {
      if (node.hasOwnProperty(attr)) {
        let val = node[attr];
        if (map[attr].hasOwnProperty(val)) {
          let mappedConfigColor = map[attr][val].color;
          console.log("mappedConfigColor", attr, val, mappedConfigColor);
          node.mappedConfigColor = mappedConfigColor
            ? mappedConfigColor
            : defaultColor;
        }
      }
    });
    console.log("... but returning default color", node.mappedConfigColor);
    return node.mappedConfigColor;
  });
}

async function loadFilteredGraphDataFromFile(filePath) {
  if (!params.includeWords || params.includeWords.length < 3) return;
  let text = await downloadFile(filePath);
  let data = parseDelimiterSpacedFile(
    text,
    ";",
    params.includeWords.split(","),
    params.excludeWords.split(",")
  );

  await mergeData(data);
}

async function fetchAllTheConcepts(conceptString, delimiter = ",") {
  const concepts = conceptString.split(delimiter);
  for (let i = 0; i < concepts.length; i++) {
    await fetchConcepts(concepts[i]);
  }
}

async function fetchConcepts(conceptString) {
  if (fetchedConcepts.indexOf(conceptString) > -1) return;
  const response = await fetch("http://localhost:3000/concepts/query", {
    method: "POST",
    headers: {
      token: localStorage.getItem("token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conceptString: conceptString,
      maxEdges: params.maxEdges,
      minEdges: params.minEdges,
    }),
  });
  const responseJson = await response.json();
  fetchedConcepts.push(conceptString);
  console.log(
    "fetchConcepts",
    conceptString,
    responseJson,
    "fetchConcepts",
    fetchedConcepts.join(",")
  );
  parseConceptAPIData(responseJson);
}

async function downloadFile(path) {
  let response = await fetch(path);
  if (response.status != 200) {
    throw new Error("Server Error");
  }
  // read response stream as text
  let text_data = await response.text();
  return text_data;
}

async function saveGraphJSON() {
  function _objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
      target[i] = obj[i];
    }
    return target;
  }

  function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  const { nodes, links } = fGraph.graphData();
  const graphJSON = {
    data: {
      nodes: nodes.map((n) => {
        return _objectWithoutProperties(n, [
          "sources",
          "targets",
          "links",
          "neighbors",
          "__threeObj",
        ]);
      }),
      links: links.map((l) => {
        return {
          ..._objectWithoutProperties(l, [
            "source",
            "target",
            "__lineObj",
            "__photonsObj",
            "__curve",
          ]),
          source: l.source.id,
          target: l.target.id,
        };
      }),
    },
    // nodeSets: nodeSets.map(ns=>)  // TODO: someday also save all the nodeSets and their corresponding forces
  };
  download(JSON.stringify(graphJSON), params.saveFileName, "text/plain");
}

async function growEveryNode() {
  const nodes = fGraph.graphData().nodes.filter((n) => {
    true;
  });
  nodes.forEach((n) => (n.visited = false));
  nodes.forEach((n) => {
    fetchConcepts(n.label);
  });
}


//////////////// UI ////////////////


function selectRandomNodeWithEdgeCountBelow(max) {
  const nodes = fGraph.graphData().nodes;
  let smallNodes = fGraph.graphData().nodes.filter((n) => {
    return n.edgeCount && n.edgeCount < max;
  });

  if (smallNodes) {
    let r = Math.floor(Math.random() * smallNodes.length);
    let node = smallNodes[r];
    selectedNodes.clear();
    selectedNodes.add(node);
    swingCameraToNode(node);
    setNodesObjectColorBySelection();
  }
}

async function onKeyUp(event) {
//   console.log("onKeyUp", event.key);
  lastKeyUp = event.key
  if (event.target.localName === "input") {
    return;
  } // bail on keystrokes from text input fields
  switch (event.key) {
    case "e":
      fGraph.nodeColor(fGraph.nodeColor());
      break;

    case "g":
      growEveryNode();
      break;

    case "Delete":
      await deleteConcept();
      selectRandomNodeWithEdgeCountBelow(2);
      break;

    case "r":
      selectRandomNodeWithEdgeCountBelow(2);
      break;

    case "f":
      console.log("f nodeSets", nodeSets);
      fGraph.refresh();
      refreshNodeSetsForces();
      break;

    case "s":
      loadBySpreading(0);
      break;

    case "t":
      addForceToNodeSet(null, simulateFolder);
      break;

    case "p":
      // poppaPageRank();
      console.log("graph", fGraph.graphData())
      break
  }
}

function poppaPageRank() {
  pageRankGraph.link(1, 2, 1.0);

  fGraph.graphData().nodes.forEach((n, idx) => (n.idx = idx));

  let links = fGraph.graphData().links;
  links.forEach((link, index) => {
    pageRankGraph.link(link.source.idx, link.target.idx, 1.0);
  });

  pageRankGraph.rank(0.85, 0.000001, function (node, rank) {
    console.log("Node " + node + " has a rank of " + rank);
    fGraph.graphData().nodes[Number(node)].pageRank = rank;
  });
}

async function focusOnDatGUIField( controller ){
    controller.domElement.children[0].focus();
}

function focusOnSearch() {
  if (conceptSearchController && conceptSearchController.domElement.children[0])
    focusOnDatGUIField(conceptSearchController)
}

function setLinkDistanceGUI(attribute, valueToDistanceMap, valueToStrengthMap) {
  if (customController) {
    simulateFolder.removeFolder(customController);
  }
  customController = simulateFolder.addFolder("Custom");

  Object.keys(valueToDistanceMap).forEach((k) => {
    customController
      .add(valueToDistanceMap, k)
      .name("DST " + k)
      .onChange((val) =>
        setLinkDistancesFromAttribute(attribute, valueToDistanceMap)
      );
  });
  Object.keys(valueToStrengthMap).forEach((k) => {
    customController
      .add(valueToStrengthMap, k)
      .name("STR " + k)
      .onChange((val) =>
        setLinkStrengthsFromAttribute(attribute, valueToStrengthMap)
      );
  });
}


//////////////// Graph manipulation ////////////////
function selectNodes(ids){
  const {nodes, links} = fGraph.graphData()
  ids.forEach(id=>{
    let node = nodes.find(n=>n.id === id)
    if(node){
      selectedNodes.add(node)
    }
  })
}

function refreshNodeSetsForces() {
  nodeSets.forEach((ns) => {
    ns.forces.forEach((force) => {
      fGraph.d3Force(force).initialize(Array.from(ns.nodeSet));
    });
  });
}

function searchNodesByKeyValue(key, value) {
  selectedNodes.clear();
  for (let n in fGraph.graphData().nodes) {
    let node = fGraph.graphData().nodes[n];

    if (
      node.hasOwnProperty(key) &&
      node[key].toLowerCase().indexOf(value) > -1
    ) {
      selectedNodes.add(node);
    }
  }

  if (selectedNodes.size === 1) {
    selectedNodes.forEach((n) => {
      setNodeColorByHops(n);
      swingCameraToNode(n);
    });
  } else {
    setNodesObjectColorBySelection();
  }
}

function clearSelectedNodeGraphs() {
  if (!selectedNodes || selectedNodes.size < 1) return;
  selectedNodes.clear();
  setNodesObjectColorBySelection();
}

function removeSelectedNodes() {
  console.log("removeSelectedNodes");
  if (!selectedNodes || selectedNodes.size < 1) return;
  selectedNodes.forEach((n) => removeNode(n, fGraph));
}

function removeUnselectedNodes() {
  if (!selectedNodes || selectedNodes.size < 1) return;
  fGraph.graphData().nodes.forEach((n) => {
    if (!selectedNodes.has(n)) removeNode(n, fGraph);
  });
}

function expandNodeSelection() {
  console.log("expandNodeSelection", selectedNodes.size);
  let newNodeSelection = new Set(Array.from(selectedNodes));
  if (newNodeSelection.size > 0) {
    selectedNodes.forEach((n) => {
      n.sources.forEach((s) => newNodeSelection.add(s));
      n.targets.forEach((t) => newNodeSelection.add(t));
    });
    console.log("found", newNodeSelection.size);
    selectedNodes = newNodeSelection;
  } else {
    selectedNodes = new Set(fGraph.graphData().nodes);
  }

  setNodesObjectColorBySelection();
  fGraph.nodeColor(fGraph.nodeColor());
  fGraph.nodeColor("pink");
}

function selectAllNodes() {}

function saveNodeSet() {
  if (!selectedNodes || selectedNodes.size < 1) return;
  const newName = params.newNodeSetName;
  let newNodeSet = {
    name: newName,
    nodeSet: new Set(selectedNodes),
    forces: [],
    strength: 1,
    x: 0,
    y: 0,
    z: 0,
    yAttr: "",
    forces: [],
    selectNodeSet: function () {
      selectedNodes.clear();
      nodeSets
        .find((ns) => ns.name === newName)
        .nodeSet.forEach((ns) => {
          selectedNodes.add(ns);
        });
      setNodesObjectColorBySelection();
    },
    addForceToNodeSet: function () {
      addForceToNodeSet(newName);
    },
  };
  nodeSets.push(newNodeSet);
  let newNodeSetFolder = nodeSetsFolder.addFolder(newNodeSet.name);
  newNodeSetFolder.add(newNodeSet, "selectNodeSet").name("Select Node Set");
  newNodeSetFolder
    .add(newNodeSet, "addForceToNodeSet")
    .name("Add Strata Force");
  newNodeSetFolder.addColor(params.palette, "color1").onChange((val) => {
    colorNodeSet(params.palette.color1, newNodeSet.nodeSet);
  });
  nodeSetsFolder.open()
  newNodeSetFolder.open()
  newNodeSet.folder = newNodeSetFolder;
}

function colorNodeSet(color, nodeSet) {
  let threeColor = new THREE.Color(color);
  if (!color || !nodeSet) return;
  nodeSet.forEach((n) => {
    console.log("color node", n, threeColor);
    n.color = threeColor;
  });
  fGraph.refresh();
}

function addForceToNodeSet(nodeSetName = null, folder) {
  let nodeSet;
  if (nodeSetName) {
    folder = nodeSet.folder;
    nodeSet = nodeSets.find((ns) => ns.name === nodeSetName);
  } else {
    nodeSet = {
      nodeSet: fGraph.graphData().nodes,
      x: 0,
      y: 0,
      z: 0,
      yAttr: "",
    };
    nodeSetName = "";
  }

  let strataForce = strata();

  fGraph.d3Force("strataTrope" + nodeSetName, strataForce);
  fGraph
    .d3Force("strataTrope" + nodeSetName)
    .initialize(Array.from(nodeSet.nodeSet));
  fGraph.d3Force("strataTrope" + nodeSetName).strength(1);
  if (nodeSet.forces) nodeSet.forces.push("strataTrope" + nodeSetName);

  let newStrataForceFolder = folder.addFolder("StrataForce");
  newStrataForceFolder
    .add(nodeSet, "x", -1000, 1000, 0.01)
    .onChange((val) => fGraph.d3Force("strataTrope" + nodeSetName).x(val));
  newStrataForceFolder
    .add(nodeSet, "y", -1000, 1000, 0.01)
    .onChange((val) => fGraph.d3Force("strataTrope" + nodeSetName).y(val));
  newStrataForceFolder
    .add(nodeSet, "z", -1000, 1000, 0.01)
    .onChange((val) => fGraph.d3Force("strataTrope" + nodeSetName).z(val));

  newStrataForceFolder
    .add(nodeSet, "yAttr")
    .onChange((val) => fGraph.d3Force("strataTrope" + nodeSetName).yAttr(val));
}

function setLinkStrengthsFromAttribute(attribute, valueToStrengthMap) {
  fGraph.d3Force("link").strength((link) => {
    if (link[attribute] && valueToStrengthMap.hasOwnProperty(link[attribute])) {
      return valueToStrengthMap[link[attribute]];
    } else return 1.0;
  });
}

function setLinkDistancesFromAttribute(attribute, valueToDistanceMap) {
  fGraph.d3Force("link").distance((link) => {
    if (link[attribute] && valueToDistanceMap.hasOwnProperty(link[attribute])) {
      return valueToDistanceMap[link[attribute]];
    } else return 1.0;
  });
}

function setEdgeToColor(color) {
  fGraph.linkColor(color);
}

function hueFromString(s) {}

function setEdgeVisualsByAttributeMap(attribute, valueMap) {
  console.log(
    "setEdgeVisualsByAttributeMap",
    attribute,
    valueMap,
    valueMap.hasOwnProperty(attribute)
  );

    let color = new THREE.Color()

  fGraph.linkColor((link) => {
    if (
      link.hasOwnProperty(attribute) && valueMap.hasOwnProperty(link[attribute]) ) {
          color.set(valueMap[ link[attribute] ])
          if(highlightLinks.size > 0){
              if(highlightLinks.has(link)){
                  console.log("hasLInk", link,)
              } else {
                color.offsetHSL(0., -.4, -.4)
              }
          }   
      return color.getStyle();//valueMap[ link[attribute] ];
    }
  });
}

function setEdgeColorByAttribute(attribute) {
  let relationColors = {};
  let color = new THREE.Color();
  fGraph.linkColor((link) => {
    if (link[attribute]) {
      if (relationColors[link[attribute]]) {
        color.setHSL(relationColors[link[attribute]], 0.5, 0.5);
        return color.getStyle();
      } else {
        relationColors[link[attribute]] = Math.random();
        color.setHSL(relationColors[link[attribute]], 0.5, 0.5);
        return color.getStyle();
      }
    } else {
      return "white";
    }
  });
}

function forceEdgeTextFromAttribute(attribute, color = "lightgrey") {
  if (!attribute) {
  } else {
    fGraph
      .linkThreeObjectExtend(true)
      .linkThreeObject((link) => {
        // extend link with text sprite
        const sprite = new SpriteText(
          `${link[attribute] ? link[attribute] : ""}`
        );
        sprite.color = color;
        sprite.textHeight = 10;
        return sprite;
      })
      .linkPositionUpdate((sprite, { start, end }) => {
        const middlePos = Object.assign(
          ...["x", "y", "z"].map((c) => ({
            [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
          }))
        );

        // Position sprite
        Object.assign(sprite.position, middlePos);
      });
  }
}

function setEdgeLabelByAttribute(attribute) {
  fGraph.linkHoverPrecision(3.0);
  fGraph.linkLabel((link) => {
    if (link[attribute]) {
      return link[attribute];
    } else return "(missing)";
  });
}

function setNodeObjectsToImageLabels() {
  setNodesLabelByAttribute();
  fGraph.nodeThreeObject((node) => {
    if (node.image) {
      const imgTexture = new THREE.TextureLoader().load(
        imagesFolder + node.image
      );
      const material = new THREE.SpriteMaterial({
        map: imgTexture,
        alphaMap: node.type === "event" ? rectAlphaMap : circleAlphaMap,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(node.type === "event" ? 24 : 12, 12);
      return sprite;
    }
  });
}

function setNodeObjectsToSpriteLabels(textHeight, color) {
  if (!color) color = (n) => "white";
  fGraph
    .nodeThreeObject((node) => {
      let label = node.label ? node.label : node.id;

      const sprite = new SpriteText(label);
      sprite.material.depthWrite = false; // make sprite background transparent
      sprite.color = color(node);
      sprite.textHeight = textHeight;
      return sprite;
    })
    .linkDirectionalParticles(2)
    .linkDirectionalParticleSpeed(0.025)
    .linkDirectionalParticleWidth(2)
    .linkDirectionalParticleColor("white")
    .linkDirectionalParticleResolution(2);
}

function setNodeObjectsGeometryByType() {
  fGraph
    .nodeThreeObject(
      ({ id, type, color }) =>
        new THREE.Mesh(
          type !== "trope"
            ? new THREE.SphereGeometry(4, 6, 4) //radius, width, height
            : new THREE.TetrahedronGeometry(2, 0), //new THREE.BoxGeometry( 2.0, 2.0, 2.0 )  //radius, width, height
          new THREE.MeshLambertMaterial({
            color: color ? color : "rgba(255, 60, 90)",
            transparent: true,
            opacity: type === "movie" ? 1 : 0.5,
          })
        )
    )
    .nodeLabel(
      (n) =>
        n.id +
        " isA: " +
        n.targets.map((nb) => nb.id).join(", ") +
        " :::" +
        n.sources.map((nb) => nb.id).join(", ") +
        " isA " +
        n.id
    )

    .linkDirectionalParticles(({ source, target }) => {
      return Math.floor((source.length + target.length) / 8.0);
    })
    .linkDirectionalParticleSpeed(0.025)
    .linkDirectionalParticleWidth(2)
    .linkDirectionalParticleColor("white")
    .linkDirectionalParticleResolution(2);
}

function setNodesObjectColorBySelection() {
  let color = new THREE.Color();
  color.setHSL(0, 1, 0.2);
  fGraph.graphData().nodes.forEach((n) => {
    n.__threeObj.material.color.setHSL(0, 0, 0.2);
    n.__threeObj.needsUpdate = true;
  });
  selectedNodes.forEach((n) => {
    if (n && n.__threeObj && n.__threeObj.material) {
      n.__threeObj.material.color.setHSL(0, 1, 1);
      n.__threeObj.needsUpdate = true;
    }
  });
}

async function loadGraphData(path) {
  const extension = path
    .substring(path.length - 4, path.length)
    .replace(".", "");
  switch (extension) {
    case "ssv":
      await loadFilteredGraphDataFromFile(path);
      refreshNodeSetsForces();
      break;
    case "json":
      await spawnConcept(path);
      refreshNodeSetsForces();
      break;
  }
  params.saveFileName = path;
}

async function loadBySpreading(val) {
  let nodes = fGraph.graphData().nodes;
  // if(!spreadNode)
  spreadNode = nodes[Math.floor(Math.random() * nodes.length)];

  await fetchConcepts(spreadNode.label);
  if (val < 10) loadBySpreading(val + 1);
}

function setEdgesByMode(mode) {
  switch (mode) {
    case "simple":
      setEdgeToColor("white");
      setEdgeLabelByAttribute("label");
      break;
    case "relation":
      setEdgeColorByAttribute("relation");
      setEdgeLabelByAttribute("relation");
      forceEdgeTextFromAttribute("method", "Crimson");
      break;
    case "concepts":
      let relationToColorMap = {
        IsA: "cyan",
        Synonym: "blue",
        Antonym: "red",
      };
      setEdgeVisualsByAttributeMap("relation", relationToColorMap);
      break;
  }
}

function setNodesLabelByAttribute(attribute) {
  if (!attribute) {
    const badAttrs = [
      "__threeObj",
      "links",
      "sources",
      "targets",
      "vx",
      "vy",
      "vz",
      "neighbors",
      "image",
    ];
    fGraph.nodeLabel((n) => {
      return Object.keys(n)
        .filter((k) => n[k] && badAttrs.indexOf(k) < 0)
        .map((k) => k + ": " + n[k].toString() + "<br />")
        .join("");
    });
  } else {
    fGraph.nodeLabel((n) => (n[attribute] ? n[attribute] : n.id));
  }
}

function clearTropesGraph() {
  fGraph.graphData({ nodes: [], links: [] });
}

function addEdge(srcId, tgtId, graph) {
  const { nodes, links } = graph.graphData();
  if (srcId !== tgtId) {
    graph.graphData({
      nodes: [...nodes],
      links: [...links, { source: srcId, target: tgtId }],
    });
  }
}

function addRandomEdge() {
  const { nodes, links } = Graph.graphData();
  let id1 = Math.floor(Math.random() * nodes.length);
  let id2 = Math.floor(Math.random() * nodes.length);
  if (id1 !== id2) {
    Graph.graphData({
      nodes: [...nodes],
      links: [...links, { source: id1, target: id2 }],
    });
  }
}

function addRandomNode() {
  const { nodes, links } = Graph.graphData();
  if (nodes.length > params.maxNodes) {
    return;
  }
  const id = nodes.length;
  Graph.graphData({
    nodes: [...nodes, { id }],
    links: [
      ...links,
      { source: id, target: Math.round(Math.random() * (id - 1)) },
    ],
  });
}

function removeNodeWithEdgesOutOfRange(minEdgeCount, maxEdgeCount, graph) {
  let graphData = graph.graphData();
  let { nodes, links } = graph.graphData();
  let nodeEdgeCounts = {};

  links.forEach((l) => {
    nodeEdgeCounts[l.source.id] = nodeEdgeCounts[l.source.id]
      ? nodeEdgeCounts[l.source.id] + 1
      : 1;
    nodeEdgeCounts[l.target.id] = nodeEdgeCounts[l.target.id]
      ? nodeEdgeCounts[l.target.id] + 1
      : 1;
  });
  let done = false;
  for (const nodeId in nodeEdgeCounts) {
    if (maxEdgeCount && nodeEdgeCounts[nodeId] > maxEdgeCount && !done) {
      removeNodeById(nodeId, graph);
      return false;
    }
    if (minEdgeCount && nodeEdgeCounts[nodeId] > minEdgeCount && !done) {
      removeNodeById(nodeId, graph);
      return false;
    }
  }
  return true;
}

function removeNode(node, graph) {
  console.log("removeNode", node, graph);
  if (!node) {
    return;
  }
  let { nodes, links } = graph.graphData();
  links = links.filter((l) => {
    if (l.source.id != node.id && l.target.id != node.id) {
      return true;
    } else {
      return false;
    }
  });
  nodes = nodes.filter((n) => n.id !== node.id); // Remove node(s?)
  // nodes.splice(node.id, 1); // Remove node
  // nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
  graph.graphData({ nodes, links });
}

function removeNodeById(nodeId, graph) {
  let { nodes, links } = graph.graphData();
  console.log("removeNodeById", nodeId, nodes, links);

  let newLinks = links.filter((l) => {
    if (l.source.id != nodeId && l.target.id != nodeId) {
      return true;
    } else {
      return false;
    }
  }); // Remove links attached to node
  console.log("newLinks", newLinks);
  nodes.splice(nodeId, 1); // Remove node
  // nodes.forEach((n, idx) => { n.id = idx }); // Reset node ids to array index  ?? ; n.index = idx
  graph.graphData({ nodes, newLinks });
}

function swingCameraToNode(node) {
  console.log("swingCameraToNode", node.id);
  const distance = 400;
  const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

  fGraph.cameraPosition(
    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    node, // lookAt ({ x, y, z })
    500 // ms transition duration
  );
}

function pinNode(node) {
  node.fx = node.x;
  node.fy = node.y;
  node.fz = node.z;
}

function unpinNode(node) {
  node.fx = null;
  node.fy = null;
  node.fz = null;
}

function togglePinNode(node) {
  if (node.fx !== null) unpinNode(node);
  else pinNode(node);
}

function unpinAllNodes() {
  fGraph.graphData().nodes.forEach(unpinNode);
}

function setNodeColorByHops(node) {
  fGraph.graphData().nodes.forEach((n) => {
    //re init some vals we'll use to drive color
    n.sourceTargetWeight = 0;
    n.__threeObj.material.color.setHSL(0, 0.0, 0.1);
    n.__threeObj.needsUpdate = true;
    n.traveled = false;
  });
  node.traveled = true;
  node.sourceTargetWeight = 1;
  node.__threeObj.material.color.setHSL(0.0, 0, 0.9);
  node.__threeObj.needsUpdate = true;
  if (node.links && node.links.length > 0)
    node.links.forEach((l) => {
      if (l.relation !== "Antonym") {
        setNodeColorFromRelationHops(l.target, 1);
        setNodeColorFromRelationHops(l.source, 1);
      }
    });
}

function setNodeColorFromRelationHops(node, val) {
  if (!node || !val || node.traveled) return;
  node.__threeObj.material.color.add(
    new THREE.Color(1 - val / params.hopLimit, 0.25, 0.25)
  );
  node.__threeObj.needsUpdate = true;
  node.traveled = true;
  if (node.links.length > 0 && val < params.hopLimit)
    node.links.forEach((l) => {
      if (l.relation !== "Antonym")
        setNodeColorFromSourceHops(l.target, val + 1);
      if (l.relation !== "Antonym")
        setNodeColorFromSourceHops(l.source, val + 1);
    });
}

function setNodeColorFromSourceHops(node, val) {
  if (!node || !val || node.traveled) return;
  node.__threeObj.material.color.add(
    new THREE.Color(1 - val / params.hopLimit, 0.25, 0.25)
  );
  node.__threeObj.needsUpdate = true;
  node.traveled = true;
  if (node.sources.length > 0 && val < params.hopLimit)
    node.sources.forEach((s) => setNodeColorFromSourceHops(s, val + 1));
}

function setNodeColorFromTargetHops(node, val) {
  if (!node || !val || node.traveled) return;
  node.__threeObj.material.color.add(
    new THREE.Color(0.25, 0.25, 1 - val / params.hopLimit)
  );
  node.__threeObj.needsUpdate = true;
  node.traveled = true;
  // this function recurses on itself, pretty dangerously because it is only gated by the val which must decrease and the .traveled property
  if (node.targets.length > 0 && val < params.hopLimit)
    node.targets.forEach((t) => setNodeColorFromTargetHops(t, val + 1));
}

function setNodesObjectByMode(mode) {
  switch (mode) {
    case "simple":
      setNodeObjectsGeometryByType();
      break;
    case "labeled":
      setNodeObjectsToSpriteLabels(params.setNodeObjectsToSpriteLabels, null);
      break;
    case "edgeCount":
      let color = new THREE.Color();
      setNodeObjectsToSpriteLabels(params.setNodeObjectsToSpriteLabels, (n) => {
        let maxEdgeCount = params.maxEdges;
        maxEdgeCount = fGraph.graphData().nodes.reduce((last, nn) => {
          return Math.max(nn.edgeCount, last);
        }, 0);
        let x = (n.edgeCount / maxEdgeCount).toPrecision(3);

        let hue = 1 - x * 0.88;
        let sat = fetchedConcepts.indexOf(n.label) > -1 ? 0.3 : 0.8;
        color.setHSL(hue, sat, 0.5);
        if(params.highlightOnHover && highlightNodes.size > 0 ){
            if(!highlightNodes.has(n)){
                color.offsetHSL(0., -.4, -.4)
            }
        }
        return n.edgeCount ? color.getStyle() : "blue";
      });
      break;
    case "image":
      setNodeObjectsToImageLabels(); //expecting the nodes to have an image, fallback image?
      break;
    case "pageRank":
      setColorByPageRank();
      break;
  }
}

function setColorByPageRank() {
  let leastRank = 1;
  let greatestRank = 0;
  fGraph.graphData().nodes.forEach((n) => {
    leastRank = Math.min(leastRank, n.pageRank);
    greatestRank = Math.max(greatestRank, n.pageRank);
  });
  console.log("least, greatest", leastRank, greatestRank);
  setNodeObjectsToSpriteLabels(params.setNodeObjectsToSpriteLabels, (node) => {
    if (!node || !node.hasOwnProperty("pageRank")) return "gray";
    let c = new THREE.Color(
      0.1,
      node.pageRank / (greatestRank - leastRank),
      0.2
    );
    return c.getStyle();
  });
}


//////////////// Graph CRUD ////////////////

async function addNewNodes( idString ){
  let ids =  idString.split(',')
  ids.forEach(id=>addNewNode(id))

  if(ids.length>1 && ids[ids.length-1] && ids[ids.length-2])addNewRelationController.setValue( ids[ids.length-2] + ':' + ids[ids.length-1])

  // gotta focus on a different datGUI controller to be able to setValue()
  focusOnDatGUIField(customController)
  addNewNodeController.setValue('') 

  if(lastKeyUp !== 'Tab')focusOnDatGUIField(addNewNodeController)
}

async function addNewNode( id, label ){
    const { nodes, links } = fGraph.graphData()

    let newId = id.toLowerCase().replace(" ", "_")

    if(nodes.find(n=> n.id === newId)) return // if we already have that id, don't add it

    const node = {
        id: newId,
        label: label ? label : id
    }
    fGraph.graphData({
        nodes: [...nodes, node],
        links: links
    })
    return node
}

async function addNewRelation( sourceString, targetString, attrMap ){
  if(!sourceString || !targetString)return
    const { nodes, links } = fGraph.graphData()

    let sourceId = sourceString.toLowerCase().replace(" ", "_")
    let targetId = targetString.toLowerCase().replace(" ", "_")

    fGraph.nodeId('id')
    let source = nodes.find(n=>n.id === sourceId)
    let target = nodes.find(n=>n.id === targetId)
    if(!source) source = await addNewNode(sourceString)
    if(!target) target = await addNewNode(targetString)

    const link = {
        id: sourceId + '_' + targetId,
        source: sourceId,
        target: targetId,
        ...attrMap
    }
    fGraph.graphData({
        nodes: [...nodes, source, target],
        links: [...links, link]
    })
}

async function deleteConcept() {
  if (selectedNodes.size === 1) {
    const selectedNode = Array.from(selectedNodes)[0];
    const id = selectedNode.concept_id;

    const response = await fetch(`http://localhost:3000/concepts/${id}`, {
      method: "DELETE",
      headers: { token: localStorage.getItem("token") },
      // headers: {'Content-Type': 'application/json'}
    });
    // const responseJSON = await response.json()

    const { nodes, links } = fGraph.graphData();
    fGraph.graphData({
      nodes: [...nodes].filter((n) => n.id !== selectedNode.id),
      links: [...links].filter((l) => {
        console.log(
          "del?",
          l.source.id,
          l.target.id,
          selectedNode.id,
          l.source_id !== selectedNode.id,
          "&&",
          l.target_id !== selectedNode.id
        );
        return (
          l.source_id !== selectedNode.id && l.target_id !== selectedNode.id
        );
      }),
    });
  }
}

async function deleteAssertion(assertion) {
  console.log(
    "deleting assertion ",
    assertion.source.id, assertion.target.id,
    "doesn't work because we used to pass the assertion ids, but stopped because the data has dupey (diff weights from diff data sources?)"
  );
  return;
  const response = await fetch(
    `http://localhost:3000/assertions/${assertion.id}`,
    {
      method: "DELETE",
      headers: { token: localStorage.getItem("token") },
    }
  );
  const responseJson = await response.json();
  let { nodes, links } = fGraph.graphData();
  fGraph.graphData({
    nodes: [...nodes],
    links: [...links].filter((l) => {
      if (l.id === assertion.id) {
        console.log("removing assertion", l.id, assertion.id, l);
      }
      return l.id !== assertion.id;
    }),
  });
}

async function deleteAllAssertionsLike(sourceId, targetId, relationId){
  console.log("deleteAllAssertionsLike", sourceId, targetId, relationId)

  const response = await fetch(
    `http://localhost:3000/assertions/deleteLike`,
    {
      method: "PUT",
      headers: { token: localStorage.getItem("token") },
      body: JSON.stringify( { source_id:sourceId, target_id: targetId, relation_id: relationId } )
    }
  );
  const responseJson = await response.json();
  let { nodes, links } = fGraph.graphData();
  fGraph.graphData({
    nodes: [...nodes],
    links: [...links].filter((l) => {
      if (l.id === assertion.id) {
        console.log("removing assertion", l.id, assertion.id, l);
      }
      return l.id !== assertion.id;
    }),
  })
}


//////////////// Init ////////////////


async function init() {
  bloomPass = new UnrealBloomPass(); //TODO: selective bloomPass? https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom_selective.html
  bloomPass.strength = 1.1;
  bloomPass.radius = 1;
  bloomPass.threshold = 0.1;

  initDatGUI();
  setupForceGraph();
  setupVisuals();
  initInteractivity();

  setNodesLabelByAttribute();

  window.addEventListener("resize", () => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    fGraph.camera().aspect = width / height;
    fGraph.camera().updateProjectionMatrix();
    fGraph.renderer().setSize(width, height);
    fGraph.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  window.addEventListener("keyup", (e) => onKeyUp(e), false);
}
init();

async function initDatGUI() {
  console.log("initDatGUI");
  gui = new 11({ name: "My GUI" });
  gui.width = 400

  let fileFolder = gui.addFolder("File")

    let loadFolder = fileFolder.addFolder("Load");

        let jsonLoadFolder = fileFolder.addFolder("Local JSON files");
        
        jsonLoadFolder.add(params, "clearGraphData").name("Clear All Data");
        jsonLoadFolder.add(params, "loadFilePath").name("Load File Path");
        nodeIncludeWordsController = jsonLoadFolder
            .add(params, "includeWords")
            .name("Node Include");
        jsonLoadFolder.add(params, "excludeWords").name("Node Exclude");
        jsonLoadFolder.add(params, "nodeThreshold", 0, 10, 1).name("N Threshold");
        jsonLoadFolder.add(params, "loadGraphData").name("Load Graph Data");


        let conceptFolder = loadFolder.addFolder("Concept");
        conceptFolder.add(params, "minEdges", 1, 1000, 1).onChange((val) => {
        fetchedConcepts = [];
        });
        conceptFolder.add(params, "maxEdges", 1, 1000, 1).onChange((val) => {
        fetchedConcepts = [];
        });
        conceptSearchController = conceptFolder
        .add(params, "conceptFetchString").name('Fetch Concept(S)')
        .onFinishChange((val) => {
            fetchAllTheConcepts(val);
        });

    let saveFolder = fileFolder.addFolder("Save");
    saveFolder.add(params, "saveFileName").name("Save Path").listen();
    saveFolder.add(params, "saveGraphJSON").name("Save Graph JSON");

    let selectFolder = gui.addFolder("Select")
        selectFolder.add(params, "hopLimit").name("Hop Limit", 1, 16, 1);
    selectFolder.add(params, "searchKey").name("Search Key");
    searchTextGUIController = selectFolder
        .add(params, "searchValue")
        .name("Search Value")
        .onFinishChange((val) => {
        searchNodesByKeyValue(
            params.searchKey.toLowerCase(),
            params.searchValue.toLowerCase()
        );
        newNodeSetNameController.setValue(val);
        fGraph.nodeColor(fGraph.nodeColor());
        });

    let editFolder = gui.addFolder("Edit")
    addNewNodeController = editFolder.add(params, "newNodeString").name("New Node(s) CSV").onFinishChange(val=>{
        addNewNodes(params.newNodeString)
    })
    editFolder.add(params, "newRelationType").name('Relation')

    addNewRelationController = editFolder.add(params, "newRelationString").name("New Relation A:B").onFinishChange(val=>{
        if( !params.newRelationString.indexOf(':') ) return
        const sourceId = params.newRelationString.split(':')[0]
        const targetId = params.newRelationString.split(':')[1]
        addNewRelation( sourceId, targetId, {relation: params.newRelationType} )
    })
    // .onChange(val=>{
    //   selectedNodes.clear()
    //   if(val && val.indexOf(':'))
    //   selectNodes(val.split(':'))
    // })

    editFolder.add(params, "newRelationSource").name("Source").onFinishChange(val=>{
      addNewRelation( params.newRelationSource, params.newRelationTarget, {relation: params.newRelationType} )
    })
    editFolder.add(params, "newRelationTarget").name("Target").onFinishChange(val=>{
      addNewRelation( params.newRelationSource, params.newRelationTarget, {relation: params.newRelationType} )
    })

    selectFolder.add(params, "expandNodeSelection").name("Expand Selection");
    selectFolder
        .add(params, "clearSelectedNodeGraphs")
        .name("Clear Selection");
    selectFolder.add(params, "unpinAllNodes").name("Un Pin All");
    selectFolder.add(params, "removeSelectedNodes").name("Remove Selected");
    selectFolder.add(params, "removeUnselectedNodes").name("Remove Rest");


  let settingsFolder = gui.addFolder("Settings");

    let interactionSettingsFolder = settingsFolder.addFolder("Interaction")
    interactionSettingsFolder
        .add(params, "pinOnDrag")
        .name("Pin On Drag")
        .onChange((val) => initInteractivity());
    interactionSettingsFolder.add(params, "swingCameraOnClick")
        .name("Swing On Click")
        .onChange((val) => initInteractivity());
    interactionSettingsFolder.add(params, "removeNodeOnClick")
        .name("Remove On Click")
        .onChange((val) => initInteractivity());

    let visualsFolder = settingsFolder.addFolder("Visuals");
    visualsFolder.add(params, "linkColor", -2, 2, 0.01).onChange((val) => {
        if (params.edgeMode === "simple") {
        fGraph.linkColor(() => val);
        }
    });
    visualsFolder
        .add(params, "setNodeObjectsToSpriteLabels", 4, 64, 2)
        .onChange((val) => setNodeObjectsToSpriteLabels(val));
    
        let bloomFolder = visualsFolder.addFolder("Bloom");
    
        bloomFolder.add(bloomPass, "strength", 0, 10, 0.01)
        bloomFolder.add(bloomPass, "radius", 0, 10, 0.01);
        bloomFolder.add(bloomPass, "threshold", -1, 1, 0.001);

  simulateFolder = gui.addFolder("Simulate");
  simulateFolder
    .add(params, "velocityDecay", 0, 1, 0.001)
    .onChange((val) => fGraph.d3VelocityDecay(val));
  simulateFolder
    .add(params, "forceLinkStrength", 0, 1.5, 0.001)
    .onChange((val) => fGraph.d3Force("link").strength(val));
  simulateFolder
    .add(params, "forceCenterStrength", 0, 10, 0.001)
    .onChange((val) => fGraph.d3Force("center").strength(val));
  simulateFolder
    .add(params, "forceChargeStrength", -1000, 1000, 0.001)
    .onChange((val) => fGraph.d3Force("charge").strength(val));
//   simulateFolder
//     .add(params, "d3AlphaDecay", -10, 10, 0.001)
//     .onChange((val) => fGraph.d3AlphaDecay(val));
  simulateFolder.add(params, "refreshTropesSet").name("Refresh");
//   simulateFolder.add(params, "reheatSimulation").name("Reheat");

  visualsFolder
    .add(params, "nodeVisualMode", [
      "simple",
      "labeled",
      "image",
      "edgeCount",
      "pageRank",
    ])
    .onChange((mode) => {
      setNodesObjectByMode(mode);
    });

  visualsFolder
    .add(params, "edgeMode", ["simple", "relation", "concepts"])
    .onChange((mode) => {
      setEdgesByMode(mode);
    });

    nodeSetsFolder = gui.addFolder("Node Sets");
        newNodeSetNameController = nodeSetsFolder
        .add(params, "newNodeSetName")
        .name("New Set Name")
        .onFinishChange((val) => saveNodeSet());
        nodeSetsFolder.add(params, "saveNodeSet").name("Save");

fileFolder.open()
jsonLoadFolder.open()
//   selectFolder.open()
editFolder.open()
conceptFolder.open()
settingsFolder.open()
visualsFolder.open()

  saveFolder.open()
simulateFolder.open()
loadFolder.open()
visualsFolder.open()
  nodeSetsFolder.open()

}

async function initInteractivity() {
    console.log("initInteractivity", fGraph)
  if (!fGraph) return;

  fGraph
    .onNodeDrag((node, translate) => {
      if (selectedNodes.has(node)) {
        // moving a selected node
        [...selectedNodes]
          .filter((selNode) => selNode !== node) // don't touch node being dragged
          .forEach((node) =>
            ["x", "y", "z"].forEach(
              (coord) => (node[`f${coord}`] = node[coord] + translate[coord])
            )
          ); // translate other nodes by same amount
      }
    })
    .onNodeDragEnd((node) => {
      if (selectedNodes.has(node)) {
        // finished moving a selected node
        [...selectedNodes]
          .filter((selNode) => selNode !== node) // don't touch node being dragged
          .forEach((node) => {
            ["x", "y", "z"].forEach((coord) => (node[`f${coord}`] = undefined));
            if (params.pinOnDrag) pinNode(node);
          }); // unfix controlled nodes
      }
    });

  fGraph.onNodeClick((node, event) => {
    if (params.swingCameraOnClick) swingCameraToNode(node);
    if (params.pinOnDrag) togglePinNode(node);
    if (params.removeNodeOnClick) removeNode(node, fGraph);

    if (event.ctrlKey || event.shiftKey || event.altKey) {
      // multi-selection
      selectedNodes.has(node)
        ? selectedNodes.delete(node)
        : selectedNodes.add(node);
    } else {
      // single-selection
      const untoggle = selectedNodes.has(node) && selectedNodes.size === 1;
      selectedNodes.clear();
      selectedNeighbors.clear();
      if (!untoggle && node.neighbors) {
        // setNodeColorByHops(node)
        selectedNodes.add(node);
        setNodesObjectColorBySelection();
        node.neighbors.forEach((n) => selectedNeighbors.add(n));
      }
    }
  });

  fGraph.onNodeHover((node, priorNode) => {
    console.log("onNodeHover", node, priorNode);
    if(!node && priorNode && highlightNodes.has(priorNode)){ // just stopped hovering over priorNode
        console.log("clearing highlight nodes")
        highlightNodes.clear();
        highlightLinks.clear();
        unpinNode(priorNode)
        fGraph.linkColor(fGraph.linkColor())
    }
    if(node && !highlightNodes.has(node)){ // just started hovering over node
        pinNode(node)
        highlightNodes.clear();
        highlightLinks.clear();
        highlightNodes.add(node)
        if(node.neighbors) {
                node.neighbors.forEach(n=>{
                highlightNodes.add(n)
            })  
        }
        if(node.links){node.links.forEach(l=>{
                highlightLinks.add(l)
            })
        }
        // setNodesObjectByMode(params.nodeVisualMode)
        fGraph.linkColor(fGraph.linkColor())
    }    
    // fGraph.nodeColor(fGraph.nodeColor())
  });



  fGraph.onNodeRightClick((n) => {
    spawnNewConceptsAt = { x: n.x, y: n.y, z: n.z };
    fetchConcepts(n.label);
    refreshTropesSet()
  });

  fGraph.onLinkClick((l, event) => {
    console.log("link click", l, event, l.assertion_id);
    if (event.ctrlKey) {
      // deleteAssertion(l);
      deleteAllAssertionsLike(l.source_id, l.target_id, l.relation_id)
    }
  });
}

function setupVisuals() {
  setNodesObjectByMode(params.nodeVisualMode);
  setEdgesByMode(params.edgeMode);

  // don't want to keep adding bloom passes, TODO: inspect the passes to see if there is a bloom pass already, make passes addeble and removeable in gui
  if (fGraph.postProcessingComposer().passes.length < 2) {
    fGraph.postProcessingComposer().addPass(bloomPass);
  }
}

function setupForceGraph() {
  elem = document.getElementById("3d-graph");
  fGraph = fGraph
    ? fGraph
    : ForceGraph3D()(elem)
        .onEngineStop(() => {
          console.log("enging stopped!", fGraph.cooldownTicks());
        })
        .d3AlphaDecay(params.d3AlphaDecay)
        .d3VelocityDecay(params.velocityDecay)
        .linkColor((link) => {
          let c = new THREE.Color();
          if (!link.relation) return "green"; //params.linkColor
          if (link.relation === "IsA") return "cyan";
          if (link.relation === "Synonym") return "blue";
          if (link.relation === "Antonym") return "rgba(100, 20, 20, .9)";
          return "white";
        })
        .cooldownTicks(Infinity)
        .cooldownTime(Infinity);

  fGraph.d3Force("center").strength(params.forceCenterStrength);
  fGraph.d3Force("link").strength(params.forceLinkStrength);
  fGraph.d3Force("charge").strength(params.forceChargeStrength);

  fGraph.onEngineTick((args) => {
    if (forcesDirty) {
      forcesDirty = false;
      refreshNodeSetsForces();
      console.log("tried to reset forces for node sets");
    }
  });

  let valToStr = {
    IsA: 0.3,
    Synonym: 0.3,
    Antonym: 0.3,
  };
  setLinkStrengthsFromAttribute("relation", valToStr);

  let valToDist = {
    IsA: 500.0,
    Synonym: 300.0,
    Antonym: 1300.0,
  };
  setLinkDistancesFromAttribute("relation", valToDist);

  setLinkDistanceGUI("relation", valToDist, valToStr);

  //   fGraph.d3Force('collide', d3.forceCollide(fGraph.nodeRelSize()))
}
