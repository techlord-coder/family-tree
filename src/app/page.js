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
if(member.name=="Titus, Njoki & Macharia Family"){
        return false;
    }

if(member.father_id===null && member.mother_id===null){

    return true;

}

else{

    return false;

}

}
function checkSpouse(unions, memberId) {
    let spouse= unions.find(union => union.partner_1_id === memberId || union.partner_2_id === memberId);
if(spouse){
let spouseId=spouse.partner_1_id===memberId ? spouse.partner_2_id : spouse.partner_1_id;
return {foundSpouse:true, spouseId:spouseId};
}
else{
    return {foundSpouse:false, spouseId:null};
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
            let familyMembers = await fetchFamilyMembers();
            const unions = await fetchUnions();
            familyMembers = familyMembers.map(member => ({ ...member, Inserted: false })); // Add Inserted property to each member
            setFamilyMembers(familyMembers);
            setUnions(unions);
      // Log the fetched data to the console for debugging
        
        function createGraph() {
const childNodes=[];
familyMembers.forEach((member,index) => {
let memberId=member.id;
let spouse=unions.find(union=>union.partner_1_id===memberId || union.partner_2_id===memberId);
let spouseId=null;
let spouseMember=null;
if(spouse){

    spouseId=spouse.partner_1_id===memberId ? spouse.partner_2_id : spouse.partner_1_id;
    //Find the spouse member object
     spouseMember=familyMembers.find(member=>member.id===spouseId);
 
}
console.log(`The ${index} spouseId for ${member.name} is ${spouseId}`);
console.log(`The inserted status for ${member.name} is ${member.Inserted}`);
    if(spouseId!==null && !member.Inserted){
console.log(`Creating subgraph for couple: ${member.name} and ${spouseMember.name}`);
   spouseMember.Inserted=true;   
    //create a subgraph for the couple
    childNodes.push({
        id:`${memberId}-${spouseId}`,
        layoutOptions:{
            'elk.algorithm':'layered',
            'elk.direction':'RIGHT',
            'elk.layered.spacing.nodeNodeBetweenLayers':'50',
        },
        children:[
            {
                id:memberId,
                width:NODE_WIDTH,
                height:NODE_HEIGHT,
                layoutOptions:{
                    'elk.algorithm':'layered',
                }
            },
            {
                id:spouseId,
                width:NODE_WIDTH,
                height:NODE_HEIGHT,
                layoutOptions:{

                }
            }
        ],
        edges:[
            {
                id:`edge-${memberId}-${spouseId}`,
                source:memberId,
                target:spouseId
            }
        ]
    });

    }
        
        
  
else if(spouseId==null && !member.Inserted){
    childNodes.push({
    id: member.id,
    width: NODE_WIDTH,
    height:NODE_HEIGHT,
    layoutOptions:{

    }
    });
    }
});



// 3. Assemble all your relationships (Parents AND Spouses) into a combined ELK Edge Array
const combinedEdges = [];

//Create edges for parent-child relationships
familyMembers.forEach(member => {
    const isFatherOutsider = checkOutsider(familyMembers, member.father_id);
    const isMotherOutsider = checkOutsider(familyMembers, member.mother_id);

    if (member.father_id && !isFatherOutsider) {
const father=familyMembers.find(father => father.id === member.father_id);
let isSubgraphFather=checkSpouse(unions, father.id);
let isSubgraphChild=checkSpouse(unions, member.id);
let sourceId=isSubgraphFather.foundSpouse ? `${father.id}-${isSubgraphFather.spouseId}` : father.id;
let targetId=isSubgraphChild.foundSpouse ? `${member.id}-${isSubgraphChild.spouseId}` : member.id;

        combinedEdges.push({
            id: `edge-${member.father_id}-${member.id}`,
            source: sourceId,
            target: targetId
        });
        
}

    if (member.mother_id && !isMotherOutsider) {
        const mother=familyMembers.find(mother => mother.id === member.mother_id);
        const isSubgraphMother=checkSpouse(unions, mother.id);
        const isSubgraphChild=checkSpouse(unions, member.id);
        const sourceId=isSubgraphMother.foundSpouse ? `${mother.id}-${isSubgraphMother.spouseId}` : mother.id;
        const targetId=isSubgraphChild.foundSpouse ? `${member.id}-${isSubgraphChild.spouseId}` : member.id;
        combinedEdges.push({
            id: `edge-${member.mother_id}-${member.id}`,
            source: sourceId,
            target: targetId
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
console.log("Nodes:", childNodes);
// 4. Construct the complete single-object layout graph contract
const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',          // Uses ELK's flagship multi-layered hierarchy strategy
      'elk.direction': 'DOWN',             // Flows generations top-to-bottom
      'elk.spacing.nodeNode': '60',        // Horizontal spacing margin between siblings
      'elk.layered.spacing.nodeNodeBetweenLayers': '100', // Vertical distance between generation tiers
      'elk.edgeRouting': 'POLYLINE',       // Directs connection lines to bend nicely
      'elk.layered.crossingMinimization.forceNodeRealignment': 'true' 
    },
    children: childNodes,
    edges: combinedEdges,
};

try {
const createLayout = async () => {
// 5. Await the math layout calculations promise
const layoutedGraph = await elk.layout(graph);
const reactFlowNodes = [];
layoutedGraph.children.forEach((node) => {
    if(node.children && node.children.length>0){
reactFlowNodes.push({
    id:node.id,
    type:'group',
    position:{x:node.x, y:node.y},
    data:{label:node.id},
    style:{backgroundColor:'#f0f0f0', border:'1px solid #000', padding:'10px',width:node.width, height:node.height},

})
node.children.forEach((childNode)=>{
const person=familyMembers.find(member=>member.id === childNode.id);
    reactFlowNodes.push({
        id:childNode.id,
        type:'default',
        parentId:node.id,
        extent:'parent',
        position:{x:childNode.x, y:childNode.y},
        data:{label:`${person.name}`},
        sourcePosition:'right',
        targetPosition:'left',
        style:{width:childNode.width, height:childNode.height}
    });
});
    }
else{
const person=familyMembers.find(member => member.id === node.id);
reactFlowNodes.push({
    id: node.id,
    position: { x: node.x, y: node.y },
    data:{label:`${person.name}`}
});
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