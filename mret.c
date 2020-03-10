/* 
 * Main file for mret
 * This file creating and initiliazing listener for domain
 * Then listening for new connections and creating pty for work
*/

#include "include.h" // All necessary header files and definitions

int new_pty(char *, int); 
int init_listener(char *, char *); 
int get_connection(int);


int 
main(int argc, char *argv[]) {
    int listener_fd;
    int connection_fd;
    // TODO: User can change default addres and port
    char addr[16] = "127.0.0.1"; // Max addr length "255.255.255.255" + '\0' = 15
    char port[6] = "8080";       // Max port length "65535" + '\0' = 6

    if ((listener_fd = init_listener(addr, port)) < 0) {
        exit(EXIT_FAILURE);
    }

    while(1) {
        connection_fd = get_connection(listener_fd);
        if(connection_fd > 0) {
            new_pty("/bin/bash", connection_fd);
        } else {
            perror("Error in accepting connection");
            printf("Retrying...\n");
        }
    }
    
    close(listener_fd);
    exit(EXIT_SUCCESS);
}
