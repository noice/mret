#include "include.h"

int ws_init_connection(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
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
    char response_headers[] = "HTTP/1.1 200 OK\r\n"   //Why not "HTTP/1.1 101 Switching Protocols\r\n" 
                                "Upgrade: websocket\r\n" 
                                "Connection: Upgrade\r\n"
                                "Sec-WebSocket-Accept: ";
    // 97 (response headers) + 76 (max base64 length) + 4 (x2 CRLF) = 177
    char response[177];

    // Check if message contain field "Sec-WebSocket-Key"
    if ((p_key = strstr(buf, "Sec-WebSocket-Key:")) == NULL) {
        perror("\"Sec-WebSocket-Key\" field is missing");
        return -1;
    }

    // Copy key to buffer after "Sec-WebSocket-Key"
    for (i = 20, j = 0; p_key[i] != '\n'; i++, j++) {
        sec_key_guid[j] = p_key[i];
    }

    // Concatenate secrete_key with guid
    strcat(sec_key_guid, GUID); 

    // Pass sec_key_guid to SHA1 and get result
    hash_res = sha1(sec_key_guid);

    // Pass sha1 hash result to base64 encode to get new secret key for client
    base64_res = base64(hash_res);

    // Forge response message
    snprintf(response, (97 + strlen(base64_res) + 4), "%s%s%s", response_headers, base64_res, "\r\n\r\n");

    // Send response
    if (send(connection_fd, response, sizeof(char) * strlen(response), MSG_NOSIGNAL) == -1) {
       perror("Error while sending response message for ws init");
       return -1; 
    }

    return 0;
}

int 
ws_send(int connection_fd, char * buf, uint len) {
    return 0;
}

int 
ws_get_body(char * buf, uint len) {
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

int
is_ws_frame(char * buf, uint len) {
    return 0;
}
