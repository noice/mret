var ws = new WebSocket("ws://localhost:8080");
var inputText = "";

var dcolor = 'white';
var acolor = dcolor;

var brightness = 0;

var dbgcolor = 'black';
var abgcolor = dbgcolor;

var curcolor = dcolor;
var curbgcolor = dbgcolor;

var dcurcolor = 'black';
var dcurbgcolor = 'white';

var colormap = {
    0: 'black',
    1: 'maroon',
    2: 'green',
    3: 'olive',
    4: 'blue',
    5: 'purple',
    6: 'teal',
    7: 'silver'
};

var brcolormap = {
    0: 'gray',
    1: 'red',
    2: 'lime',
    3: 'yellow',
    4: 'cornflowerblue',
    5: 'magenta',
    6: 'cyan',
    7: 'white'
};

var col8bitmap = {
    0: '00',
    1: '5F',
    2: '87',
    3: 'AF',
    4: 'D7',
    5: 'FF'
};

var curx;
var cury;
var terminal;
init();

function init() {
    curx = 0;
    cury = 0;

    terminal = document.getElementById('terminal');
    terminal.appendChild(document.createElement('div'));
    let charElem = document.createElement('span');
    charElem.appendChild(document.createTextNode('\xA0'));
    charElem.style.color = dcurcolor;
    charElem.style.backgroundColor = dcurbgcolor;
    terminal.lastElementChild.appendChild(charElem);
}

ws.onmessage = function(data) {
    //console.log(data);
    let incomingMessage = data.data;
    showMessage(incomingMessage);
}

function handleCGR(buf) {
    for(let i = 0; i < buf.length; i ++) {
        let it = buf[i];
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

            case 38: //256 colors
                if(buf[i + 1] == 5){
                    let col = buf[i + 2];
                    if(col < 8)
                        acolor =   colormap[col];
                    else if(col < 16)
                        acolor = brcolormap[col + 8];
                    else if(col < 232){
                        col -= 16;
                        let redcolor = col8bitmap[parseInt(col/36)];
                        let gcol = col % 36;
                        let bluecolor = col8bitmap[gcol % 6];
                        gcol = parseInt(gcol / 6);
                        let greencolor = col8bitmap[gcol];

                        acolor = '#' + redcolor + greencolor + bluecolor;
                    } else {
                        let t = 8;
                        t += (col - 232) * 10;
                        acolor = 'rgb(' + t.toString() + ',' + t.toString() + ',' + t.toString() + ')';
                    }
                    //TODO
                    i += 2;
                } else if(buf[i + 1] == 2){
                    acolor = 'rgb(' + buf[i + 2].toString() + ',' + buf[i + 3].toString() + ',' + buf[i + 4].toString() + ')';
                    i += 4;
                }
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

function handleCSI(message) {
    let regex = /\x1B\[\??((?:\d*)(?:\;(?:\d*))*)([ABCDEFGHJKPSTfmnsulh])/; 
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
        case 'C':
            //TODO: if curx + 1 span exist
            changeCurPos(curx, cury, curx + 1, cury);
            curx ++;
            break;
        case 'P':
            let curdiv = terminal.childNodes[cury];
            changeCurPos(curx, cury, curx + 1, cury);
            curdiv.removeChild(curdiv.childNodes[curx]);
            break;
        case 'K':
            if(buf[0] == 0){
                let curdiv = terminal.childNodes[cury];
                changeCurPos(curx, cury, curdiv.childNodes.length - 1, cury);
                while(curdiv.childNodes[curx] != curdiv.lastElementChild){
                    curdiv.removeChild(curdiv.childNodes[curx]);
                }
            }
            break;
        default:
            break;
    }

    //console.log(result[0]);

    return result[0].length - 1;
}

function handleOSC(message) {
    console.log("Привет");
    let regex = /\x1B\]0\;(.*)\x07/; 
    let result = regex.exec(message);

    if(!result)
        return 0;

    let title = result[1];

    document.title = title;

    //console.log(result[0]);

    return result[0].length - 1;
}

function changeCurPos(prevcurx, prevcury, newcurx, newcury) {
    prevcur = terminal.childNodes[prevcury].childNodes[prevcurx];
    prevcur.style.color = curcolor;
    prevcur.style.backgroundColor = curbgcolor;

    newcur = terminal.childNodes[newcury].childNodes[newcurx];
    curcolor = newcur.style.color;
    curbgcolor = newcur.style.backgroundColor;

    newcur.style.color = dcurcolor;
    newcur.style.backgroundColor = dcurbgcolor;
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
        init();
    }

    for(let i = 0; i < message.length; i ++){
        let curdiv;
        let charElem;
        console.log(message[i] + ' - ' + message.charCodeAt(i).toString(16));
        switch(message[i]){
            case '\x1B':
                switch(message[i + 1]){
                    case '[':
                        i += handleCSI(message.slice(i));
                        break;
                    case ']':
                        i += handleOSC(message.slice(i));
                    default:
                        break;
                }
                break;

            case '\n':
                curdiv = terminal.childNodes[cury]
                if(curdiv.nextSibling)
                    terminal.insertBefore(document.createElement('div'), curdiv.nextSibling);
                else
                    terminal.appendChild(document.createElement('div'));

                charElem = document.createElement('span');
                charElem.appendChild(document.createTextNode('\xA0'));
                charElem.style.color = dcolor;
                charElem.style.backgroundColor = dbgcolor;
                curdiv.nextSibling.appendChild(charElem);

                changeCurPos(curx, cury, 0, cury + 1);
                
                curdiv.removeChild(curdiv.lastElementChild);
                
                curx  = 0;
                cury += 1;
                break;

            case '\r': //CR
                break;

            case '\x07': //BELL
                break;

            case '\x08': //Backspace
                if(curx > 0){
                    changeCurPos(curx, cury, curx - 1, cury);
                    curx --;
                }
                break;

            default:
                curdiv = terminal.childNodes[cury];
                if(curx < curdiv.childNodes.length){
                    charElem = curdiv.childNodes[curx];
                    charElem.innerText = message[i];
                    curcolor = acolor;
                    curbgcolor = abgcolor;

                    if(charElem == curdiv.lastElementChild){
                        charElem = document.createElement('span');
                        charElem.appendChild(document.createTextNode('\xA0'));
                        charElem.style.color = dcolor;
                        charElem.style.backgroundColor = dbgcolor;
                        curdiv.append(charElem);
                    }

                    changeCurPos(curx, cury, curx + 1, cury);
                    curx ++;
                } else {
                    //TODO
                }

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
                ws.send('\r');
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
            case "ArrowLeft":
                ws.send("\x1B[D");
                break;
            case "ArrowUp":
                ws.send("\x1B[A");
                break;
            case "ArrowRight":
                ws.send("\x1B[C");
                break;
            case "ArrowDown":
                ws.send("\x1B[B");
                break;
            default:
                break;
        } 
    }

    lastTime = Date.now();
}

addEventListener("keydown", handle);
//ws.onopen = () => ws.send('echo "hello world!"\n');
