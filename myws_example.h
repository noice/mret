#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h> 
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <string.h>
#include <sys/stat.h> 
#include <fcntl.h>    
#include <time.h>
#include <pthread.h>
#include <semaphore.h>
#include <signal.h>
#include <sys/sendfile.h>

#define rol(value, bits) (((value) << (bits)) | ((value) >> (32 - (bits))))

#if BYTE_ORDER == LITTLE_ENDIAN
#define blk0(i) (block->l[i] = (rol(block->l[i],24)&0xFF00FF00) \
    |(rol(block->l[i],8)&0x00FF00FF))

#elif BYTE_ORDER == BIG_ENDIAN
#define blk0(i) block->l[i]

#else
#error "Endianness not defined!"
#endif

#define blk(i) (block->l[i&15] = rol(block->l[(i+13)&15]^block->l[(i+8)&15] \
    ^block->l[(i+2)&15]^block->l[i&15],1))

#define R0(v,w,x,y,z,i) z+=((w&(x^y))^y)+blk0(i)+0x5A827999+rol(v,5);w=rol(w,30);
#define R1(v,w,x,y,z,i) z+=((w&(x^y))^y)+blk(i)+0x5A827999+rol(v,5);w=rol(w,30);
#define R2(v,w,x,y,z,i) z+=(w^x^y)+blk(i)+0x6ED9EBA1+rol(v,5);w=rol(w,30);
#define R3(v,w,x,y,z,i) z+=(((w|x)&y)|(w&x))+blk(i)+0x8F1BBCDC+rol(v,5);w=rol(w,30);
#define R4(v,w,x,y,z,i) z+=(w^x^y)+blk(i)+0xCA62C1D6+rol(v,5);w=rol(w,30);

#define WS_TEXT_FRAME 0x01
#define WS_PING_FRAME 0x09
#define WS_PONG_FRAME 0x0A
#define WS_CLOSING_FRAME 0x08

char response[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: text/html; charset=UTF-8\r\n\r\n";

char response_404[] = "HTTP/1.1 404 Not Found\r\n"
"Content-Type: text/html; charset=UTF-8\r\n\r\n";

char response_img[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: image/png; charset=UTF-8\r\n\r\n";  

char response_xicon[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: image/x-icon; charset=UTF-8\r\n\r\n";

char response_css[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: text/css; charset=UTF-8\r\n\r\n";

char response_js[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: text/js; charset=UTF-8\r\n\r\n";

char response_ttf[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: font/ttf ; charset=UTF-8\r\n\r\n";

char response_text[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: text/text; charset=UTF-8\r\n\r\n";

char response_403[] = "HTTP/1.1 200 OK\r\n"
"Content-Type: text/html; charset=UTF-8\r\n\r\n"
"<!DOCTYPE html><html><head><title>403</title>"
"<style>body { background-color: #312f2f }"
"h1 { font-size:4cm; text-align: center; color: #666;}</style></head>"
"<body><h1>403</h1></body></html>\r\n";

char GUIDKey[] = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"; //36

char response_ws[] = "HTTP/1.1 101 Switching Protocols\r\n"
"Upgrade: websocket\r\n"
"Connection: Upgrade\r\n"
"Sec-WebSocket-Accept: "; //97

unsigned char charset[]={"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"};

