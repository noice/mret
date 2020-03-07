let ws = new WebSocket("ws://localhost:8080");

ws.onmessage = function(data) {
    console.log(data);
    var incomingMessage = data.data;
    showMessage(incomingMessage);
}

function showMessage(message) {
    var messageElem = document.createElement('div');
    messageElem.appendChild(document.createTextNode(message));
    document.getElementById('terminal').appendChild(messageElem);
}

ws.onopen = () => ws.send('echo "hello world!"\n');
