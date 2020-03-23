#include "include.h"

#include <signal.h>
#include <sys/ioctl.h>
#include <sys/poll.h>
#include <termios.h>
#include <pty.h>

typedef struct {
    int master;             // Master end. 
    int pid;                // Slave end.
    struct pollfd ufds[2];  // Two fds which events will be waited
    char buf[REQUESTSIZE];  // Saving input/output after read here
    struct termios ot, t;   // Struct with terminal attrs
    struct winsize ws;      // Sizes of window
    struct sigaction act;   // Action for signal
} PTY;

int new_pty(char * cmd, int connection_fd);
int shell_run(char * cmd);
int init_pty(PTY * pty, int connection_fd);
int pty_loop(PTY * pty, int connection_fd);
int pty_close(PTY * pty, int connection_fd);
int pty_resize(PTY * pty, char * buf);

volatile int propagate_sigterm = 0;  // If 1, then call ioctl to exit
volatile int propagate_sigchld = 0;  // If 1, then child is dead

void 
signal_handler(int signal) { // Handler for SIGWINCH
    if (signal == SIGTERM) {
        propagate_sigterm = 1;
    } else if (signal == SIGCHLD) {
        propagate_sigchld = 1;
    }
}

int http_response(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
int is_ws_request(char * buf, uint len);
int ws_close(int connection_fd);
int ws_ping(int connection_fd);
int ws_pong(int connection_fd);
int is_http_request(char * buf, uint len);



int
new_pty(char * cmd, int connection_fd) {
    // Start new pty
    int pid;
    PTY * pty;

    // Malloc memory for struct pty and check for error
    if((pty = (PTY *) malloc(sizeof(PTY))) == NULL) {
        perror("Error in malloc for pty struct");
        return -1;
    }

    // Change window size and check for error
    if (ioctl(STDIN_FILENO, TIOCGWINSZ, &pty->ws) < 0) {
        perror("Error in ioctl for window size");
        return -1;
    }

    // Make two processes
    // One for accepting other connections (a.k.a p1)
    // Other for creating pty (a.k.a p2)
    if ((pid = fork()) < 0) {
        perror("Error in fork");
        return -1;
    }

    // p1 returns pid for pty process and waits for new connections
    if (pid) {
        return pid;
    }

    // p2 create pty process
    if ((pty->pid = forkpty(&pty->master, NULL, NULL, &pty->ws)) < 0) {
        perror("Error in ptypair");
        exit(1);
    }

    // newly created pty execute commands in cmd
    if (pty->pid == 0) {
        shell_run(cmd);
        exit(0);
    }

    init_pty(pty, connection_fd);
    pty_loop(pty, connection_fd);
    return 0; // Will not execute
}

int 
shell_run(char * cmd) {
    // Start shell
    execl(cmd, cmd, NULL);
    return 1;
}

int 
init_pty(PTY * pty, int connection_fd) {
    //Initialize pty
    pty->act.sa_handler = signal_handler;
    sigemptyset(&(pty->act.sa_mask));
    pty->act.sa_flags = 0;

    if (sigaction(SIGTERM, &pty->act, NULL) < 0) {
        perror("ptypair: невозможно обработать SIGTERM");
        return 1;
    }
    
    if (sigaction(SIGCHLD, &pty->act, NULL) < 0) {
        perror("ptypair: невозможно обработать SIGCHLD");
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
pty_close(PTY * pty, int connection_fd) {
    // Wait for terminating the process which executes commands
    int w;
    time_t t1, t2;
    
    printf("Terminating pty...\n");

    // Send terminating signal
    kill(pty->pid, SIGTERM);

    // Start time of timer
    if ((t1 = time(0)) == -1) {
        perror("Error while getting time");
    }

    // While process exist, wait for it termination
    do {
        // Update elapsed time of cycle
        if ((t2 = time(0)) == -1) {
            perror("Error while getting time");
        }

        // If 10 seconds or more have passed, than SIGKILL process
        if ((t2 - t1) >= 10) {
            kill(pty->pid, SIGKILL);
            break;
        }

    } while (propagate_sigchld != 1);

    printf("Pty was closed\n");

    // Close connection
    ws_close(connection_fd);

    free(pty);
    exit(0);
}

int pty_resize(PTY * pty, char * buf) {
    uint height = 0;
    uint width  = 0;

    if (strncmp(buf, "\x1b[8;", 4)){
        return -1;
    }

    int i = 4;
    while (buf[i] != ';') {
        int num = buf[i] - '0';

        if (num < 0 || num > 9){
            return -1;
        }

        height *= 10;
        height += num;
        
        ++ i;
    }
    ++ i;

    while (buf[i] != 't') {
        int num = buf[i] - '0';

        if (num < 0 || num > 9){
            return -1;
        }

        width *= 10;
        width += num;
        
        ++ i;
    }

    pty->ws.ws_row = height;
    pty->ws.ws_col = width;

    if (ioctl(pty->master, TIOCSWINSZ, &pty->ws) < 0) {
        perror("Can't set pty size");
    }

    return 0;
}

int
pty_loop(PTY * pty, int connection_fd) {
    //Manage pty input/output
    int len;
    int r;
    int done = 0;
    time_t ping_pong_interval1;
    time_t ping_pong_interval2;
    time_t timeout = 5;

    if ((ping_pong_interval1 = time(0)) == -1) {
        perror("Error while getting time");
        pty_close(pty, connection_fd);
    }

    do {
        r = poll(pty->ufds, 2, -1);

        if ((ping_pong_interval2 = time(0)) == -1) {
            perror("Error while getting time");
            pty_close(pty, connection_fd);
        }

        if ((r < 0) && (errno != EINTR)) {
            done = 1;
            break;
        }

        if ((pty->ufds[0].revents | pty->ufds[1].revents) &
                (POLLERR | POLLHUP | POLLNVAL)) {
            done = 1;
            break;
        }

        if (propagate_sigterm) {
            pty_close(pty, connection_fd);
            propagate_sigterm = 0;
        }
        
        if (propagate_sigchld) {
            pty_close(pty, connection_fd);
        }

        if (pty->ufds[1].revents & POLLIN) {
            len = read(pty->master, pty->buf, REQUESTSIZE);

            if (len >= 1) {
                ws_send(connection_fd, pty->buf, len);
            } else {
                done = 1;
            }
        }

        if (pty->ufds[0].revents & POLLIN) {
            len = read(connection_fd, pty->buf, REQUESTSIZE);

            if (len >= 1) {
                if (!is_http_request(pty->buf, len)) {
                    //ws frame
                    len = ws_get_body(pty->buf, len);
                    if (len >= 1) {
                        write(pty->master, pty->buf, len);
                    // If was returned CLOSERET, close pty
                    } else if (len == CLOSERET) {
                        pty_close(pty, connection_fd);
                    } else if (len == PONGRET) {
                        printf("PONG :)\n");
                        ping_pong_interval1 = time(0);
                    } else if (len == PINGRET) {
                        printf("PONG for PING\n");
                        ws_pong(connection_fd);
                    } else if (len == BINARYRET) { //Resize
                        pty_resize(pty, pty->buf);
                    }
                } else {
                    //http request
                    http_response(connection_fd, pty->buf, len);
                }
            } else {
                 done = 1;
            }
        }

        // Every ten seconds send ping
        if (ping_pong_interval2 - ping_pong_interval1 >= 10) {
            if ((ping_pong_interval1 = time(0)) == -1) {
                perror("Error while getting time");
                pty_close(pty, connection_fd);
            }

            printf("PING :)\n");
            if (ws_ping(connection_fd)) {
                perror("Error while sending ping");
                pty_close(pty, connection_fd);
            }
        } else if (ping_pong_interval2 - ping_pong_interval1 >= 15) {
            printf("No PONG :( Kill client\n");
            pty_close(pty, connection_fd);
        }
    } while (!done);

    tcsetattr(connection_fd, TCSANOW, &pty->ot);
    pty_close(pty, connection_fd);
}
