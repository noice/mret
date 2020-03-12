var curx;
var cury;

var alternate_screen = '';
var alternate_curx = -1;
var alternate_cury = -1;

var saved_curx = 0;
var saved_cury = 0;

var cur_visible = 0;

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
        case 'A': //Cursor Up
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, curx, cury - buf[0]);
            cury -= buf[0];
            break;
        case 'B': //Cursor Down
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, curx, cury + buf[0]);
            cury += buf[0];
            break;
        case 'C': //Cursor Right
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, curx + buf[0], cury);
            curx += buf[0];
            break;
        case 'D': //Cursor Left
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, curx - buf[0], cury);
            curx -= buf[0];
            break;
        case 'E': //Cursor Next Line
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, 0, cury + buf[0]);
            curx = 0;
            cury += buf[0];
            break;
        case 'F': //Cursor Previous Line
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(curx, cury, 0, cury - buf[0]);
            curx = 0;
            cury -= buf[0];
            break; 
        case 'G': //Cursor Horizontal Absolute
            buf[0] -= 1;
            changeCurPos(curx, cury, buf[0], cury);
            curx = buf[0];
            break; 
        case 'H': //Cursor Position
        case 'f':
            if(buf[0] > 0)
                buf[0] -= 1;
            if(buf.length == 1)
                buf.push(1);
            buf[1] -= 1;
            changeCurPos(curx, cury, buf[1], buf[0]);
            curx = buf[1];
            cury = buf[0];
            break; 
        case 'J': //Erase Data
            if(buf[0] == 0 || buf[0] == 2){
                let curdiv = terminal.childNodes[cury];
                while(curdiv.childNodes[curx] != curdiv.lastElementChild){
                    curdiv.removeChild(curdiv.childNodes[curx]);
                }
                while(curdiv != terminal.lastElementChild){
                    terminal.removeChild(terminal.lastElementChild);
                }
            } 

            if(buf[0] == 1 || buf[0] == 2){
                for (let inode = 0; inode < terminal.childNodes[cury].childNodes.length; inode++) {
                    terminal.childNodes[cury].childNodes[inode].innerText = '\xA0';
                }
                for (let inode = 0; inode < terminal.childNodes.length; inode++) {
                    while (terminal.childNodes[inode].hasChildNodes()) {
                        terminal.childNodes[inode].removeChild(terminal.childNodes[inode].firstChild);
                    }
                    let charElem = document.createElement('span');
                    charElem.appendChild(document.createTextNode('\xA0'));
                    charElem.style.color = dcolor;
                    charElem.style.backgroundColor = dbgcolor;
                    terminal.childNodes[inode].append(charElem);
                    
                }
            }
            break;
        case 'K': //Erase in Line
            if(buf[0] == 0 || buf[0] == 2){
                let curdiv = terminal.childNodes[cury];
                curdiv.childNodes[curx].innerText = '\xA0';
                while(curdiv.childNodes[curx] != curdiv.lastElementChild){
                    curdiv.removeChild(curdiv.lastElementChild);
                }
            }
            if(buf[0] == 1 || buf[0] == 2){
                let curdiv = terminal.childNodes[cury];
                for(let inode = 0; inode <= curx && inode < curdiv.childNodes.length; inode ++){
                    curdiv.childNodes[inode].innerText = '\xA0';
                }
            }
            break;
        case 'P':
            let curdiv = terminal.childNodes[cury];
            changeCurPos(curx, cury, curx + 1, cury);
            curdiv.removeChild(curdiv.childNodes[curx]);
            break;
        case 'S': //Scroll Up
            if(buf[0] == 0)
                buf[0] = 1;
            for(let i = 0; i < buf[0]; i ++){
                changeCurPos(curx, cury, curx, cury + 1);
                terminal.removeChild(terminal.firstElementChild);
            }
            break;
        case 'T': //Scroll Down
            if(buf[0] == 0)
                buf[0] = 1;
            for(let i = 0; i < buf[0]; i ++){
                terminal.insertBefore(document.createElement('div'), terminal.firstElementChild);
             
                let charElem = document.createElement('span');
                charElem.appendChild(document.createTextNode('\xA0'));
                charElem.style.color = dcolor;
                charElem.style.backgroundColor = dbgcolor;
                terminal.firstElementChild.append(charElem);
             
                changeCurPos(curx, cury + 1, curx, cury);
            }
            break;
        case 'n': //Device Status Report
            if(buf[0] == 6){
                ws.send('\x1B[' + (cury + 1) + ';' + (curx + 1)  + 'R');
                console.log('\x1B[' + (cury + 1) + ';' + (curx + 1)  + 'R');
            }
            break;
        case 's': //Save Cursor Position
            saved_curx = curx;
            saved_cury = cury;
            break;
        case 'u': //Restore Cursor Position
            changeCurPos(curx, cury, saved_curx, saved_cury);
            curx = saved_curx;
            cury = saved_cury;
            break;
        case 'h':
            if(buf[0] == 1049){
                [curx, alternate_curx] = [alternate_curx, curx];
                [cury, alternate_cury] = [alternate_cury, cury];

                [terminal.innerHTML, alternate_screen] = [alternate_screen, terminal.innerHTML];
                if(curx == -1 || cury == -1){
                    changeCurPos(curx, cury, 0, 0);
                    curx = 0;
                    cury = 0;
                }
            }
            break;
        case 'l':
            if(buf[0] == 1049 && curx != -1){
                [curx, alternate_curx] = [alternate_curx, curx];
                [cury, alternate_cury] = [alternate_cury, cury];

                [terminal.innerHTML, alternate_screen] = [alternate_screen, terminal.innerHTML];
            }
            break;
        default:
            break;
    }

    console.log(result[0]);

    return result[0].length - 1;
}

function handleOSC(message) {
    console.log("Привет");
    let regex = /\x1B\]0\;(.+)\07/; 
    regex.lastIndex = 0;
    let result = regex.exec(message);

    if(!result)
        return 0;

    console.log("Пока");

    let title = result[1];

    document.title = title;

    //console.log(result[0]);

    return result[0].length - 1;
}

function changeCurPos(prevcurx, prevcury, newcurx, newcury) {
    if (terminal.childNodes.length > prevcury && 
        terminal.childNodes[prevcury].childNodes.length > prevcurx) {
        
        prevcur = terminal.childNodes[prevcury].childNodes[prevcurx];
        prevcur.style.color = curcolor;
        prevcur.style.backgroundColor = curbgcolor;
    }

    while (terminal.childNodes.length <= newcury){
        terminal.appendChild(document.createElement('div'));
    }

    while (terminal.childNodes[newcury].childNodes.length <= newcurx){
        let charElem = document.createElement('span');
        charElem.appendChild(document.createTextNode('\xA0'));
        charElem.style.color = dcolor;
        charElem.style.backgroundColor = dbgcolor;
        
        terminal.childNodes[newcury].appendChild(charElem);
    }

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
                changeCurPos(curx, cury, curx, cury + 1);
                cury += 1;
                break;

            case '\r': //CR
                changeCurPos(curx, cury, 0, cury);
                curx = 0;
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

