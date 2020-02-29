#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>
#include <sys/poll.h>
#include <termios.h>
#include <unistd.h>
#include <pty.h>


volatile int propagate_sigwinch = 0;

void sigwinch_handler(int signal) {
    propagate_sigwinch = 1;
}

int main(void) {
    int master;
    int pid;
    struct pollfd ufds[2];
    int i;
    #define BUFSIZE 1024
    char buf[1024];
    struct termios ot, t;
    struct winsize ws;
    int done = 0;
    struct sigaction act;
    if (ioctl(STDIN_FILENO, TIOCGWINSZ, &ws) < 0) {
        perror("ptypair: не удается получить размеры окна");
        exit(1);
    }

    if ((pid = forkpty(&master, NULL, NULL, &ws)) < 0) {
        perror("ptypair");
        exit(1);
    }

    if (pid == 0) {
        execl("/bin/bash", "/bin/bash", 0);
        exit(1);
    }

    act.sa_handler = sigwinch_handler;
    sigemptyset(&(act.sa_mask));
    act.sa_flags = 0;
    if (sigaction(SIGWINCH, &act, NULL) < 0) {
        perror("ptypair: невозможно обработать SIGWINCH");
        exit(1);
    }

    tcgetattr(STDIN_FILENO, &ot);
    t = ot;
    t.c_lflag &= ~(ICANON | ISIG | ECHO | ECHOCTL | ECHOE |
                   ECHOK | ECHOKE | ECHONL | ECHOPRT);
    t.c_iflag |= IGNBRK;
    t.c_cc[VMIN] = 1;
    t.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSANOW, &t);

    ufds[0].fd = STDIN_FILENO;
    ufds[0].events = POLLIN;
    ufds[1].fd = master;
    ufds[1].events = POLLIN;

    do {
        int r;

        r = poll(ufds, 2, -1);
        if ((r < 0) && (errno != EINTR)) {
            done = 1;
            break;
        }

        if ((ufds[0].revents | ufds[1].revents) &
                (POLLERR | POLLHUP | POLLNVAL)) {
            done = 1;
            break;
        }

        if (propagate_sigwinch) {
            if (ioctl(STDIN_FILENO, TIOCGWINSZ, &ws) < 0) {
                perror("ptypair: не удается получить размеры окна");
            }
            if (ioctl(master, TIOCSWINSZ, &ws) < 0) {
                perror("не удается восстановить размеры окна");
            }

            propagate_sigwinch = 0;

            continue;
        }

        if (ufds[1].revents & POLLIN) {
             i = read (master, buf, BUFSIZE);
             if (i >= 1) {
                 write(STDOUT_FILENO, buf, i);
             } else {
                 done = 1;
             }
        }

        if (ufds[0].revents & POLLIN) {
             i = read (STDIN_FILENO, buf, BUFSIZE);
             if (i >= 1) {
                 write(master, buf, i);
             } else {
                  done = 1;
             }
        }
    } while (!done);
    tcsetattr(STDIN_FILENO, TCSANOW, &ot);
    exit(0);
}
