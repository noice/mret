#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <errno.h>
#include <unistd.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/wait.h>

// Sizes
#define PORTLEN        6
#define ADDRLEN        16
#define TYPESIZE       32
#define PATHSIZE       256
#define HEADERSIZE     2048
#define REQUESTSIZE    8192
#define MSGSIZE        65536

// Frame's defines
#define CLOSERET       -11
#define PONGRET        -10
#define PINGRET        -12
#define GUID           "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

// Dir for client side files
#define CLIENTDIR      "client"

// Custom types
typedef unsigned char      uchar;
typedef unsigned short     ushort;
typedef unsigned int       uint;
typedef unsigned long long ull;
