
import {Handle, Position} from '@xyflow/react';

export function CustomContainer({children}) {
return (
    <>
        {children}
    <div className="w-[100px] h-[50px] bg-light-blue-500 rounded-lg flex flex-col items-center justify-center relative">
<Handle type="target" position={Position.Top} id="group-top" />
<Handle type="source" position={Position.Bottom} id="group-bottom" />
    </div>
    </>
)
}