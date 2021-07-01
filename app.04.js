// 0.4 fiber 设计一种结构让render支持被切片、中断、继续执行，简而言之可被调度
/**
 * 处理一个fiber的过程，是时间分片调度的最小任务单位
 * 处理当前切片的任务
 * 返回下一个切片的任务
 * 
 * react根据对象渲染dom的方式是 DFS 类似二叉树前序遍历  
 * 让二叉树的递归遍历可中断，除了当前节点能找到子节点，还要当前节点能找到父节点，也要能找到下一个兄弟节点才可以办到。
 * 尽量找子节点，没有再找下一个兄弟节点，再没有再找父节点
 * */
function performUnitOfWork(fiber){
    // 创建节点 // 设置属性 
    if(!fiber.dom){fiber.dom = createDom(fiber) }
    // 插入dom 
    if(fiber.parent){
        fiber.parent.dom.appendChild(fiber.dom);
    }
    // 为子节点创建fiber
    const elements = fiber.props.children;
    let index = 0;
    let prevSibing = null;

    while(index < elements.length){
        const element = elements[index];
        const newFiber={
            type:element.type,
            props:element.props,
            parent:fiber,
            dom:null,
        }
        if(index===0){
            fiber.child = newFiber
        }else{
            prevSibing.sibling = newFiber
        }
        prevSibing = newFiber;
        index ++ 
    }

    // 返回fiber的下一个节点
    if(fiber.child){
        return fiber.child
    }
    let nextFiber = fiber;

    while(nextFiber){
        if(nextFiber.sibling){
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

function workLoop(deadline){
    let shouldYield = false;
    // 这样写 进入workLoop至少会取一个任务执行
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        // 为啥要小于1 才 shouldYield呢？因为yild是让步的意思，小于1就别接着while了
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop);

const Didact={
    createElement(type,props,...children){
        return {
            type,
            props:{
                ...props,
                children: children.map(child=>{
                    return typeof child==='object' ? child : createTextNode(child)
                })
            }
        }
    },
    render
}

let nextUnitOfWork = null;

function render(element,container){
    // TODO set next unit of work
    nextUnitOfWork = {
        dom: container,
        props:{
            children: [element]
        }
    }
}


function createTextNode(text){
    return {
        type: 'TEXT_ELEMENT',
        props:{
            nodeValue:text,
            children:[]
        }
    }
}


/** @jsx Didact.createElement */
const element = (
    <div titile="foo">
        <a>2312</a>
        <hr />
    </div>
);

const container = document.getElementById('root');
Didact.render(element,container);





