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

    window.scrollTo(0,document.body.scrollHeight);
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
            if(!e.ctrlKey){
                ws.send(e.key);
            } else {
                if(e.code.startsWith("Key")){
                    ws.send(String.fromCharCode(e.code.charCodeAt(3) - 'A'.charCodeAt(0) + 1));
                }
            }
        } else switch(e.key) {
            case "Enter":
                ws.send('\n');
                break;
            case "Escape":
                ws.send("\x1B");
                break;
            case "Backspace":
                ws.send("\x08");
                break;
            case "Tab":
                ws.send("\x09");
                break;
            case "Delete":
                ws.send("\x7F");
                break;
            default:
                break;
        } 
    }

    lastTime = Date.now();
}

addEventListener("keydown", handle);
//ws.onopen = () => ws.send('echo "hello world!"\n');
