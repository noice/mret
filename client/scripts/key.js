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
