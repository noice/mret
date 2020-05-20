import os
import argparse
import threading

import ws
import server

class ServerThread(threading.Thread):
    def __init__(self, address, port):
        threading.Thread.__init__(self)
        self.address = address
        self.port = port

    def run(self):
        server.start(self.address, self.port)


class WSThread(threading.Thread):
    def __init__(self, conn):
        threading.Thread.__init__(self)
        self.conn = conn

    def run(self):
        ws.start(self.conn)


if __name__ == '__main__':
    # Set working directory
    os.chdir("client")

    # Start server
    serv = ServerThread('127.0.0.1', 8000)
    serv.start()

    # Serve
    while True:
        wsconn = ws.get_connection()
        wsthread = WSThread(wsconn)
        wsthread.start()
