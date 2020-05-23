import http.server

from ws import listen_connection


class MretHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def do_GET(self):
        # Get requested file
        f = self.send_head()

        # If conf.js was requested
        # Find free port and type it to conf.js
        if f.name == 'conf.js':
            # Find free port
            import socket as sock
            s = sock.socket(sock.AF_INET, sock.SOCK_STREAM) 
            s.bind(('', 0))
            port = s.getsockname()[1]
            s.shutdown()
            s.close()

            # Send port to ws
            listen_connection(port)

            # Closing for reopen in read-write mode file
            if f:
                f.close()

            with open('conf.js', 'r+b') as f:
                # Add port to conf.js
                f.write(bytes(f.peek().decode(encoding='utf-8').format(port), 'utf-8'))

        # Response try
        try:
            self.copyfile(f, self.wfile)
        finally:
            f.close()


class MretServer(http.server.HTTPServer):
    allow_reuse_address = True # Test purpose


def start(address, port):
    with MretServer((address, port), MretHandler) as mret_server:
        print('Server is started')
        try:
            mret_server.serve_forever()
        except KeyboardInterrupt:
            pass
    
