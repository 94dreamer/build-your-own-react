// 0.6 Reconciliation 协调
/**
 * 想要解决更新的问题
 * */
function createDom(fiber){  // 这里很容易漏掉啊 
    const dom = fiber.type==='TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
    updateDom(dom,{},fiber.props);
    return dom;
}
function performUnitOfWork(fiber){
    // 创建节点 // 设置属性 
    if(!fiber.dom){
        // 为啥会进这里 新节点
        fiber.dom = createDom(fiber) 
    }

    // 为子节点创建 fiber
    const elements = fiber.props.children;
    reconcileChildren(fiber,elements);

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
    }// 如果走出循环说明什么都没有了，wipRoot是没有parent的，return也是undefined
}

function reconcileChildren(wipFiber,elements){
    let index = 0;
    // 为啥不从 currentRoot拿呢？
    let oldFiber = wipFiber.alternate &&  wipFiber.alternate.child;

    let prevSibling = null;

    while(
        index < elements.length || 
        oldFiber!=null
    ){
        const element = elements[index];
        let newFiber = null;
        // todo compare oldFiber to element
        const sameType= element && oldFiber && element.type == oldFiber.type;

        if(sameType){
            // 更新props就好了
            newFiber={
                type:element.type,
                props:element.props,
                parent:wipFiber,
                dom:oldFiber.dom,
                alternate:oldFiber, // 真是骚 这里也要引用
                effectTag:"UPDATE",
            }
        }
        if(element && !sameType){
            // 插入新节点
            newFiber={
                type:element.type,
                props:element.props,
                parent:wipFiber,
                dom:null,   // 为啥这里不用 element.dom 呢？ 因为没有，真是骚，用createDom函数来处理了
                alternate:null,
                effectTag:"PLACEMENT",
            }
        }
        if(oldFiber && !sameType){
            // 删除老节点
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }

        if(oldFiber){
            oldFiber=oldFiber.sibling
        }
        if(index===0){
            wipFiber.child = newFiber
        }else if(element){
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber;
        index ++ 
    }
}

const isEvent = key=>key.startsWith('on');
const isProperty = key => key!== 'children' && !isEvent(key);
const isNew =(prev,next)=> key=>prev[key]!==next[key];
const isGone = (pre,next)=> key=> !(key in next);

function updateDom(dom,prevProps,nextProps){
    // remove old properties
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key=>
            !(key in nextProps) || isNew(prevProps)(key)
        )
        .forEach(name=>{
            const eventType = name.toLowerCase().substring(2);
            dom.removeEventListener(eventType,prevProps[name]);
        });

    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps,nextProps))
        .forEach(name=>{
            dome[name] = ''
        })

    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps,nextProps))
        .forEach(name=>{
            dom[name] = nextProps[name]
        })
    // 添加 event
    Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps,nextProps)).forEach(name=>{
        const eventType = name.toLowerCase().substring(2);
        dome.addEventListener(eventType,nextProps[name]);
    })
}

function commitRoot(){
    // 批量把dom插入到wipRoot
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot=null;
}

function commitWork(fiber){
    if(!fiber){ // 说明到没有子节点或者没有下一个兄弟了
        return
    }
    const domParent = fiber.parent.dom;
    if(fiber.effectTag==='PLACEMENT' && fiber.dom !=null){
        domParent.appendChild(fiber.dom);
    }else if(fiber.effectTag === 'UPDATE' && fiber.dom !=null){
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    }else if(fiber.effectTag === 'DELETION'){
        domParent.removeChild(fiber.dom)
    }
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
let currentRoot=null;
let wipRoot = null;
let deletions = null;

function render(element,container){
    wipRoot={
        dom:container,
        props:{
            children:[element]
        },
        // 有点困惑，这样不是会内存泄露吗
        alternate: currentRoot,
    };
    // 每次新的render去重置删除列表
    deletions = [];
    nextUnitOfWork = wipRoot;
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

// function App(props){
//     return <h1>Hi {props.name}</h1>
// }

const container = document.getElementById('root');
Didact.render(element,container);





