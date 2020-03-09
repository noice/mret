var ws = new WebSocket("ws://localhost:8080");
var inputText = "";
var terminal = document.getElementById('terminal');

var dcolor = 'white';
var acolor = dcolor;

var brightness = 0;

var dbgcolor = 'black';
var abgcolor = dbgcolor;

var colormap = {
    0: 'black',
    1: 'maroon',
    2: 'green',
    3: 'olive',
    4: 'navy',
    5: 'purple',
    6: 'teal',
    7: 'silver'
};

var brcolormap = {
    0: 'gray',
    1: 'red',
    2: 'lime',
    3: 'yellow',
    4: 'blue',
    5: 'magenta',
    6: 'cyan',
    7: 'white'
};

ws.onmessage = function(data) {
    //console.log(data);
    let incomingMessage = data.data;
    showMessage(incomingMessage);
}

function handleCGR(buf) {
    for(let it of buf) {
        switch(it) {
            case 0:
                acolor = dcolor;
                abgcolor = dbgcolor;
                brightness = 0;
                break;
            case 1:
                brightness = 1;
                break;
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
                if(brightness)
                    acolor = brcolormap[it % 10];
                else 
                    acolor =   colormap[it % 10];
                break;
            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
                if(brightness)
                    abgcolor = brcolormap[it % 10];
                else 
                    abgcolor =   colormap[it % 10];
                break;
            default:
                break;
        }
    }
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
    let regex = /\x1B\[\??((?:\d*)(?:\;(?:\d*))*)([ABCDEFGHJKSTfmnsulh])/; 
    let result = regex.exec(message);

    if(!result)
        return 0;

    let buf = result[1].split(';');
    let code = result[2];

    for(let i = 0; i < buf.length; i ++) {
        if(buf[i]){
            buf[i] = Number(buf[i]);
        } else {
            buf[i] = 0;
        }
    }

    switch(code){
        case 'm':
            handleCGR(buf);
            break;
        default:
            break;
    }

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
