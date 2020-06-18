import os
import mimetypes
import weakref

from aiohttp import web

routes = web.RouteTableDef()

async def init_app(app):
    # Init mimetypes
    mimetypes.init()

    # Set app working directory
    os.chdir('client/')

    # Default 404 error response
    app['404'] = {'body': '', 'ctype': ''} 
    try:
        with open('404.html', 'rb') as f:
            app['404']['body'] = f.read()
            app['404']['ctype'] = 'text/html'
    # Empty 404 response if there was some error
    except Exception as e:
        pass

    app['websockets'] = weakref.WeakSet()


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
        return web.Response(status=404, body=request.app['404']['body'],
                            content_type=request.app['404']['ctype'])
    except Exception as e:
        print(e)
        return web.Response(status=500)

@routes.get("/ws")
async def wshandle(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    request.app['websockets'].add(ws)
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.text:
                break
            elif msg.type == web.WSMsgType.binary:
                break
            elif msg.type == web.WSMsgType.close:
                await ws.close()
    finally:
        request.app['websockets'].discard(ws)

    return ws

async def shutdown_app(app):
    for ws in set(app['websockets']):
        await ws.close(code=web.WSCloseCode.GOING_AWAY,
                       message='Server shutdown')

# Create app instance
app = web.Application()
app.add_routes(routes)
app.on_startup.append(init_app)
app.on_shutdown.append(shutdown_app)
