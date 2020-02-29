#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>

int pty_start(void);

int main(void) {
    pty_start();
    exit(0);
}
