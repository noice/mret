#include "include.h"

#include <string.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define DOMAIN AF_INET

int readfile(char * buf, char * path);
int get_msg_body(char * buf, char * path, char * type);
int request_response(int connection_fd, char * buffer);
int init_listener(char * ip_addr, char * port);
int get_connection(int listener_fd);

const char * http_header                = "HTTP/1.1 200 OK";
const char * http_header_content_type   = "Content-Type: ";
const char * http_header_content_length = "Content-Length: ";

int 
readfile(char * buf, char * path) {
    //Read content from file in the buf
    //TODO: Check bufsize, error handling

    int c;
    char * _buf = buf;
    FILE * fp = fopen(path, "r");

    while ((c = fgetc(fp)) != EOF) {
            *(_buf ++) = c;
    }

    *_buf = 0;
    fclose(fp);

    return 0;
}

int 
get_msg_body(char * buf, char * path, char * type) {
    //Get message body from file. 
    //html type - "text/html"

    char header[300];
    if(readfile(buf, path))
        return 1;

    sprintf(header, "%s\n", http_header);
    sprintf(&header[strlen(header)], "%s%s\n", http_header_content_type, type);
    sprintf(&header[strlen(header)], "%s%lu\n\n", http_header_content_length, strlen(buf));
    
    //memcpy(&buf[strlen(header)], buf, strlen(buf)+1);
    char * from = &buf[strlen(buf)];
    char * to = &buf[strlen(buf) + strlen(header)];
    for(; from != buf; --from, --to)
        *to = *from;
    buf[strlen(header)] = buf[0];

    memcpy(buf, header, strlen(header));
    return 0;
}

int
request_response(int connection_fd, char * buffer) {
    if (!strncmp(buffer, "GET / HTTP/1.1", 14)) {
        if (strstr(buffer, "Accept: text/html")){
            //Send msg
            char buf[10000];
            get_msg_body(buf, "index.html", "text/html"); 
            write(connection_fd, buf, strlen(buf));
        } else {
            printf("Non html request :(\n\n");
            close(connection_fd);
            return -1;
        }
    } else {
        printf("Bad request\n\n%s\n", buffer);
        close(connection_fd);
        return -1;
    }

    return connection_fd;
}

int
init_listener(char * ip_addr, char * port)
{
    int listener_fd;
    struct sockaddr_in address;
    // Get socket listener and check for error
    if ((listener_fd  = socket(DOMAIN, SOCK_STREAM, 0)) < 0)
    {
        perror("In socket");
        return -1;
    }

    // Filling sockaddr_in struct
    address.sin_family = DOMAIN;
    address.sin_port = htons( atoi(port) );
    inet_pton(DOMAIN, ip_addr, &(address.sin_addr));

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

    //Connecting
    if ((connection_fd = accept(listener_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
        perror("In accept");
        return -1;
    }

    //Get request content
    char buffer[1025] = {0};
    if (read(connection_fd, buffer, 1024) < 0) {
        printf("No bytes are there to read\n\n");
        close(connection_fd);
        return -1;
    }
    //printf("%s", buffer);

    return request_response(connection_fd, buffer);
}
