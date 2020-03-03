let ws = new WebSocket("ws://localhost:8080");

ws.onmessage = ({data}) => {
          console.log(data);
}

ws.onopen = () => ws.send('Text');
