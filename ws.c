#include "include.h"

char * sha1(char * buf);
char * base64(char * buf);
int ws_init_connection(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
int ws_ping(int connection_fd);
int is_ws_request(char * buf, uint len);

char *
sha1(char * buf) {
    return NULL;
}

char *
base64(char * buf) {
    return NULL;
}

int  
ws_init_connection(int connection_fd, char * buf, uint len) {
    int i, j;
    char sec_key_guid[103]; // 76 (max base64 length) + 36 (guid) + 1 (\0) = 103
    char * p_key;
    char * hash_res;
    char * base64_res;
    char response_headers[] = "HTTP/1.1 101 Switching Protocols\r\n"   //Why not "HTTP/1.1 101 Switching Protocols\r\n" 
                                "Upgrade: websocket\r\n" 
                                "Connection: Upgrade\r\n"
                                "Sec-WebSocket-Accept: ";
    // 97 (response headers) + 76 (max base64 length) + 4 (x2 CRLF) + 1 (\0) = 178
    char response[178];

    // Check if message contain field "Sec-WebSocket-Key"
    if ((p_key = strstr(buf, "Sec-WebSocket-Key:")) == NULL) {
        perror("\"Sec-WebSocket-Key\" field is missing");
        return -1;
    }

    // Copy key to buffer after "Sec-WebSocket-Key"
    for (i = 20, j = 0; p_key[i] != '\n' || p_key[i] != '\r'; i++, j++) {
        sec_key_guid[j] = p_key[i];
    }

    // Concatenate secrete_key with guid
    strcat(sec_key_guid, GUID); 

    // Pass sec_key_guid to SHA1 and get result
    hash_res = sha1(sec_key_guid);

    // Pass sha1 hash result to base64 encode to get new secret key for client
    base64_res = base64(hash_res);

    // Forge response message
    // 97 - strlen(response_headers)
    // 4 - x2 CRLF
    // 1 - '/0'
    snprintf(response, (97 + strlen(base64_res) + 4 + 1), "%s%s%s", response_headers, base64_res, "\r\n\r\n");

    // Send response
    if (send(connection_fd, response, sizeof(char) * strlen(response), MSG_NOSIGNAL) == -1) {
       perror("Error while sending response message for ws init");
       return -1; 
    }

    return 0;
}

int 
ws_send(int connection_fd, char * buf, uint len) {
    unsigned char frame[MSGSIZE + 9];
    uint framesize;

    //       FIN+binary
    frame[0] = 0x82;

    if(len < 126){
        //   mask == 0
        frame[1] = len;
        memcpy(&frame[2], buf, len);
        framesize = len + 2;
    } else if (len >= 126 && len <= 65535) {
        frame[1] = 126;
        frame[2] = (len >> 8);
        frame[3] = (unsigned char) (~0) & len;
        memcpy(&frame[4], buf, len);
        framesize = len + 4;
    } else {
        printf("len' is sooo big - %d\n\n", len);
    }

    write(connection_fd, frame, framesize);
    return 0;
}

int 
ws_get_body(char * buf, uint len) {
    uchar fin    = buf[0] & 0x80;
    uchar opcode = buf[0] & 0x0F;

    //if FIN
    if (fin){
        switch(opcode){
            case 0x1:
                //Text data
                break;
            case 0x2:
                //Binary data
                break;
            case 0x8:
                //Close connection
                break;
            case 0x9:
                //PING opcode(only server can ping)
                printf("We get ping opcode. It's strange.\nO.o\n\n");
                break;
            case 0xA:
                //PONG opcode
                printf("We get pong opcode.\n\n");
                return PINGRET;
                break;
            default:
                printf("Uncorrect opcode - %X\n\n");
                break;
        }
    } else {
        //TODO
        printf("Not FIN frame :(\n\n");
    }
    return 0;
}

int
ws_ping(int connection_fd){
    return 0;
}

int 
is_ws_request(char * buf, uint len) {
    char * r;

    if (strncmp(buf, "GET ", 4)) {
        return 0;
    }

    if (strncmp(strchr(buf, '\r') - 8, "HTTP/1.1", 8)){
        return 0;
    }

    if (!(r = strstr(buf, "Upgrade: websocket")) || !(r < strstr(buf, "\r\n\r\n"))) {
        return 0;
    }

    if (!(r = strstr(buf, "Sec-WebSocket-Key")) || !(r < strstr(buf, "\r\n\r\n"))) {
        return 0;
    }

    return 1;
}
