#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>

int new_pty(char *);

int 
main(void) {
    new_pty("/bin/bash");
    wait(0);
    exit(0);
}
