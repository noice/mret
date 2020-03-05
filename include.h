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

#define CLIENTDIR      "client"

typedef unsigned int uint;
