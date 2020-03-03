#include "include.h"

#include <signal.h>
#include <sys/wait.h>

int new_pty(char *, int);
int init_listener(char *, char *);
int listen_loop(int);

int listener_fd;
int connection_fd;

int 
main(void) {
    listener_fd = init_listener("127.0.0.1", "8080");

    while(1){
        connection_fd = listen_loop(listener_fd);
        new_pty("/bin/bash", connection_fd);
    }
    
    close(listener_fd);
    //wait(0);
    exit(0);
}
