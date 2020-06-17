import os
import mimetypes
from aiohttp import web

routes = web.RouteTableDef()

def init_app():
    # Init mimetypes
    mimetypes.init()

    # Set app working directory
    os.chdir('client/')

    app = web.Application()
    app.add_routes(routes)

    app['404'] = {'body': '', 'ctype': ''} 

    try:
        with open('404.html', 'rb') as f:
            app['404']['body'] = f.read()
            app['404']['ctype'] = 'text/html'
    except Exception as e:
        pass

    return app


@routes.get('/')
@routes.get('/{name}')
@routes.get('/scripts/{name}')
async def handle(request):
    name = request.path[1:] if request.path != '/' else 'index.html'

    # Determine Content-Type
    ctype = (mimetypes.guess_type(name)[0] 
             if mimetypes.guess_type(name)[0] is not None
             else 'text/plain')

    try:
        with open(name, 'rb') as resp:
            return web.Response(status=200, body=resp.read(), 
                                charset='UTF-8', content_type=ctype)
    except FileNotFoundError as e:
        print(e)
        return web.Response(status=404, body=app['404']['body'],
                            content_type=app['404']['ctype'])
    except Exception as e:
        print(e)
        return web.Response(status=500)

@routes.get("/ws")
async def wshandle(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == web.WSMsgType.text:
            break
        elif msg.type == web.WSMsgType.binary:
            break
        elif msg.type == web.WSMsgType.close:
            break
    return ws


app = init_app()
