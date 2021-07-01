// 0.5 Render and Commit Phases 渲染和提交阶段
/**
 * 频繁插入了dom
 * */
function performUnitOfWork(fiber){
    // 创建节点 // 设置属性 
    if(!fiber.dom){fiber.dom = createDom(fiber) }
    // 插入dom 
    // if(fiber.parent){
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }

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
    // 如果走出循环说明什么都没有了，wipRoot是没有parent的，return也是undefined
}

function commitRoot(){
    // 批量把dom插入到wipRoot
    commitWork(wipRoot.child)
    wipRoot=null;
}

function commitWork(fiber){
    if(!fiber){ // 说明到没有子节点或者没有下一个兄弟了
        return
    }
    const domParent = fiber.parent.dom;
    domParent.appendChild(fiber.dom);
    // 前序遍历
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function workLoop(deadline){
    let shouldYield = false;
    
    // 这样写 进入workLoop至少会取一个任务执行，为啥不把deadline.timeRemaining()放前面呢
    // 因为workLoop被调用了说明还有剩余有时间
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        // 为啥要小于1 才 shouldYield呢？因为yild是让步的意思，小于1就别接着while了
        shouldYield = deadline.timeRemaining() < 1;
        // 有个疑问 timeRemaining在函数内部会变？打印了下,真的会变...
    }

    if(!nextUnitOfWork && wipRoot){
        commitRoot();
    }

    requestIdleCallback(workLoop);
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
let wipRoot = null;

function render(element,container){
    // TODO set next unit of work
    wipRoot={
        dom:container,
        props:{
            children:[element]
        }
    };
    nextUnitOfWork = wipRoot
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





