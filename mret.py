import src.server

from src.server import run_app
from src.args_parsing import parse_args


args = parse_args()

run_app(server.app, host=args.host, port=args.port)

