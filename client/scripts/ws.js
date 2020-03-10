var ws = new WebSocket("ws://localhost:8080");

ws.onmessage = function(data) {
    //console.log(data);
    let incomingMessage = data.data;
    showMessage(incomingMessage);
}

//ws.onopen = () => ws.send('echo "hello world!"\n');
