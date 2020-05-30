import os
import argparse

import server

if __name__ == '__main__':
    # Set working directory
    os.chdir("client")

    # Start server
    server.web.run_app(server.app)

