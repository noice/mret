import os
import argparse

import server

if __name__ == '__main__':
    server.web.run_app(server.app)

