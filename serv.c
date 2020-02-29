#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PORT 8080

int main(int argc, char** argv[])
{
    int serv_f, new_socket;
    struct sockaddr_in address;
    long valread;
    int addrlen = sizeof(address);

    char *hello = "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length:12\n\nHello world!";

    if ((serv_f = socket(AF_INET, SOCK_STREAM, 0)) < 0)
    {
        perror("In socket");
        exit(EXIT_FAILURE);
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    memset(address.sin_zero, '\0', sizeof(address.sin_zero));

    if (bind(serv_f, (struct sockaddr *) &address, sizeof(address)) < 0)
    {
        perror("In bind");
        exit(1);
    }

    if (listen(serv_f, 10) < 0)
    {
        perror("In listen");
        exit(EXIT_FAILURE);
    }

    while (1)
    {
        printf("\n++++++ Waiting for new connection ++++++\n\n");
        if ((new_socket = accept(serv_f, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0)
            {
                perror("In accept");
                exit(EXIT_FAILURE);
            }

        char buffer[30000] = {0};
        valread = read(new_socket, buffer, 1024);
        printf("%s\n", buffer);
        if (valread < 0)
        {
            printf("No bytes are there to read");
        }

        write(new_socket, hello, strlen(hello));
        printf("--------------------------- Hello message sent -----------------------\n");
        close(new_socket);
    }

    return 0;
}
