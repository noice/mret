#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>
#include <sys/poll.h>
#include <termios.h>
#include <unistd.h>
#include <pty.h>

#define BUFSIZE 1024

typedef struct {
    int master;
    int pid;
    struct pollfd ufds[2];
    char buf[BUFSIZE];
    struct termios ot, t;
    struct winsize ws;
    struct sigaction act;
} PTY;

int new_pty(char * cmd);
int shell_run(char * cmd);
int init_pty(PTY * pty);
int pty_loop(PTY * pty);

volatile int propagate_sigwinch = 0;

void 
sigwinch_handler(int signal) {
    propagate_sigwinch = 1;
}

int
new_pty(char * cmd) {
    //Start new pty
    int pid;
    PTY * pty;
    
    if((pty = (PTY *) malloc(sizeof(PTY))) == NULL){
        perror("malloc: не удалось выделить память");
        return -1;
    }

    if (ioctl(STDIN_FILENO, TIOCGWINSZ, &pty->ws) < 0) {
        perror("ptypair: не удается получить размеры окна");
        return -1;
    }

    if ((pid = fork()) < 0) {
        perror("fork: не удалось создать поток");
        return -1;
    }

    if(pid){
        return 0;
    }

    if ((pty->pid = forkpty(&pty->master, NULL, NULL, &pty->ws)) < 0) {
        perror("ptypair");
        exit(1);
    }

    if (pty->pid == 0) {
        shell_run(cmd);
    }

    init_pty(pty);
    pty_loop(pty);
    free(pty);
    exit(0);
}

int 
shell_run(char * cmd) {
    //Start shell
    execl(cmd, cmd, 0);
    return 1;
}

int 
init_pty(PTY * pty) {
    //Initialize pty
    pty->act.sa_handler = sigwinch_handler;
    sigemptyset(&(pty->act.sa_mask));
    pty->act.sa_flags = 0;
    if (sigaction(SIGWINCH, &pty->act, NULL) < 0) {
        perror("ptypair: невозможно обработать SIGWINCH");
        return 1;
    }

    tcgetattr(STDIN_FILENO, &pty->ot);
    pty->t = pty->ot;
    pty->t.c_lflag &= ~(ICANON | ISIG | ECHO | ECHOCTL | ECHOE |
                   ECHOK | ECHOKE | ECHONL | ECHOPRT);
    pty->t.c_iflag |= IGNBRK;
    pty->t.c_cc[VMIN] = 1;
    pty->t.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSANOW, &pty->t);

    pty->ufds[0].fd = STDIN_FILENO;
    pty->ufds[0].events = POLLIN;
    pty->ufds[1].fd = pty->master;
    pty->ufds[1].events = POLLIN;
    
    return 0;
}

int
pty_loop(PTY * pty) {
    //Manage pty input/output
    int i;
    int done = 0;

    do {
        int r;

        r = poll(pty->ufds, 2, -1);
        if ((r < 0) && (errno != EINTR)) {
            done = 1;
            break;
        }

        if ((pty->ufds[0].revents | pty->ufds[1].revents) &
                (POLLERR | POLLHUP | POLLNVAL)) {
            done = 1;
            break;
        }

        if (propagate_sigwinch) {
            if (ioctl(STDIN_FILENO, TIOCGWINSZ, &pty->ws) < 0) {
                perror("ptypair: не удается получить размеры окна");
            }
            if (ioctl(pty->master, TIOCSWINSZ, &pty->ws) < 0) {
                perror("не удается восстановить размеры окна");
            }

            propagate_sigwinch = 0;
            continue;
        }

        if (pty->ufds[1].revents & POLLIN) {
             i = read (pty->master, pty->buf, BUFSIZE);
             if (i >= 1) {
                 write(STDOUT_FILENO, pty->buf, i);
             } else {
                 done = 1;
             }
        }

        if (pty->ufds[0].revents & POLLIN) {
             i = read (STDIN_FILENO, pty->buf, BUFSIZE);
             if (i >= 1) {
                 write(pty->master, pty->buf, i);
             } else {
                  done = 1;
             }
        }
    } while (!done);

    tcsetattr(STDIN_FILENO, TCSANOW, &pty->ot);
    return 0;
}
