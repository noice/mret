#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>

#define TYPESIZE       32
#define PATHSIZE       256
#define HEADERSIZE     2048
#define REQUESTSIZE    8192
#define MSGSIZE        65536

#define PONGRET        -10
#define CLIENTDIR      "client"

#define GUID "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

typedef unsigned char      uchar;
typedef unsigned short     ushort;
typedef unsigned int       uint;
typedef unsigned long long ull;
typedef unsigned float     ufloat;
typedef unsigned double    udouble;
