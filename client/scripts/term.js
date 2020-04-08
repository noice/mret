var escapeState = 0;
var escapeSequence = '';
var escapeString = 0;
var CSI_priv = '';
var OSC_msg = '';

var term;
var termWidth;
var termHeight = 1;
var virtualTerm = [[]];
var alterTerm = [[]];

function Screen() {
    this.style = new Style();
    this.curx = 0;
    this.cury = 0;
    this.savedCurX = 0;
    this.savedCurY = 0;
    this.curVisible = 1;
    this.scrollTop = 0;
    this.scrollBottom = termHeight - 1;
};

screen = new Screen();
altscreen = new Screen();

function initTerminal() {
    screen.curx = 0;
    screen.cury = 0;

    term = document.getElementById('terminal');
}

function commitChanges() {
    //Save style of element under the cursor
    let elemBesideCur = virtualTerm[screen.cury][screen.curx].style;
    if(screen.curVisible){
        virtualTerm[screen.cury][screen.curx].style = curStyle;
    }

    for(let i = 0; i < virtualTerm.length; ++ i){
        if(!virtualTerm[i].changed){
            continue; 
        }

        // Replace row
        let row = document.createElement('div');
        let rowElements = [];
       
        for(let f = 0; f < virtualTerm[i].length; ++ f){
            // Merge chars with same style into rowElements array
            if(rowElements.length && isEqualStyle(virtualTerm[i][f].style, rowElements[rowElements.length - 1].style)){
                rowElements[rowElements.length - 1].text += virtualTerm[i][f].text;
            } else {
                rowElements.push({
                    text  : virtualTerm[i][f].text,
                    style : virtualTerm[i][f].style
                });
            }
        }

        // Fill the row with spans
        for (let r of rowElements){
            let span = document.createElement('span');
            span.appendChild(document.createTextNode(r.text));
            applyVirtualStyle(span, r.style);
            row.appendChild(span);
        }

        if(term.childNodes.length <= i) {
            term.appendChild(row);
        } else {
            term.replaceChild(row, term.childNodes[i]);
        }
        
    }

    // Restore the element's style
    virtualTerm[screen.cury][screen.curx].style = elemBesideCur;
}

function handleCSI() {
    let buf = escapeSequence.split(';');
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
            screen.cury -= buf[0];
            break;
        case 'B': //Cursor Down
            if(buf[0] == 0)
                buf[0] = 1;
            screen.cury += buf[0];
            break;
        case 'C': //Cursor Right
            if(buf[0] == 0)
                buf[0] = 1;
            screen.curx += buf[0];
            break;
        case 'D': //Cursor Left
            if(buf[0] == 0)
                buf[0] = 1;
            screen.curx -= buf[0];
            break;
        case 'E': //Cursor Next Line
            if(buf[0] == 0)
                buf[0] = 1;
            screen.curx = 0;
            screen.cury += buf[0];
            break;
        case 'F': //Cursor Previous Line
            if(buf[0] == 0)
                buf[0] = 1;
            screen.curx = 0;
            screen.cury -= buf[0];
            break; 
        case 'G': //Cursor Horizontal Absolute
            buf[0] -= 1;
            screen.curx = buf[0];
            break; 
        case 'H': //Cursor Position
        case 'f':
            if(buf[0] > 0)
                buf[0] -= 1;
            if(buf.length == 1)
                buf.push(1);
            buf[1] -= 1;
            screen.curx = buf[1];
            screen.cury = buf[0];
            break; 
        case 'J': //Erase Data
            if(buf[0] == 0 || buf[0] == 2){
                for(let i = screen.cury + 1; i < termHeight; ++ i){
                    for(let f = 0; f < termWidth; ++ f){
                        virtualTerm[i][f] = {
                            text  : ' ', 
                            style : new VirtualStyle(screen.style)
                        };
                    }

                    virtualTerm[i].changed = true;
                }
            } 

            if(buf[0] == 1 || buf[0] == 2){
                for(let i = 0; i < screen.cury; ++ i){
                    for(let f = 0; f < termWidth; ++ f){
                        virtualTerm[i][f] = {
                            text  : ' ', 
                            style : new VirtualStyle(screen.style)
                        };
                    }

                    virtualTerm[i].changed = true;
                }
            } 

            //Erase in Line functionality from the next case
            //break;
        case 'K': //Erase in Line
            if(buf[0] == 0 || buf[0] == 2){
                for(let f = screen.curx; f < termWidth; ++ f) {
                    virtualTerm[screen.cury][f] = {
                        text  : ' ', 
                        style : new VirtualStyle(screen.style)
                    };
                }
                virtualTerm[screen.cury].changed = true;
            }

            if(buf[0] == 1 || buf[0] == 2){
                for(let f = 0; f <= screen.curx; ++ f) {
                    virtualTerm[screen.cury][f] = {
                        text  : ' ', 
                        style : new VirtualStyle(screen.style)
                    };
                }
                virtualTerm[screen.cury].changed = true;
            }
            break;

        case 'L': //Insert Lines
            if(buf[0] == 0)
                buf[0] = 1;
            for(let i = 0; i < buf[0]; i ++){
                // Remove line from the bottom and insert new under the cursor
                term.removeChild(term.childNodes[screen.scrollBottom]);
                term.insertBefore(document.createElement('div'), term.childNodes[screen.cury]);
                
                virtualTerm.splice(screen.scrollBottom, 1);
                virtualTerm.splice(screen.cury, 0, []);

                // Fill new row
                fillRow(screen.cury, screen.style);
            }
            break;
        case 'M': //Delete Lines
            if(buf[0] == 0)
                buf[0] = 1;
            for(let i = 0; i < buf[0]; ++ i){
                term.removeChild(term.childNodes[screen.cury]);
                term.appendChild(document.createElement('div'));

                virtualTerm.splice(screen.cury, 1);
                fillRow(termWidth - 1, defaultStyle);
            }
            break;
        case 'P': //Delete Characters
            virtualTerm[screen.cury].splice(screen.curx, buf[0]);
            while(virtualTerm[screen.cury].length < termWidth){
                virtualTerm[screen.cury].push({
                    text  : ' ',
                    style : new VirtualStyle(defaultStyle)
                });
            }
            break;
        case 'S': //Scroll Up
            if(buf[0] == 0)
                buf[0] = 1;

            for(let i = 0; i < buf[0]; i ++){
                // Shift the real terminal
                if(term.childNodes[screen.scrollBottom] == term.lastElementChild) {
                    term.appendChild(document.createElement('div'));
                } else {
                    term.insertBefore(document.createElement('div'), term.childNodes[screen.scrollBottom].nextSibling);
                }
                term.removeChild(term.childNodes[screen.scrollTop]);

                // Same with the virtual terminal
                virtualTerm.splice(screen.scrollTop, 1);
                if(screen.scrollBottom == termHeight - 1){
                    virtualTerm[screen.scrollBottom] = [];
                } else {
                    virtualTerm.splice(screen.scrollBottom, 0, []);
                }

                //Fill the new row
                fillRow(screen.scrollBottom, defaultStyle);
            }
            break;
        case 'T': //Scroll Down
            if(buf[0] == 0)
                buf[0] = 1;

            for(let i = 0; i < buf[0]; i ++){
                // Shift the real terminal
                term.removeChild(term.childNodes[screen.scrollBottom]);
                term.insertBefore(document.createElement('div'), term.childNodes[screen.scrollTop]);

                // Same with the virtual terminal
                virtualTerm.splice(screen.scrollBottom, 1);
                virtualTerm.splice(screen.scrollTop, 0, []);

                //Fill the new row
                fillRow(screen.scrollTop, defaultStyle);
            }
            break;
        case 'X': //Erase Character(s)
            if (buf[0] == 0)
                buf[0] = 1;

            for(let i = 0; i < buf[0]; i ++){
                let curChar = virtualTerm[screen.cury][screen.curx + i];
                curChar.text = ' ';
                curChar.style = new VirtualStyle(screen.style);
            }

            // Row is now changed
            virtualTerm[screen.cury].changed = true;
            break;
        case 'd': //Line Position Absolute
            if (buf[0])
                buf[0] -= 1;

            screen.cury = buf[0];
            break;
        case 'e': //Line Position Relative
            if (!buf[0])
                buf[0] = 1;

            if(screen.cury + buf[0] >= 0){
                screen.cury += buf[0];
            } else {
                screen.cury = 0;
            }
            break;
        case 'n': //Device Status Report
            if(buf[0] == 6){
                ws.send('\x1B[' + (screen.cury + 1) + ';' + (screen.curx + 1)  + 'R');
                console.log('Sending \x1B[' + (screen.cury + 1) + ';' + (screen.curx + 1)  + 'R');
            }
            break;
        case 'r': //Set Scrolling Region [top;bottom] (default = full size of window)
            if (buf[0] == 0){
                screen.scrollTop = 0;
                screen.scrollBottom = termHeight - 1;
            } else {
                screen.scrollTop = buf[0] - 1;
                screen.scrollBottom = buf[1] - 1;
            }
            break;
        case 's': //Save Cursor Position
            screen.savedCurX = screen.curx;
            screen.savedCurY = screen.cury;
            break;
        case 'u': //Restore Cursor Position
            screen.curx = screen.savedCurX;
            screen.cury = screen.savedCurY;
            break;
        case '?h': // DEC Private Mode Set
            if (buf[0] == 25) {
                screen.curVisible = 1;
            } 
            else if (buf[0] == 1049) {
                [screen, altscreen] = [altscreen, screen];

                [virtualTerm, alterTerm] = [alterTerm, virtualTerm];
                for (let r of virtualTerm){
                    r.changed = true;
                }

                changeTermSize();
            }
            break;
        case '?l': // DEC Private Mode Reset
            if (buf[0] == 25) {
                screen.curVisible = 0;
            } else if (buf[0] == 1049 && screen.curx != -1) {
                [screen, altscreen] = [altscreen, screen];

                [virtualTerm, alterTerm] = [alterTerm, virtualTerm];
                for (let r of virtualTerm){
                    r.changed = true;
                }

                changeTermSize();
            }
            break;
        default:
            break;
    }
}

function handleOSC(nchar) {
    if(escapeSequence.length > 2 && escapeSequence.slice(-1) == '\x07'){
        escapeState = 0;
    } else if(escapeSequence.length > 2 && escapeSequence.slice(-2) == '\x1b\\'){
        escapeState = 0;
    }

    if(escapeSequence.length == 3 && escapeSequence != ']0;'){
        escapeState = 0;
    }

    escapeSequence += nchar;
    //console.log(escapeSequence);

    if(escapeSequence.length > 2 && escapeSequence.slice(-1) == '\x07'){
        let title = escapeSequence.slice(3, -1);
        document.title = title;
    } else if(escapeSequence.length > 2 && escapeSequence.slice(-2) == '\x1b\\'){
        let title = escapeSequence.slice(3, -2);
        document.title = title;
    }
}

function parseCSI(nchar) {
    //TODO
    if(CSI_priv.length && CSI_priv.slice(-1) != '?'){
        escapeState = 0;
        return;
    }

    if(nchar == '?') {
        if (CSI_priv || escapeSequence.length)
            escapeState = 0;
        CSI_priv = '?';
    } else if('@ABCDEFGHIJKLMPSTXZ^`abcdefghilmnpqrstuvwxyz{|}~'.indexOf(nchar) != -1) {
        CSI_priv += nchar;
        //console.log(CSI_priv + ' - ' + escapeSequence);
        handleCSI();
    } else if(escapeSequence.length == 0 && nchar != '[') {
        if ('-;0123456789'.indexOf(nchar) == -1){
            escapeState = 0;
        }
        escapeSequence += nchar;
    } else if(escapeSequence.length){
        if ('-;0123456789'.indexOf(nchar) == -1){
            escapeState = 0;
        }
        escapeSequence += nchar;
    }
}


function handleEscape(nchar){
    if(escapeState == 1){
        if('DEHMNOPVWXZ[]^_ #%()*+-./\\6789=>Fclmno|}~'.indexOf(nchar) == -1)
            escapeState = 0;
        else {
            escapeState = nchar;
            escapeSequence = '';
            CSI_priv = '';
        }
    }

    switch(escapeState){
        case '[':
            parseCSI(nchar);
            break;

        case ']':
            handleOSC(nchar);
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
            if(escapeSequence.length == 2){
                escapeState = 0;
            } else {
                escapeSequence += nchar;
            }
            break;

        case 'M': 
            // RI – Reverse Index
            // Move the active position to the same horizontal position on the preceding line. If the active position is at the top margin, a scroll down is performed.
            if(!escapeSequence){
                if(screen.cury){
                    screen.cury --; 
                } else {
                    term.insertBefore(document.createElement('div'), term.firstElementChild);
                    term.removeChild(term.lastElementChild);

                    virtualTerm.unshift([]);
                    virtualTerm.pop();

                    fillRow(0, defaultStyle);
                }
            }

            if(escapeSequence.length == 1){
                escapeState = 0;
            } else {
                escapeSequence += nchar;
            }
            break;

        case '_':
            // APC - Application Program Command
            if(!escapeSequence){
                escapeString = 1;
            }

            if(escapeSequence.length == 1){
                escapeState = 0;
            } else {
                escapeSequence += nchar;
            }
            break;

        case '\\':
            // ST - String Terminator
            if(!escapeSequence){
                escapeString = 0;
            }

            if(escapeSequence.length == 1){
                escapeState = 0;
            } else {
                escapeSequence += nchar;
            }
            break;

        default:
            if(escapeSequence.length == 1){
                escapeState = 0;
            } else {
                escapeSequence += nchar;
            }
            break;
    }
}

function nextChar(nchar) {
    if(escapeState && nchar != '\030' && nchar != '\032') { 
        //Escape sequence handling if the next char is not CAN or SUB 
        handleEscape(nchar);
        if(escapeState)
            return;
    }

    if(escapeString) {
        if(nchar == '\033'){
            escapeState = 1;
        }
        return;
    }

    switch(nchar) {
        case '\0': // NUL
            break; // Ignored on input

        case '\005': 
                   // ENQ 
            break; // Transmit answerback message

        case '\007': 
                   // BEL
            break;

        case '\010': 
                   // BS
                   // Move the cursor to the left one character position, unless it is at the left margin, in which case no action occurs
            if (screen.curx > 0) {
                screen.curx --;
            }
            break;

        case '\011': 
                   // HT
                   // TODO
            break; // Move the cursor to the next tab stop, or to the right margin if no further tab stops are present on the line

        case '\n': // LF
        case '\v': // VT
        case '\f': // FF
                   // This code causes a line feed or a new line operation
            if(screen.scrollBottom != screen.cury){
                screen.cury ++;
            } else {
                // Shift the real terminal
                if(term.childNodes[screen.scrollBottom] == term.lastElementChild) {
                    term.appendChild(document.createElement('div'));
                } else {
                    term.insertBefore(document.createElement('div'), term.childNodes[screen.scrollBottom].nextSibling);
                }
                term.removeChild(term.childNodes[screen.scrollTop]);

                // Same with the virtual terminal
                virtualTerm.splice(screen.scrollTop, 1);
                if(screen.scrollBottom == termHeight - 1){
                    virtualTerm[screen.scrollBottom] = [];
                } else {
                    virtualTerm.splice(screen.scrollBottom, 0, []);
                }

                //Fill the new row
                fillRow(screen.scrollBottom, screen.style);
            }
            break;

        case '\r': // CR
                   // Move cursor to the left margin on the current line
            screen.curx = 0;
            break;

        case '\016': 
                   // SO
        case '\017': 
                   // SI 
        case '\021': 
                   // XON
        case '\023': 
                   // XOFF 
            break; // Maybe TODO

        case '\030':
                   // CAN
                   // If sent during a control sequence, the sequence is immediately terminated and not executed
                   // It also causes the error character to be displayed
        case '\032':
                   // SUB
                   // Interpreted as CAN
            escapeState = 0;
            break;

        case '\033': 
                   // Escape
                   // Invokes a control sequence
            escapeState = 1;
            break;

        default:   // Not a control character
            // Print character
            let curChar = virtualTerm[screen.cury][screen.curx];
            curChar.text = nchar;
            curChar.style = new VirtualStyle(screen.style);
  
            // Row is now changed
            virtualTerm[screen.cury].changed = true;

            // Move cursor to next position
            if (screen.curx < termWidth - 1){
                screen.curx ++;    
            } else {
                if (screen.cury < termHeight - 1){
                    screen.cury ++;    
                    screen.curx = 0;
                } else {
                    screen.curx = 0;
                }
            }
            break;
    }

    window.scrollTo(0, document.body.scrollHeight - innerHeight);
}

function fillRow(index, style){
    virtualTerm[index] = [];
    for(let f = 0; f < termWidth; ++f){
        virtualTerm[index][f] = {
            text  : ' ',
            style : new VirtualStyle(style)
        };
    }

    virtualTerm[index].changed = true;
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
    let tWidth  = innerWidth;
    let tHeight = innerHeight;
    
    //Append virtual element to check size of one char
    let charElem = document.createElement('span');
    charElem.appendChild(document.createTextNode(' '));
    charElem.style.color = defaultStyle.color;
    charElem.style.backgroundColor = defaultStyle.bgcolor;

    term.appendChild(charElem);
    let elementSize   = term.lastElementChild.getBoundingClientRect();
    term.removeChild(term.lastElementChild);

    let elementWidth  = elementSize.width;
    let elementHeight = elementSize.height;

    let charWidth  = Math.floor(tWidth  / elementWidth );
    let charHeight = Math.floor(tHeight / elementHeight);
    
    let encoder = new TextEncoder();
    let uint8Array = encoder.encode('\x1b[8;' + charHeight + ';' + charWidth + 't');

    if(screen.scrollTop == 0 && screen.scrollBottom == termHeight - 1){
        screen.scrollBottom = charHeight - 1;
    }

    if(altscreen.scrollTop == 0 && altscreen.scrollBottom == termHeight - 1){
        altscreen.scrollBottom = charHeight - 1;
    }

    termWidth  = charWidth;
    termHeight = charHeight;

    changeTermSize();

    ws.send(uint8Array);
}

function changeTermSize(){
    // Remove excess rows from virtual and real terminals
    while(virtualTerm.length > termHeight){
        if(screen.cury + 1 < virtualTerm.length) {
            virtualTerm.pop();
            term.removeChild(term.lastElementChild);
        } else {
            virtualTerm.shift();
            term.removeChild(term.firstElementChild);
            screen.cury --;
        }
    }

    for(let i = 0; i < termHeight; ++ i){
        if(!virtualTerm[i]){
            virtualTerm[i] = [];
        }
        // Add new chars
        while(virtualTerm[i].length < termWidth){
            virtualTerm[i][virtualTerm[i].length] = {
                text : ' ',
                style : new VirtualStyle(defaultStyle)
            };
        }

        // Remove excess chars
        while(virtualTerm[i].length > termWidth){
            virtualTerm[i].pop();
        }

        //Row was changed
        virtualTerm[i].changed = true;
    }

    //Maybe need to commitChanges
}

