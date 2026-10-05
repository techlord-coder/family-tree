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

function checkOutsider(familyMembers,memberId){
if (memberId===null){
    return true;
}
const member=familyMembers.find(member=>member.id===memberId);
if(member.name=="Titus Macharia Wanyiri"){
        return false;
    }

if(member.father_id===null && member.mother_id===null){

    return true;

}

else{

    return false;

}

}

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
            await SeedDatabase(); // Seed the database with family members and unions
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



// 3. Assemble all your relationships (Parents AND Spouses) into a combined ELK Edge Array
const combinedEdges = [];
let numberOfEdges=0;
//Create edges for parent-child relationships
familyMembers.forEach(member => {
    const isFatherOutsider = checkOutsider(familyMembers, member.father_id);
    const isMotherOutsider = checkOutsider(familyMembers, member.mother_id);

    if (member.father_id && !isFatherOutsider) {
const father=familyMembers.find(father => father.id === member.father_id);
console.log(`${father.name} is the father of ${member.name}`);
        combinedEdges.push({
            id: `edge-${member.father_id}-${member.id}`,
            source: member.father_id,
            target: member.id
        });
        numberOfEdges++;
        console.log(`Added edge from ${father.name} to ${member.name}. Total edges: ${numberOfEdges}`);
    }

    if (member.mother_id && !isMotherOutsider) {
        const mother=familyMembers.find(mother => mother.id === member.mother_id);
        console.log(`${mother.name} is the mother of ${member.name}`);
        combinedEdges.push({
            id: `edge-${member.mother_id}-${member.id}`,
            source: member.mother_id,
            target: member.id
        });
        numberOfEdges++;
        console.log(`Added edge from ${mother.name} to ${member.name}. Total edges: ${numberOfEdges}`);
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
const isFatherOutsider = checkOutsider(familyMembers, member.father_id);
const isMotherOutsider = checkOutsider(familyMembers, member.mother_id);

if(member.father_id && !isFatherOutsider) {
reactFlowEdges.push({
    id:`edge-${member.father_id}-${member.id}`,
    source:member.father_id,
    target:member.id
})      
}

if(member.mother_id && !isMotherOutsider) {
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