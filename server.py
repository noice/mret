from aiohttp import web

routes = web.RouteTableDef()

@routes.get('/')
@routes.get('/{name}')
async def handle(request):
    name = request.match_info.get('name', 'index.html')

    # Determine Content-Type
    types = {'.html':'text/html', 
            '.css':'text/css', 
            '.js':'application/javascript'}
    content_type = [types[file_type] for file_type in types 
            if name.endswith(file_type)][0]

    with open(name, 'r') as index:
        return web.Response(text=index.read(), 
                            charset='UTF-8',
                            content_type=content_type)
    return web.Response()

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

app = web.Application()
app.add_routes(routes)
