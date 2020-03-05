#include "include.h"

int ws_init_connection(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
int is_ws_request(char * buf, uint len);


int ws_init_connection(int connection_fd, char * buf, uint len) {
    return 0;
}

int ws_send(int connection_fd, char * buf, uint len) {
    return 0;
}

int ws_get_body(char * buf, uint len) {
    return 0;
}

int is_ws_request(char * buf, uint len) {
    if (strstr(buf, "Upgrade: websocket") != NULL){
        return 1;    
    }
    return 0;
}
