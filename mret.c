#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/wait.h>

int new_pty(char *);
int init_listener(char *, char *);
int listen_loop(int);

int listener_fd;

int 
main(void) {
    new_pty("/bin/bash");

    listener_fd = init_listener("127.0.0.1", "8080");

    while(1){
        listen_loop(listener_fd);
    }
    
    close(listener_fd);
    //wait(0);
    exit(0);
}
