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
    let regex = /\x1B\]0\;(^\x07*)\x07/; 
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

