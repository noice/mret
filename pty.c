#include "include.h"

#include <signal.h>
#include <sys/ioctl.h>
#include <sys/poll.h>
#include <termios.h>
#include <pty.h>

typedef struct {
    int master;
    int pid;
    struct pollfd ufds[2];
    char buf[BUFSIZE];
    struct termios ot, t;
    struct winsize ws;
    struct sigaction act;
} PTY;

int new_pty(char * cmd, int connection_fd);
int shell_run(char * cmd);
int init_pty(PTY * pty, int connection_fd);
int pty_loop(PTY * pty, int connection_fd);

volatile int propagate_sigwinch = 0;

void 
sigwinch_handler(int signal) {
    propagate_sigwinch = 1;
}

int
new_pty(char * cmd, int connection_fd) {
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
        return pid;
    }

    if ((pty->pid = forkpty(&pty->master, NULL, NULL, &pty->ws)) < 0) {
        perror("ptypair");
        exit(1);
    }

    if (pty->pid == 0) {
        shell_run(cmd);
        exit(0);
    }

    init_pty(pty, connection_fd);
    pty_loop(pty, connection_fd);

    close(connection_fd);
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
init_pty(PTY * pty, int connection_fd) {
    //Initialize pty
    pty->act.sa_handler = sigwinch_handler;
    sigemptyset(&(pty->act.sa_mask));
    pty->act.sa_flags = 0;
    if (sigaction(SIGWINCH, &pty->act, NULL) < 0) {
        perror("ptypair: невозможно обработать SIGWINCH");
        return 1;
    }

    tcgetattr(connection_fd, &pty->ot);
    pty->t = pty->ot;
    pty->t.c_lflag &= ~(ICANON | ISIG | ECHO | ECHOCTL | ECHOE |
                   ECHOK | ECHOKE | ECHONL | ECHOPRT);
    pty->t.c_iflag |= IGNBRK;
    pty->t.c_cc[VMIN] = 1;
    pty->t.c_cc[VTIME] = 0;
    tcsetattr(connection_fd, TCSANOW, &pty->t);

    pty->ufds[0].fd = connection_fd;
    pty->ufds[0].events = POLLIN;
    pty->ufds[1].fd = pty->master;
    pty->ufds[1].events = POLLIN;
    
    return 0;
}

int
pty_loop(PTY * pty, int connection_fd) {
    //Manage pty input/output
    int i;
    int done = 0;
    int r;

    do {
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
                 //write(STDOUT_FILENO, pty->buf, i);
             } else {
                 done = 1;
             }
        }

        if (pty->ufds[0].revents & POLLIN) {
             i = read (connection_fd, pty->buf, BUFSIZE);
             if (i >= 1) {
                 printf("%s", pty->buf);
                 //write(pty->master, pty->buf, i);
             } else {
                  done = 1;
             }
        }
    } while (!done);

    tcsetattr(connection_fd, TCSANOW, &pty->ot);
    return 0;
}
