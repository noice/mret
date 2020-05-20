import os
import argparse

import server

if __name__ == '__main__':
    # Set working directory
    os.chdir("client")

    # Start server
    server.start('127.0.0.1', 8000)

