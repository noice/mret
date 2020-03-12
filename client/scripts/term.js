var curx;
var cury;

var escape_state = 0;
var escape_sequence = '';
var CSI_priv = '';
var OSC_msg = '';

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

function changeCurPos(prevcurx, prevcury, newcurx, newcury) {
    if (terminal.childNodes.length > prevcury && 
        terminal.childNodes[prevcury]         &&
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

function handleCSI() {
    let buf = escape_sequence.split(';');
    let code = CSI_priv;

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
        case '?h':
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
        case '?l':
            if(buf[0] == 1049 && curx != -1){
                [curx, alternate_curx] = [alternate_curx, curx];
                [cury, alternate_cury] = [alternate_cury, cury];

                [terminal.innerHTML, alternate_screen] = [alternate_screen, terminal.innerHTML];
            }
            break;
        default:
            break;
    }
}

function handleOSC(next_char) {
    if(escape_sequence.length > 2 && escape_sequence.slice(-1) == '\x07'){
        escape_state = 0;
    } else if(escape_sequence.length > 2 && escape_sequence.slice(-2) == '\x1b\\'){
        escape_state = 0;
    }

    if(escape_sequence.length == 3 && escape_sequence != ']0;'){
        escape_state = 0;
    }

    escape_sequence += next_char;
    //console.log(escape_sequence);

    if(escape_sequence.length > 2 && escape_sequence.slice(-1) == '\x07'){
        let title = escape_sequence.slice(3, -1);
        document.title = title;
    } else if(escape_sequence.length > 2 && escape_sequence.slice(-2) == '\x1b\\'){
        let title = escape_sequence.slice(3, -2);
        document.title = title;
    }
}

function parseCSI(next_char) {
    //TODO
    if(CSI_priv.length && CSI_priv.slice(-1) != '?'){
        console.log(CSI_priv + ' - ' + escape_sequence);
        escape_state = 0;
        return;
    }

    if(next_char == '?') {
        if (CSI_priv || escape_sequence.length)
            escape_state = 0;
        CSI_priv = '?';
    } else if('@ABCDEFGHIJKLMPSTXZ^`abcdefghilmnpqrstuvwxyz{|}~'.indexOf(next_char) != -1) {
        CSI_priv += next_char;
        handleCSI();
    } else if(escape_sequence.length == 0 && next_char != '[') {
        if (';0123456789'.indexOf(next_char) == -1){
            escape_state = 0;
        }
        escape_sequence += next_char;
    } else if(escape_sequence.length){
        if (';0123456789'.indexOf(next_char) == -1){
            escape_state = 0;
        }
        escape_sequence += next_char;
    }
}


function handleEscape(next_char){
    if(escape_state == 1){
        if('DEHMNOPVWXZ[]^_ #%()*+-./6789=>Fclmno|}~'.indexOf(next_char) == -1)
            escape_state = 0;
        else {
            escape_state = next_char;
            escape_sequence = '';
            CSI_priv = '';
        }
    }

    switch(escape_state){
        case '[':
            parseCSI(next_char);
            break;

        case ']':
            handleOSC(next_char);
            break;

        case ' ':
        case '#':
        case '%':
        case '(':
        case ')':
        case '*':
        case '+':
        case '-':
        case '.':
        case '/':
            // Skip symbol after sequence
            if(escape_sequence.length == 2){
                escape_state = 0;
            } else {
                escape_sequence += next_char;
            }
            break;

        default:
            escape_state = 0;
            break;
    }
}

function nextChar(next_char) {
    if(escape_state) {
        handleEscape(next_char);
        if(escape_state)
            return;
    }

    switch(next_char) {
        case '\x1b':
            escape_state = 1;
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
            printChar(next_char);
            break;
    }

    window.scrollTo(0, document.body.scrollHeight);
}


function printChar(next_char){
    while (terminal.childNodes.length <= cury){
        terminal.appendChild(document.createElement('div'));
    }
  
    while (terminal.childNodes[cury].childNodes.length <= curx){
        let charElem = document.createElement('span');
        charElem.appendChild(document.createTextNode('\xA0'));
        charElem.style.color = dcolor;
        charElem.style.backgroundColor = dbgcolor;
        
        terminal.childNodes[cury].appendChild(charElem);
    }

    terminal.childNodes[cury].childNodes[curx].innerText = next_char;
    curcolor = acolor;
    curbgcolor = abgcolor;

    changeCurPos(curx, cury, curx + 1, cury);
    curx ++;
}
