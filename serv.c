#include "include.h"

#include <netinet/in.h>
#include <arpa/inet.h>

#define DOMAIN AF_INET

int readfile(char * buf, char * path, uint bufsize);
int get_msg_body(char * buf, uint len, char * path, char * type, char * status);
int request_response(int connection_fd, char * buffer, uint len);
int init_listener(char * ip_addr, char * port);
int get_connection(int listener_fd);
int http_response(int connection_fd, char * buf, uint len);
int is_http_request(char * buf, uint len);

int is_ws_request(char * buf, uint len);
int ws_init_connection(int connection_fd, char * buffer, uint len);

const char * http_header                = "HTTP/1.1 ";
const char * http_header_content_type   = "Content-Type: ";
const char * http_header_content_length = "Content-Length: ";

int 
readfile(char * buf, char * path, uint bufsize) {
    //Read content from file in the buf

    int c;
    int i = 0;
    char * _buf = buf;
    FILE * fp = fopen(path, "r");
    
    if (!fp){
        return -1;
    }

    while ((c = fgetc(fp)) != EOF) {
        if ((i ++) >= bufsize){
            return -2;
        }
        *(_buf ++) = c;
    }

    *_buf = 0;
    fclose(fp);

    return 0;
}

int 
get_msg_body(char * buf, uint len, char * path, char * type, char * status) {
    //Get message body from file. 
    //html type - "text/html"

    char header[HEADERSIZE];
    int read_ret = readfile(buf, path, len - HEADERSIZE);

    if(read_ret < 0)
        return read_ret;

    sprintf(header, "%s%s\r\n", http_header, status);
    sprintf(&header[strlen(header)], "%s%s\r\n", http_header_content_type, type);
    sprintf(&header[strlen(header)], "%s%lu\r\n\r\n", http_header_content_length, strlen(buf));
    
    //memcpy(&buf[strlen(header)], buf, strlen(buf)+1);
    char * from = &buf[strlen(buf)];
    char * to = &buf[strlen(buf) + strlen(header)];
    for(; from != buf; --from, --to)
        *to = *from;
    buf[strlen(header)] = buf[0];

    memcpy(buf, header, strlen(header));
    return 0;
}


int is_http_request(char * buf, uint len) {
    char * r;

    if (strncmp(buf, "GET ", 4)) {
        return 0;
    }

    if (strncmp(strchr(buf, '\r') - 8, "HTTP/1.1", 8)){
        return 0;
    }

    if ((r = strstr(buf, "websocket")) && r < strstr(buf, "\r\n\r\n")) {
        return 0;
    }

    if ((r = strstr(buf, "Sec-WebSocket-Key")) && r < strstr(buf, "\r\n\r\n")) {
        return 0;
    }

    return 1;
}

int http_response(int connection_fd, char * buffer, uint len) {
    //Send msg
    int res, pathlen, dirlen;
    char buf[MSGSIZE];
    char type[TYPESIZE];
    char path[PATHSIZE] = CLIENTDIR;

    dirlen = strlen(path);
    pathlen = strchr(&buffer[4], ' ') - &buffer[4];
    strncpy(&path[dirlen], &buffer[4], pathlen);
    path[dirlen + pathlen] = 0;
    printf("%s\n", path);

    if(path[strlen(path) - 1] == '/'){
        strcpy(&path[strlen(path)], "index.html");
    }

    pathlen = strlen(path);

    if(!strcmp(".html", &path[pathlen - 5]))
        strcpy(type, "text/html");
    else if(!strcmp(".js", &path[pathlen - 3]))
        strcpy(type, "application/javascript");
    else if(!strcmp(".css", &path[pathlen - 4]))
        strcpy(type, "text/css");
    else if(!strcmp(".ico", &path[pathlen - 4]))
        strcpy(type, "image/vnd.microsoft.icon");
    else {
        strcpy(type, "text/plain");
    }

    printf("type - %s\n\n", type);

    res = get_msg_body(buf, MSGSIZE, path, type, "200 OK");
    if(res == 0){
        write(connection_fd, buf, strlen(buf));
    } else if (res == -1){
        printf("404 - %s\n", path);
        res = get_msg_body(buf, MSGSIZE, "client/404.html", "text/html", "404 Not Found");
        write(connection_fd, buf, strlen(buf));
    } else if (res == -2) {
        printf("File too big - %s\n\n", path);
    }
    return 0;
}

int
request_response(int connection_fd, char * buffer, uint len) {
    if (is_ws_request(buffer, len)) {
        if (ws_init_connection(connection_fd, buffer, strlen(buffer)) == -1) {
            perror("Error while setting ws connection");
            return -1;
        }
        printf("ws socket open\n\n");
        return connection_fd;
    } else if (is_http_request(buffer, len)) {
        http_response(connection_fd, buffer, len);
    } else {
        printf("Bad request\n\n%s\n", buffer);
    }

    close(connection_fd);
    return -1;
}

int
init_listener(char * ip_addr, char * port) {
    int listener_fd;
    struct sockaddr_in address;
    // Get socket listener and check for error
    if ((listener_fd  = socket(DOMAIN, SOCK_STREAM, 0)) < 0)
    {
        perror("Error while creating socket for listener");
        return -1;
    }

    if (setsockopt(listener_fd, SOL_SOCKET, SO_REUSEADDR, &(int){1}, sizeof(int)) < 0)
        perror("setsockopt(SO_REUSEADDR) failed");

    // Filling sockaddr_in struct
    address.sin_family = DOMAIN;
    address.sin_port = htons( atoi(port) );
    inet_pton(DOMAIN, ip_addr, &(address.sin_addr));

    // Reuse address without waiting and check for error
   /* if (setsockopt(listener_fd, SOL_SOCKET, SO_REUSEADDR, NULL, 0) < 0) {
        perror("Error setting SO_REUSEADDR option for listen_fd");
    }
    */
    // Binding socket and check for error
    if (bind(listener_fd, (struct sockaddr *) &address, sizeof(address)) < 0)
    {
        perror("In bind");
        return -1;
    }

    // Set socket to listen and check for error
    if (listen(listener_fd, 10) < 0)
    {
        perror("In listen");
        return -1;
    }
    
    return listener_fd;
}

int
get_connection(int listener_fd) {
    struct sockaddr_in address;
    int addrlen;
    int connection_fd;

    uint len;
    char buffer[REQUESTSIZE] = {0};

    //Connecting
    if ((connection_fd = accept(listener_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
        perror("Error in accepting connection");
        return -1;
    }

    // Reuse address without waiting and check for error
    if (setsockopt(connection_fd, SOL_SOCKET, SO_REUSEADDR, &(int){1}, sizeof(int)) < 0) {
        perror("setsockopt(SO_REUSEADDR) failed");
    }

    //Get request content
    if ((len = read(connection_fd, buffer, REQUESTSIZE)) < 0) {
        perror("No bytes are there to read\n\n");
        close(connection_fd);
        return -1;
    }

    return request_response(connection_fd, buffer, len);
}
