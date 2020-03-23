var escape_state = 0;
var escape_sequence = '';
var CSI_priv = '';
var OSC_msg = '';

function Screen() {
    this.style = new Style();
    this.curx = 0;
    this.cury = 0;
    this.saved_curx = 0;
    this.saved_cury = 0;
    this.cur_visible = 1;
};

screen = new Screen();
altscreen = new Screen();

var alternate_screen = '';
var twidth  = 50;
var theight = 50;
var terminal;
init();

function init() {
    screen.curx = 0;
    screen.cury = 0;

    terminal = document.getElementById('terminal');
    terminal.appendChild(document.createElement('div'));
    let charElem = document.createElement('span');
    charElem.appendChild(document.createTextNode('\xA0'));
    charElem.style.color = defaultStyle.curcolor;
    charElem.style.backgroundColor = defaultStyle.curbgcolor;
    terminal.lastElementChild.appendChild(charElem);
}

function changeCurPos(prevcurx, prevcury, newcurx, newcury) {
    turnOffCur(prevcurx, prevcury);
    if(screen.cur_visible){
        while (terminal.childNodes.length <= newcury){
            terminal.appendChild(document.createElement('div'));
        }
 
        let contentsize = terminal.childNodes[newcury].textContent.length;
        if (contentsize <= newcurx){
            let charElem = document.createElement('span');
            charElem.appendChild(document.createTextNode('\xA0'.repeat(newcurx + 1 - contentsize)));
            charElem.style.color = defaultStyle.color;
            charElem.style.backgroundColor = defaultStyle.bgcolor;
            
            terminal.childNodes[newcury].appendChild(charElem);
        }
 
        turnOnCur(newcurx, newcury);
    }
}

function turnOffCur(x, y) {
    if (terminal.childNodes.length <= y) {
        return;
    }

    let curdiv = terminal.childNodes[y];
    let ix = 0;

    for (let i = 0; i < curdiv.childNodes.length; i ++) {
        ix += curdiv.childNodes[i].textContent.length;
    
        if (x < ix) {
            let curnode = curdiv.childNodes[i];
            curnode.textContent = curnode.textContent;
            return;
        }
    }
}

function turnOnCur(x, y){
    let curdiv = terminal.childNodes[y];
    let ix = 0;

    for (let i = 0; i < curdiv.childNodes.length; i ++) {
        ix += curdiv.childNodes[i].textContent.length;
    
        if (x < ix) {
            let curnode = curdiv.childNodes[i];
            let pos = x - (ix - curnode.textContent.length); 
            
            let text = curnode.textContent;
            let curHTML = '<span class="cursor">' + text[pos] + '</span>';
            curnode.innerHTML = text.slice(0, pos) + curHTML + text.slice(pos + 1);
            return;
        }
    }
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
            changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury - buf[0]);
            screen.cury -= buf[0];
            break;
        case 'B': //Cursor Down
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury + buf[0]);
            screen.cury += buf[0];
            break;
        case 'C': //Cursor Right
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(screen.curx, screen.cury, screen.curx + buf[0], screen.cury);
            screen.curx += buf[0];
            break;
        case 'D': //Cursor Left
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(screen.curx, screen.cury, screen.curx - buf[0], screen.cury);
            screen.curx -= buf[0];
            break;
        case 'E': //Cursor Next Line
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(screen.curx, screen.cury, 0, screen.cury + buf[0]);
            screen.curx = 0;
            screen.cury += buf[0];
            break;
        case 'F': //Cursor Previous Line
            if(buf[0] == 0)
                buf[0] = 1;
            changeCurPos(screen.curx, screen.cury, 0, screen.cury - buf[0]);
            screen.curx = 0;
            screen.cury -= buf[0];
            break; 
        case 'G': //Cursor Horizontal Absolute
            buf[0] -= 1;
            changeCurPos(screen.curx, screen.cury, buf[0], screen.cury);
            screen.curx = buf[0];
            break; 
        case 'H': //Cursor Position
        case 'f':
            if(buf[0] > 0)
                buf[0] -= 1;
            if(buf.length == 1)
                buf.push(1);
            buf[1] -= 1;
            changeCurPos(screen.curx, screen.cury, buf[1], buf[0]);
            screen.curx = buf[1];
            screen.cury = buf[0];
            break; 
        case 'J': //Erase Data
            if(buf[0] == 0 || buf[0] == 2){
                let curdiv = terminal.childNodes[screen.cury];
                if (!curdiv)
                    break;

                while(curdiv != terminal.lastElementChild){
                    terminal.removeChild(terminal.lastElementChild);
                }

                while(terminal.childNodes.length < theight){
                    terminal.appendChild(document.createElement('div'));

                    let spaceElem = document.createElement('span');
                    spaceElem.appendChild(document.createTextNode('\xA0'.repeat(twidth)));
                    spaceElem.style.color = screen.style.color;
                    spaceElem.style.backgroundColor = screen.style.bgcolor;
                    
                    terminal.lastElementChild.appendChild(spaceElem);
                }
            } 

            if(buf[0] == 1 || buf[0] == 2){
                let curdiv = terminal.childNodes[screen.cury];
                if (!curdiv)
                    break;

                while(curdiv != terminal.firstElementChild){
                    terminal.removeChild(terminal.firstElementChild);
                }

                while(terminal.childNodes.length <= screen.cury){
                    terminal.insertBefore(document.createElement('div'), terminal.firstElementChild);

                    let spaceElem = document.createElement('span');
                    spaceElem.appendChild(document.createTextNode('\xA0'.repeat(twidth)));
                    spaceElem.style.color = screen.style.color;
                    spaceElem.style.backgroundColor = screen.style.bgcolor;
                    
                    terminal.firstElementChild.appendChild(spaceElem);
                }
            } 

            //Erase in Line functionality from the next case
            //break;
        case 'K': //Erase in Line
            if(buf[0] == 0 || buf[0] == 2){
                let curdiv = terminal.childNodes[screen.cury];
                if (!curdiv)
                    break;
                let x = screen.curx;
                let ix = 0;

                for (let i = 0; i < curdiv.childNodes.length; i ++) {
                    ix += curdiv.childNodes[i].textContent.length;
             
                    if (x < ix) {
                        let curnode = curdiv.childNodes[i];
                        let pos = x - (ix - curnode.textContent.length); 
                        let text = curnode.textContent;

                        while (curnode.nextSibling) 
                            curdiv.removeChild(curnode.nextSibling);

                        curnode.textContent = curnode.textContent.slice(0, pos);

                        let strsize = twidth - curdiv.textContent.length;

                        let spaceElem = document.createElement('span');
                        spaceElem.appendChild(document.createTextNode('\xA0'.repeat(strsize)));
                        spaceElem.style.color = screen.style.color;
                        spaceElem.style.backgroundColor = screen.style.bgcolor;
                        
                        curdiv.appendChild(spaceElem);
                        break;
                    }
                }
            }

            if(buf[0] == 1 || buf[0] == 2){
                let curdiv = terminal.childNodes[screen.cury];
                if (!curdiv)
                    break;
                let x = screen.curx;
                let ix = 0;

                for (let i = 0; i < curdiv.childNodes.length; i ++) {
                    ix += curdiv.childNodes[i].textContent.length;
             
                    if (x < ix) {
                        let curnode = curdiv.childNodes[i];
                        let pos = x - (ix - curnode.textContent.length); 
                        let text = curnode.textContent;

                        while (curnode.previousSibling) 
                            curdiv.removeChild(curnode.previousSibling);

                        curnode.textContent = curnode.textContent.slice(pos + 1);

                        let strsize = twidth - curdiv.textContent.length;

                        let spaceElem = document.createElement('span');
                        spaceElem.appendChild(document.createTextNode('\xA0'.repeat(strsize)));
                        spaceElem.style.color = screen.style.color;
                        spaceElem.style.backgroundColor = screen.style.bgcolor;
                        
                        curdiv.insertBefore(spaceElem, curnode);
                        break;
                    }
                }
            }

            mergeSameStyle(screen.cury);
            changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury);
            break;
        case 'P':
            let curdiv = terminal.childNodes[screen.cury];
            changeCurPos(screen.curx, screen.cury, screen.curx + 1, screen.cury);

            let x = screen.curx;
            let ix = 0;

            for (let i = 0; i < curdiv.childNodes.length; i ++) {
                ix += curdiv.childNodes[i].textContent.length;
            
                if (x < ix) {
                    let pos = x - (ix - curdiv.childNodes[i].textContent.length); 
                    let text = curdiv.childNodes[i].textContent;
                    curdiv.childNodes[i].textContent = text.slice(0, pos) + text.slice(pos + 1);
                }
            }

            mergeSameStyle(screen.cury);
            break;
        case 'S': //Scroll Up
            if(buf[0] == 0)
                buf[0] = 1;
            for(let i = 0; i < buf[0]; i ++){
                changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury + 1);
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
                charElem.style.color = defaultStyle.color;
                charElem.style.backgroundColor = defaultStyle.bgcolor;
                terminal.firstElementChild.append(charElem);
             
                changeCurPos(screen.curx, screen.cury + 1, screen.curx, screen.cury);
            }
            break;
        case 'X': //Erase Character(s)
            if (buf[0] == 0)
                buf[0] = 1;

            for(let i = 0; i < buf[0]; i ++){
                changeChar(' ', screen.curx + i, screen.cury);
            }
            changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury);
            break;
        case 'n': //Device Status Report
            if(buf[0] == 6){
                ws.send('\x1B[' + (screen.cury + 1) + ';' + (screen.curx + 1)  + 'R');
                console.log('\x1B[' + (screen.cury + 1) + ';' + (screen.curx + 1)  + 'R');
            }
            break;
        case 's': //Save Cursor Position
            screen.saved_curx = screen.curx;
            screen.saved_cury = screen.cury;
            break;
        case 'u': //Restore Cursor Position
            changeCurPos(screen.curx, screen.cury, screen.saved_curx, screen.saved_cury);
            screen.curx = screen.saved_curx;
            screen.cury = screen.saved_cury;
            break;
        case '?h': // DEC Private Mode Set
            if (buf[0] == 25) {
                screen.cur_visible = 1;
                changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury);
            } 
            else if (buf[0] == 1049) {
                [screen, altscreen] = [altscreen, screen];

                [terminal.innerHTML, alternate_screen] = [alternate_screen, terminal.innerHTML];
                changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury);
            }
            break;
        case '?l': // DEC Private Mode Reset
            if (buf[0] == 25) {
                screen.cur_visible = 0;
                changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury);
            } else if (buf[0] == 1049 && screen.curx != -1) {
                [screen, altscreen] = [altscreen, screen];

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
        escape_state = 0;
        return;
    }

    if(next_char == '?') {
        if (CSI_priv || escape_sequence.length)
            escape_state = 0;
        CSI_priv = '?';
    } else if('@ABCDEFGHIJKLMPSTXZ^`abcdefghilmnpqrstuvwxyz{|}~'.indexOf(next_char) != -1) {
        CSI_priv += next_char;
        //console.log(CSI_priv + ' - ' + escape_sequence);
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
            if(escape_sequence.length == 1){
                escape_state = 0;
            } else {
                escape_sequence += next_char;
            }
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
            changeCurPos(screen.curx, screen.cury, screen.curx, screen.cury + 1);
            screen.cury += 1;
            break;

        case '\r': //CR
            changeCurPos(screen.curx, screen.cury, 0, screen.cury);
            screen.curx = 0;
            break;

        case '\x07': //BELL
            break;

        case '\x08': //Backspace
            if (screen.curx > 0) {
                changeCurPos(screen.curx, screen.cury, screen.curx - 1, screen.cury);
                screen.curx --;
            }
            break;

        default:
            printChar(next_char);
            break;
    }

    window.scrollTo(0, document.body.scrollHeight - innerHeight);
}


function printChar(next_char){
    changeChar(next_char, screen.curx, screen.cury); 

    if (screen.curx < twidth - 1){
        changeCurPos(screen.curx, screen.cury, screen.curx + 1, screen.cury);
        screen.curx ++;    
    } else {
        changeCurPos(screen.curx, screen.cury, 0, screen.cury + 1);
        screen.cury ++;    
        screen.curx = 0;
    }
}

function changeChar(next_char, x, y) {
    while (terminal.childNodes.length <= y){
        terminal.appendChild(document.createElement('div'));
    }

    let ix = 0;
    let curdiv = terminal.childNodes[y];
    for (let i = 0; i < curdiv.childNodes.length; i ++){
        //console.log(next_char);
        ix += curdiv.childNodes[i].textContent.length;

        if (x < ix) {
            //Insert char
            let curnode = curdiv.childNodes[i];
            let pos = x - (ix - curnode.textContent.length); 
            //console.log(i + '  <==>  ' + pos + ' = ' + x + ' - (' + ix + ' - ' + curnode.textContent.length + ')');
            let text = curnode.textContent;
            if (curnode.style.color == screen.style.color &&
                curnode.style.backgroundColor == screen.style.bgcolor) {
                curnode.textContent = text.slice(0, pos) + next_char + text.slice(pos + 1);
                return;
            }

            if (curnode.textContent.length == 1) {
                let prevnode = curnode.previousSibling;
                let nextnode = curnode.nextSibling;

                if (prevnode && 
                    screen.style.color   == prevnode.style.color &&
                    screen.style.bgcolor == prevnode.style.backgroundColor
                ) {
                    if (nextnode && 
                        screen.style.color   == nextnode.style.color &&
                        screen.style.bgcolor == nextnode.style.backgroundColor
                    ) {
                        //Merging current node with previous and next
                        prevnode.textContent += next_char;
                        prevnode.textContent += nextnode.textContent;
                        curdiv.removeChild(nextnode);
                        curdiv.removeChild(curnode);
                        return;
                    }

                    //Merging current node with previous
                    prevnode.textContent += next_char;
                    curdiv.removeChild(curnode);
                    return;
                }

                if (nextnode && 
                    screen.style.color   == nextnode.style.color &&
                    screen.style.bgcolor == nextnode.style.backgroundColor
                ) {
                    //Merging current node with next
                    nextnode.textContent = next_char + nextnode.textContent;
                    curdiv.removeChild(curnode);
                    return;
                }

                curnode.textContent = next_char;
                curnode.style.color = screen.style.color;
                curnode.style.backgroundColor = screen.style.bgcolor;
                return;
            }

            if (pos == 0) {
                if (i && 
                    screen.style.color   == curdiv.childNodes[i - 1].style.color &&
                    screen.style.bgcolor == curdiv.childNodes[i - 1].style.backgroundColor
                ) {
                    curnode.textContent = curnode.textContent.slice(1);
                    curdiv.childNodes[i - 1].textContent += next_char;
                } else {
                    curnode.textContent = curnode.textContent.slice(1);

                    let charElem = document.createElement('span');
                    charElem.appendChild(document.createTextNode(next_char));

                    charElem.style.color = screen.style.color;
                    charElem.style.backgroundColor = screen.style.bgcolor;
                    
                    curdiv.insertBefore(charElem, curnode);
                }
                return;
            }

            if (pos == curnode.textContent.length - 1) {
                if (i != curdiv.childNodes.length - 1 && 
                    screen.style.color   == curdiv.childNodes[i + 1].style.color &&
                    screen.style.bgcolor == curdiv.childNodes[i + 1].style.backgroundColor
                ) {
                    curnode.textContent = curnode.textContent.slice(0, -1);
                    curdiv.childNodes[i + 1].textContent = next_char + curdiv.childNodes[i + 1].textContent;
                } else {
                    curnode.textContent = curnode.textContent.slice(0, -1);

                    let charElem = document.createElement('span');
                    charElem.appendChild(document.createTextNode(next_char));

                    charElem.style.color = screen.style.color;
                    charElem.style.backgroundColor = screen.style.bgcolor;
                    
                    curdiv.insertBefore(charElem, curnode.nextSibling);
                }
                return;
            }


            let charElem = document.createElement('span');
            charElem.appendChild(document.createTextNode(curnode.textContent.slice(0, pos)));

            charElem.style.color = curnode.style.color;
            charElem.style.backgroundColor = curnode.style.backgroundColor;
            
            curdiv.insertBefore(charElem, curnode);


            charElem = document.createElement('span');
            charElem.appendChild(document.createTextNode(next_char));

            charElem.style.color = screen.style.color;
            charElem.style.backgroundColor = screen.style.bgcolor;
            
            curdiv.insertBefore(charElem, curnode);


            curnode.textContent = curnode.textContent.slice(pos + 1);
            return;
        }
    }

    if (x > ix) {
        let inc = x - ix - 1;

        if(curdiv.lastElementChild &&
           defaultStyle.color   == curdiv.lastElementChild.style.color &&
           defaultStyle.bgcolor == curdiv.lastElementChild.style.backgroundColor) {
            curdiv.lastElementChild.textContent += '\xA0'.repeat(inc);
            return;
        }

        let spaceElem = document.createElement('span');
        spaceElem.appendChild(document.createTextNode('\xA0'.repeat(inc)));
        spaceElem.style.color = defaultStyle.color;
        spaceElem.style.backgroundColor = defaultStyle.bgcolor;
        
        curdiv.appendChild(spaceElem);
    }
    
    if(curdiv.lastElementChild &&
       screen.style.color   == curdiv.lastElementChild.style.color &&
       screen.style.bgcolor == curdiv.lastElementChild.style.backgroundColor) {
        curdiv.lastElementChild.textContent += next_char;
        return;
    }

    let charElem = document.createElement('span');
    charElem.appendChild(document.createTextNode(next_char));

    charElem.style.color = screen.style.color;
    charElem.style.backgroundColor = screen.style.bgcolor;

    curdiv.appendChild(charElem);
}

function mergeSameStyle(y){
    //Merge span with same style
    if (terminal.childNodes.length <= y)
        return;

    let curdiv = terminal.childNodes[y];
    if (curdiv.childNodes.length == 0)
        return;

    let lastStyle = new Style();
    while (!curdiv.firstElementChild.textContent)
        curdiv.removeChild(curdiv.firstElementChild);
    
    if (curdiv.childNodes.length < 2)
        return;

    let nextNode = curdiv.firstElementChild;
    lastStyle.color = nextNode.style.color;
    lastStyle.bgcolor = nextNode.style.backgroundColor;

    do {
        nextNode = nextNode.nextSibling;

        while (!nextNode.textContent) {
            if (curdiv.lastElementChild == nextNode) {
                curdiv.removeChild(nextNode);
                return;
            }

            nextNode = nextNode.nextSibling;
            curdiv.removeChild(nextNode.previousSibling);
        }
        
        if (
            lastStyle.color   == nextNode.style.color &&
            lastStyle.bgcolor == nextNode.style.backgroundColor
        ) {
            //Merging with previous
            nextNode = nextNode.previousSibling;
            nextNode.textContent += nextNode.nextSibling.textContent;
            curdiv.removeChild(nextNode.nextSibling);
        } else {
            lastStyle.color   = nextNode.style.color;
            lastStyle.bgcolor = nextNode.style.backgroundColor;
        }

    } while (nextNode != curdiv.lastElementChild);
}

(function() {
    window.addEventListener("resize", resizeThrottler, false);

    var resizeTimeout;
    function resizeThrottler() {
        if ( !resizeTimeout  ) {
            resizeTimeout = setTimeout(function() {
                resizeTimeout = null;
                actualResizeHandler();
            }, 500);
        }
    }

    function actualResizeHandler() {
        setNewSize();
    }
}());

function setNewSize(){
    let termWidth  = innerWidth - 10;
    let termHeight = innerHeight;
    
    //Append virtual element to check size of one char
    let charElem = document.createElement('span');
    charElem.appendChild(document.createTextNode(' '));
    charElem.style.color = defaultStyle.color;
    charElem.style.backgroundColor = defaultStyle.bgcolor;

    terminal.appendChild(charElem);
    let elementSize   = terminal.lastElementChild.getBoundingClientRect();
    terminal.removeChild(terminal.lastElementChild);

    let elementWidth  = elementSize.width;
    let elementHeight = elementSize.height;

    let charWidth  = Math.floor(termWidth  / elementWidth );
    let charHeight = Math.floor(termHeight / elementHeight);
    
    let encoder = new TextEncoder();
    let uint8Array = encoder.encode('\x1b[8;' + charHeight + ';' + charWidth + 't');

    twidth  = charWidth;
    theight = charHeight;

    ws.send(uint8Array);
}
