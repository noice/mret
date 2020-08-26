import argparse
from ipaddress import ip_address

def parse_args():
    def ip_str(string):
        try:
            value = str(ip_address(string))
        except ValueError as e:
            raise argparse.ArgumentTypeError(e)
        return value

    parser = argparse.ArgumentParser(
            description='Start mret',
            add_help=False,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-h', '--host', dest='host', type=ip_str, 
                          default='127.0.0.1',
                          help='host of server')
    parser.add_argument('-p', '--port', dest='port', type=int,
                          default=2111,
                          help='port of server')
    parser.add_argument('--help', action='help', help='show help')

    return parser.parse_args()
