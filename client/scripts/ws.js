var ws = new WebSocket("ws://" + window.location.host);

var dataQueue = [];
var isWorking = 0;

ws.onopen = () => {
    initTerminal();
    setNewSize();
};

ws.onmessage = (data) => {
    let incomingMessage = data.data;
    dataQueue.push(incomingMessage);
    
    if(!isWorking){
        isWorking = 1;
        newData();
    }
};

function newData(){
    while(dataQueue.length){
        let newestMsg = dataQueue.shift();
        console.log(newestMsg)
        for(let nchar of newestMsg){
            nextChar(nchar);
        }
        commitChanges();
    }
    isWorking = 0;
}

