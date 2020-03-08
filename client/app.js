let ws = new WebSocket("ws://localhost:8080");
let inputText = "";
let terminal = document.getElementById('terminal');

ws.onmessage = function(data) {
    //console.log(data);
    let incomingMessage = data.data;
    showMessage(incomingMessage);
}

function showMessage(message) {
    let messagesplit = message.split('\n');
    let first = messagesplit.shift();

    if(!terminal.lastElementChild){
        let messageElem = document.createElement('div');
        messageElem.appendChild(document.createTextNode(first));
        terminal.appendChild(messageElem);
    } else {
        terminal.lastElementChild.innerText += first;
        //terminal.lastElementChild.style.background = "yellow";
    }

    for(let it of messagesplit){
        let messageElem = document.createElement('div');
        messageElem.appendChild(document.createTextNode(it));
        terminal.appendChild(messageElem);
    }
}



//kinput.onkeydown = kinput.onkeyup = kinput.onkeypress = handle;
let lastTime = Date.now();

function handle(e) {
    /*
    let text = e.type +
            ' key=' + e.key +
            ' code=' + e.code +
            (e.shiftKey ? ' shiftKey' : '') +
            (e.ctrlKey ? ' ctrlKey' : '') +
            (e.altKey ? ' altKey' : '') +
            (e.metaKey ? ' metaKey' : '') +
            (e.repeat ? ' (repeat)' : '') +
            "\n";
    */
    if(e.type == "keydown"){
        if(e.key.length == 1){
            ws.send(e.key);
        } else if(e.key == "Enter") {
            ws.send('\n');
        }
    }

    lastTime = Date.now();

    /*area.value += text;

    if (form.elements[e.type + 'Stop'].checked) {
            e.preventDefault();
    }*/
}

//function keyListener(e){}
addEventListener("keydown", handle);
//ws.onopen = () => ws.send('echo "hello world!"\n');
