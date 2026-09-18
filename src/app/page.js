'use client'
import {useState,useEffect} from 'react';
import ELK from 'elkjs';
import { ReactFlow, Background, Controls, Node, Edge,getSmoothStepPath, BaseEdge } from '@xyflow/react';
// Important: This import provides the structural styling for the canvas layout
import '@xyflow/react/dist/base.css';
import {SeedDatabase} from '../actions/database.js'
import fetchFamilyMembers from '../actions/database.js';
import {fetchUnions} from '../actions/database.js';

const elk = new ELK();

export default function Home(){
    // 1. Establish constant dimensional bounds for your family member node cards
const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;
const [nodes, setNodes] = useState([]);
const [edges, setEdges] = useState([]);
const [familyMembers, setFamilyMembers] = useState([]);
const [unions, setUnions] = useState([]);


useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch family members and unions from the database
            const familyMembers = await fetchFamilyMembers();
            const unions = await fetchUnions();
            setFamilyMembers(familyMembers);
            setUnions(unions);
      // Log the fetched data to the console for debugging
        
        function createGraph() {
const childNodes=familyMembers.map(member => ({
    id: member.id,
    width: NODE_WIDTH,
    height:NODE_HEIGHT,
    layoutOptions:{

    }
}));


console.log('Child Nodes after adding rowLevels:', childNodes);
// 3. Assemble all your relationships (Parents AND Spouses) into a combined ELK Edge Array
const combinedEdges = [];

//Create edges for parent-child relationships
familyMembers.forEach(member => {
    if (member.father_id) {
        combinedEdges.push({
            id: `edge-${member.father_id}-${member.id}`,
            source: member.father_id,
            target: member.id
        });
    }

    if (member.mother_id) {
        combinedEdges.push({
            id: `edge-${member.mother_id}-${member.id}`,
            source: member.mother_id,
            target: member.id
        });
    }
});
console.log('Combined Edges:', combinedEdges);
//Create edges for spouse relationships
unions.forEach(union => {
    combinedEdges.push({
        id: `edge-union-${union.partner_1_id}-${union.partner_2_id}`,
        source: union.partner_1_id,
        target: union.partner_2_id
    });
});

// 4. Construct the complete single-object layout graph contract
const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',          // Uses ELK's flagship multi-layered hierarchy strategy
      'elk.direction': 'DOWN',             // Flows generations top-to-bottom
      'elk.spacing.nodeNode': '60',        // Horizontal spacing margin between siblings
      'elk.layered.spacing.nodeNodeBetweenLayers': '100', // Vertical distance between generation tiers
      'elk.edgeRouting': 'POLYLINE',       // Directs connection lines to bend nicely
    },
    children: childNodes,
    edges: combinedEdges,
};

try {
const createLayout = async () => {
// 5. Await the math layout calculations promise
const layoutedGraph = await elk.layout(graph);
const reactFlowNodes = layoutedGraph.children.map((node) => {
const person=familyMembers.find(member => member.id === node.id);
return {
    id: node.id,
    position: { x: node.x, y: node.y },
    data:{label:`${person.name}`}
}
});
console.log('Nodes:', reactFlowNodes);
setNodes(reactFlowNodes);
};
createLayout();
const reactFlowEdges=[];
const createEdges = () => {
familyMembers.forEach(member => {

if(member.father_id) {
reactFlowEdges.push({
    id:`edge-${member.father_id}-${member.id}`,
    source:member.father_id,
    target:member.id
})      
}

if(member.mother_id) {
reactFlowEdges.push({
    id:`edge-${member.mother_id}-${member.id}`,
    source:member.mother_id,
    target:member.id
});  
}    
});
unions.forEach(union => {
reactFlowEdges.push({
    id:`edge-union-${union.partner_1_id}-${union.partner_2_id}`,
    source:union.partner_1_id,
    target:union.partner_2_id
});  
});
setEdges(reactFlowEdges);
}
console.log('Edges:', reactFlowEdges);   
createEdges();
} catch (error) {
    console.error('Error laying out graph:', error);
}
}

        createGraph();    
            
            // You can now use this data to create nodes and edges for your React Flow diagram
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();

}, []); 
return (
    <div className="w-full h-screen bg-cream text-black">
<ReactFlow nodes={nodes} edges={edges} fitView>
<Background gap={16}/>
<Controls />

</ReactFlow>
    </div>
);
}