var ws = new WebSocket("ws://" + window.location.host + '/ws');

var data_queue = [];
var is_working = 0;

ws.onmessage = function(data) {
    let incomingMessage = data.data;
    data_queue.push(incomingMessage);
    
    if(!is_working){
        is_working = 1;
        new_data();
    }
}

function new_data(){
    while(data_queue.length){
        let newest_msg = data_queue.shift();
        console.log(newest_msg)
        for(let next_char of newest_msg){
            nextChar(next_char);
        }
    }
    is_working = 0;
}

ws.onopen = () => setNewSize();
