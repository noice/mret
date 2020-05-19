import os
import argparse
import threading

import ws
import server

class ServerThread(threading.Thread):
    def __init__(self, address, port):
        Thread.__init__(self)
        self.address = address
        self.port = port

    def run(self):
        server.start(address, port)

class WSThread(threading.Thread):
    def __init__(self, conn):
        Thread.__init__(self)
        self.conn = conn

    def run(self):
        ws.start(self.conn)

if __name__ == '__main__':
    serv = ServerThread('127.0.0.1', 8000)
    serv.start()

    while True:
        wsconn = ws.get_connection()
        wsthread = WSThread(wsconn)
        wsthread.start()
