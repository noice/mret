from socketserver import TCPServer


class MretTCPHandler(socketserver.BaseRequestHandler):
    def handle(self):
       self.data = self.rfile.readline().strip()
       print(f"{self.client_address[0]} wrote: {self.data}")
       self.wfile.write("<h1>mret ksta</h1>")


def start(address, port):
    with socketserver.TCPServer((address, port), MretTCPHandler) as tcpserver:
        tcpserver.serve_forever()
    
