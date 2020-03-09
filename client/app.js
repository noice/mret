var ws = new WebSocket("ws://localhost:8080");
var inputText = "";
var terminal = document.getElementById('terminal');

var dcolor = 'white';
var acolor = dcolor;

var dbgcolor = 'black';
var abgcolor = dbgcolor;

ws.onmessage = function(data) {
    //console.log(data);
    let incomingMessage = data.data;
    showMessage(incomingMessage);
}

function handleEscape(message) {
    /*switch(message[f]){
        case 'm':
            if (f == i || (message[i] == '0' && i + 1 == f)){
                acolor = dcolor;
                abgcolor = dbgcolor;
            }
            break;
        default:
            break;
    }*/
    let result = message.match(/\x1B\[\??(([0-9]*)*(;([0-9]*)*))([ABCDEFGHJKSTfmnsulh])/);


    if(!result)
        return 0;

    console.log(result[0]);


    return result[0].length - 1;
}

function showMessage(message) {
    /*let messagesplit = message.split('\n');

    if(terminal.lastElementChild){
        terminal.lastElementChild.innerText += messagesplit.shift();
    }

    for(let it of messagesplit){
        let messageElem = document.createElement('div');
        messageElem.appendChild(document.createTextNode(it));
        terminal.appendChild(messageElem);
    }*/
    
    if(!terminal.lastElementChild){
        terminal.appendChild(document.createElement('div'));
    }

    for(let i = 0; i < message.length; i ++){
        switch(message[i]){
            case '\x1B':
                if(message[i + 1] != '[')
                    break;
                
                i += handleEscape(message.slice(i));

                break;

            case '\n':
                terminal.appendChild(document.createElement('div'));
                break;

            default:
                let charElem = document.createElement('span');
                charElem.appendChild(document.createTextNode(message[i]));
                charElem.style.color = acolor;
                charElem.style.backgroundColor = dbgcolor;
                terminal.lastElementChild.appendChild(charElem);
                break;
        }
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
