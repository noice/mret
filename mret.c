#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>

int pty_start(void);

int main(void) {
    pty_start();
    wait(0);
    exit(0);
}
