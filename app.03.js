// 0.3 Concurrent Mode , 并发模式，解决渲染执行可能阻塞主线程过久的问题 运用时间切片调度算法
/**
 * scheduler 调度器 
 * */ 
let nextUnitOfWork = null;

/**
 * 处理当前切片的任务
 * 返回下一个切片的任务 
 * */
function performUnitOfWork(nextUnitOfWork){

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
    render( element , container){
        const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);
        // 处理props
        const isProperty=n=>n!=='children';

        Object.keys(element.props).filter(isProperty).forEach(name=>{
            dom[name] = element.props[name];
        })

        element.props.children.forEach(child=>Didact.render(child,dom));

        container.appendChild(dom);
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





