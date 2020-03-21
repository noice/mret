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
    if (e.key != "F12" && e.key != "F5")
        e.preventDefault();

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
                ws.send("\x7F");
                break;
            case "Tab":
                ws.send("\x09");
                break;
            case "Home":
                ws.send("\x1B[1~");
                break;
            case "Insert":
                ws.send("\x1B[2~");
                break;
            case "Delete":
                ws.send("\x1B[3~");
                break;
            case "End":
                ws.send("\x1B[4~");
                break;
            case "PageUp":
                ws.send("\x1B[5~");
                break;
            case "PageDown":
                ws.send("\x1B[6~");
                break;
            case "ArrowLeft":
                ws.send("\x1BOD");
                break;
            case "ArrowUp":
                ws.send("\x1BOA");
                break;
            case "ArrowRight":
                ws.send("\x1BOC");
                break;
            case "ArrowDown":
                ws.send("\x1BOB");
                break;
            case "F1":
                ws.send("\x1BOP");
                break;
            case "F2":
                ws.send("\x1BOQ");
                break;
            case "F3":
                ws.send("\x1BOR");
                break;
            case "F4":
                ws.send("\x1BOS");
                break;
            case "F5":
                //ws.send("\x1B[15~");
                break;
            case "F6":
                ws.send("\x1B[17~");
                break;
            case "F7":
                ws.send("\x1B[18~");
                break;
            case "F8":
                ws.send("\x1B[19~");
                break;
            case "F9":
                ws.send("\x1B[20~");
                break;
            case "F10":
                ws.send("\x1B[21~");
                break;
            case "F11":
                ws.send("\x1B[23~");
                break;
            case "F12":
                //ws.send("\x1B[24~");
                break;
            default:
                break;
        } 
    }

    lastTime = Date.now();
}

addEventListener("keydown", handle);
