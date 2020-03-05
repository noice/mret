include "myws.h"

#define BUFSIZE 1024
#define FILESTR 32
#define ALLARRAY 64
#define SHA_DIGEST_LENGTH 20
#define SW_BUF 65552

char patch_to_dir[ALLARRAY] = {0,};
char fpfile[ALLARRAY] = {0,};
char buffer[BUFSIZE] = {0,};
int client_fd, count_warning_log =0;
struct stat stat_buf;
sem_t sem;

typedef struct {
    uint32_t state[5];
    uint32_t count[2];
    unsigned char buffer[64];
} SHA1_CTX;

void SHA1Transform( uint32_t state[5], const unsigned char buffer[64]) {
    uint32_t a, b, c, d, e;
    typedef union {
        unsigned char c[64];
        uint32_t l[16];
    } CHAR64LONG16;

    HAR64LONG16 block[1];    
    memcpy(block, buffer, 64);

    a = state[0]; b = state[1]; c = state[2]; d = state[3]; e = state[4];

    R0(a, b, c, d, e, 0); R0(e, a, b, c, d, 1); R0(d, e, a, b, c, 2); R0(c, d, e, a, b, 3);
    R0(b, c, d, e, a, 4); R0(a, b, c, d, e, 5); R0(e, a, b, c, d, 6); R0(d, e, a, b, c, 7);
    R0(c, d, e, a, b, 8); R0(b, c, d, e, a, 9); R0(a, b, c, d, e, 10); R0(e, a, b, c, d, 11);
    R0(d, e, a, b, c, 12); R0(c, d, e, a, b, 13); R0(b, c, d, e, a, 14); R0(a, b, c, d, e, 15);
    R1(e, a, b, c, d, 16); R1(d, e, a, b, c, 17); R1(c, d, e, a, b, 18); R1(b, c, d, e, a, 19);
    R2(a, b, c, d, e, 20); R2(e, a, b, c, d, 21); R2(d, e, a, b, c, 22); R2(c, d, e, a, b, 23);
    R2(b, c, d, e, a, 24); R2(a, b, c, d, e, 25); R2(e, a, b, c, d, 26); R2(d, e, a, b, c, 27);
    R2(c, d, e, a, b, 28); R2(b, c, d, e, a, 29); R2(a, b, c, d, e, 30); R2(e, a, b, c, d, 31);
    R2(d, e, a, b, c, 32); R2(c, d, e, a, b, 33); R2(b, c, d, e, a, 34); R2(a, b, c, d, e, 35);
    R2(e, a, b, c, d, 36); R2(d, e, a, b, c, 37); R2(c, d, e, a, b, 38); R2(b, c, d, e, a, 39);
    R3(a, b, c, d, e, 40); R3(e, a, b, c, d, 41); R3(d, e, a, b, c, 42); R3(c, d, e, a, b, 43);
    R3(b, c, d, e, a, 44); R3(a, b, c, d, e, 45); R3(e, a, b, c, d, 46); R3(d, e, a, b, c, 47);
    R3(c, d, e, a, b, 48); R3(b, c, d, e, a, 49); R3(a, b, c, d, e, 50); R3(e, a, b, c, d, 51);
    R3(d, e, a, b, c, 52); R3(c, d, e, a, b, 53); R3(b, c, d, e, a, 54); R3(a, b, c, d, e, 55);
    R3(e, a, b, c, d, 56); R3(d, e, a, b, c, 57); R3(c, d, e, a, b, 58); R3(b, c, d, e, a, 59);
    R4(a, b, c, d, e, 60); R4(e, a, b, c, d, 61); R4(d, e, a, b, c, 62); R4(c, d, e, a, b, 63);
    R4(b, c, d, e, a, 64); R4(a, b, c, d, e, 65); R4(e, a, b, c, d, 66); R4(d, e, a, b, c, 67);
    R4(c, d, e, a, b, 68); R4(b, c, d, e, a, 69); R4(a, b, c, d, e, 70); R4(e, a, b, c, d, 71);
    R4(d, e, a, b, c, 72); R4(c, d, e, a, b, 73); R4(b, c, d, e, a, 74); R4(a, b, c, d, e, 75);
    R4(e, a, b, c, d, 76); R4(d, e, a, b, c, 77); R4(c, d, e, a, b, 78); R4(b, c, d, e, a, 79);

    state[0] += a; state[1] += b; state[2] += c; state[3] += d; state[4] += e;
    a = b = c = d = e = 0;
    memeset(block, 0, sizeof(block));
}

void SHA1Init( SHA1_CTX * context) {
    context->state[0] = 0x67452301;
    context->state[1] = 0xEFCDAB89;
    context->state[2] = 0x98BADCFE;
    context->state[3] = 0x10325476;
    context->state[4] = 0xC3D2E1F0;
    context->count[0] = context->count[1] = 0;
}

void SHA1Update( SHA1_CTX * context, const unsigned char *data, uint32_t len) {
    uint32_t i;
    uint32_t j;

    j = context->count[0];
    if ((context->count[0] += len << 3) < j) context->count[1]++;

    context->count[1] += (len >> 29);
    j = (j >> 3) & 63;
    if((j + len) > 63) {
        memcpy(&context->buffer[j], data, (i = 64 - j));

        SHA1Transform(context->state, context->buffer);
        for(; i + 63 < len; i += 64) {
            SHA1Transform(context->state, &data[i]);
        }

        j = 0;
    }

    else i = 0;

    memcpy(&context->buffer[j], &data[i], len - i);
}
void SHA1Final( unsigned char digest[20], SHA1_CTX * context) {
    unsigned i;
    unsigned char c, finalcount[8];

    for(i = 0; i < 8; i++) {
        finalcount[i] = (unsigned char) ((context->count[(i >= 4 ? 0 : 1)] >> ((3 - (i & 3)) * 8)) & 255);     
    }

    c = 0200;
    SHA1Update(context, &c, 1);

    while((context->count[0] & 504) != 448) {
        c = 0000;
        SHA1Update(context, &c, 1);
    }

    SHA1Update(context, finalcount, 8); 

    for(i = 0; i < 20; i++) {
        digest[i] = (unsigned char) ((context->state[i >> 2] >> ((3 - (i & 3)) * 8)) & 255);
    }

    memset(context, 0, sizeof(*context));
    memset(&finalcount, 0, sizeof(finalcount));
}

void SHA1(unsigned char *hash_out, const char *str, unsigned int len)
{
    SHA1_CTX ctx;
    unsigned int ii;
    SHA1Init(&ctx);
    for (ii=0; ii<len; ii+=1) {
        SHA1Update(&ctx, (const unsigned char*)str + ii, 1);
    }
    SHA1Final((unsigned char *)hash_out, &ctx);
    hash_out[20] = 0;
}

int base64_encode(unsigned char sha_key_in[], unsigned char base64_key_out[], int len)
{
    int idx, idx2, blks, left_over;

    blks = (len / 3) * 3;
    for(idx=0, idx2=0; idx < blks; idx += 3, idx2 += 4) 
    {
        base64_key_out[idx2] = charset[sha_key_in[idx] >> 2];
        base64_key_out[idx2+1] = charset[((sha_key_in[idx] & 0x03) << 4) + (sha_key_in[idx+1] >> 4)];
        base64_key_out[idx2+2] = charset[((sha_key_in[idx+1] & 0x0f) << 2) + (sha_key_in[idx+2] >> 6)];
        base64_key_out[idx2+3] = charset[sha_key_in[idx+2] & 0x3F];
    }

    left_over = len % 3;

    if(left_over == 1) 
    {
        base64_key_out[idx2] = charset[sha_key_in[idx] >> 2];
        base64_key_out[idx2+1] = charset[(sha_key_in[idx] & 0x03) << 4];
        base64_key_out[idx2+2] = '=';
        base64_key_out[idx2+3] = '=';
        idx2 += 4;
    }

    else if(left_over == 2) 
    {
        base64_key_out[idx2] = charset[sha_key_in[idx] >> 2];
        base64_key_out[idx2+1] = charset[((sha_key_in[idx] & 0x03) << 4) + (sha_key_in[idx+1] >> 4)];
        base64_key_out[idx2+2] = charset[(sha_key_in[idx+1] & 0x0F) << 2];
        base64_key_out[idx2+3] = '=';
        idx2 += 4;
    }

    base64_key_out[idx2] = 0;
    return(idx2);
}


void error_log(char *my_error) 
{ 
    time_t t;
    time(&t);
    FILE *f;
    f = fopen("/var/log/ErrorWsstd.log", "a"); 
    if (f == NULL) {
        printf("Error open /var/log/ErrorWsstd.log.\n");
    }
    fprintf(f, "%s", ctime( &t));
    fprintf(f, "Error %s\n\n", my_error);
    printf("Error %s Write to /var/log/ErrorWsstd.log.\n", my_error);
    fclose(f);
    exit(0);
}

void warning_access_log(char *war_ac) {  
    count_warning_log++;
    if (count_warning_log > 100) {
        system("gzip -f /var/log/Access_warning.log");
        count_warning_log = 0;
        time_t t;
        time(&t);
        FILE *f;
        f = fopen("/var/log/Access_warning.log", "w"); 
        fprintf(f, "%s", ctime( &t));
        fprintf(f, "%s\n\n", war_ac);
        printf("_______________________________________\nWrite to /var/log/Access_warning.log...\n%s\n", war_ac);
        fclose(f);
    }
    else {
        time_t t;
        time(&t);
        FILE *f;
        f = fopen("/var/log/Access_warning.log", "a"); 
        fprintf(f, "%s", ctime( &t));
        fprintf(f, "%s\n\n", war_ac);
        printf("_______________________________________\nWrite to /var/log/Access_warning.log...\n%s\n", war_ac);
        fclose(f);
    }
}

void read_in_file(char *name_file) { 
    off_t offset = 0;
    memset(&stat_buf, 0, sizeof(stat_buf));    
    memset(fpfile, 0, ALLARRAY);
    snprintf(fpfile, (int)strlen(patch_to_dir) + (int)strlen(name_file) + 1, "%s%s", patch_to_dir, name_file);
    int file = open(fpfile, O_RDONLY);

    if(file < 0) {
        if(close(client_fd) == -1) {
            warning_access_log("open file close client_fd.");
        }
        warning_access_log("Not File."); 
    }

    else {
        if(fstat(file, &stat_buf) != 0) error_log("fstat.");
        if(sendfile(client_fd, file, &offset, stat_buf.st_size) == -1) warning_access_log("sendfile."); 
        if(close(file) == -1) error_log("close file.");
        if(close(client_fd) == -1) warning_access_log("in function read_in_file() - close client_fd.");
        warning_access_log(buffer);
        printf("Trans %s\n\n", name_file);
    }
}

void * ws _func(void *client_arg) { 
    int client_fd = * (int *) client_arg;
    sem_post(&sem);
    warning_access_log("START_WS");
    printf("\nClient ID - %d\n", client_fd);
    char inbuf[SW_BUF] = {0,};
    char reciv_r[48] = {0,};

    while(1) {
        memset(inbuf, 0, SW_BUF); 
        long int rec_b = read(client_fd, inbuf, SW_BUF - 1); // ожидаем данные от клиента и читаем их по приходу

        memset(reciv_r, 0, 48);
        snprintf(reciv_r, 47, "%s%ld%s%d\n", "Ws_func recive ", rec_b, " bytes from clien ",  client_fd);
        warning_access_log(reciv_r); // пишем событие в лог

        if (rec_b == 0 || rec_b == -1) { // если клиент отвалился или что-то нехорошо, тогда...
            memset(reciv_r, 0, 48);
            snprintf(reciv_r, 47, "%s%ld%s%d\n", "Ws_func read return - ", rec_b, ", DIE clien - ",  client_fd);
            warning_access_log(reciv_r); // пишем ссобытие в лог
            if (close(client_fd) == -1) warning_access_log("Error close client in WS_1."); // закрываем соединение с клиентом
            pthread_exit(NULL);
        } 

        if(rec_b > 0) {  // если чё то получили, то ...                    
            char masking_key[4] = {0,}; // сюда положим маску
            char opcode; // сюда тип фрейма
            unsigned char payload_len; // сюда длину сообщения (тела), то есть без служебных байтов либо цифры 126 или 127

            opcode = inbuf[0] & 0x0F;  
            printf("FIN: 0x%02X\n", inbuf[0] & 0x01);
            printf("RSV1: 0x%02X\n", inbuf[0] & 0x02);
            printf("RSV2: 0x%02X\n", inbuf[0] & 0x04);
            printf("RSV3: 0x%02X\n", inbuf[0] & 0x08);
            printf("Opcode: 0x%02X\n", inbuf[0] & 0x0F);

            payload_len = inbuf[1] & 0x7F; 
            printf("Maska: 0x%02x\n", inbuf[1] & 0x80 ? 1:0);

            unsigned char payload[SW_BUF] = {0,};


            if (opcode == WS_CLOSING_FRAME) { // от клиента получен код закрытия соединения
                memset(reciv_r, 0, 48);
                snprintf(reciv_r, 47, "%s%d\n", "Ws_func recive opcod - 0x08, DIE clien - ",  client_fd);
                warning_access_log(reciv_r); // пишем ссобытие в лог
                if(close(client_fd) == -1) warning_access_log("Error close client in WS_2."); // закрываем соединение с клиентом
                pthread_exit(NULL); // убиваем поtok
            }

            else if (opcode == WS_PONG_FRAME) {// от клиента получен PONG (маскированный)
                masking_key[0] = inbuf[2];
                masking_key[1] = inbuf[3];
                masking_key[2] = inbuf[4];
                masking_key[3] = inbuf[5]; 

                unsigned int i = 6, pl = 0;
                for (; pl < payload_len; i++, pl++) {
                    payload[pl] = inbuf[i]^masking_key[pl % 4]; 
                }

                printf("Payload_len: %d\n", inbuf[1] & 0x7F);
                printf("\nRecive PONG and text \"%s\"\n", payload);
            }

            else if (opcode == WS_TEXT_FRAME && payload_len < 126) {// от клиента получен текст
                masking_key[0] = inbuf[2];
                masking_key[1] = inbuf[3];
                masking_key[2] = inbuf[4];
                masking_key[3] = inbuf[5]; 

                unsigned int i = 6, pl = 0;
                for (; pl < payload_len; i++, pl++) {
                    payload[pl] = inbuf[i]^masking_key[pl % 4]; 
                }

                printf("Payload_len: %d\n", inbuf[1] & 0x7F);     
                printf("\nReciv TEXT_FRAME from %d client, payload: %s\n", client_fd, payload);


                if (payload[0] == 'p' && payload[1] == 'i' && payload[2] == 'n' && payload[3] == 'g') { // от клиента получен текст "ping"  
                    printf("\nPING client - %d\n", client_fd); 

                    char ping[] = {0x89, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f}; // Ping - не маскированный, тело содержит слово Hello, это же слово вернётся с Понгом
                    // char ping[] = {0x89, 0x05, 'H', 'e', 'l', 'l', 'o'}; // можно так

                    if(send(client_fd, ping, 7, 0) == -1) {
                        warning_access_log("Error PING."); 
                        if(close(client_fd) == -1) warning_access_log("Error close client in WS_3."); // закрываем соединение с клиентом
                        pthread_exit(NULL); 
                    }
                }

                else if (payload[0] == 'c' && payload[1] == 'l' && payload[2] == 'o' && payload[3] == 's' && payload[4] == 'e') { // от клиента получен текст "close"
                    printf("\nClose client - %d\n", client_fd); 

                    char close_client[] = {0x88, 0};

                    if (send(client_fd, close_client, 2, 0) == -1) {
                        warning_access_log("Error CLOSE."); 
                        if (close(client_fd) == -1) warning_access_log("Error close client in WS_4."); // закрываем соединение с клиентом
                        pthread_exit(NULL); 
                    }
                }

                else if (payload[0] == 'h' && payload[1] == 'i') {// от клиента получен текст "hi"
                    char messag[] = "Hi client - ";
                    int message_size = (int) strlen(messag);
                    char out_data[128] = {0,};
                    memcpy(out_data + 2, messag, message_size); // копируем сообщение в массив "out_data" начиная со второго байта (первые два байта для опкода и длины тела)
                    char nom_client[5] = {0,};
                    sprintf(nom_client, "%d", client_fd); // номер клиента
                    int nom_client_size = (int) strlen(nom_client);
                    memcpy(out_data + 2 + message_size, nom_client, nom_client_size); // копируем номер клиента в массив "out_data" следом за сообщением

                    message_size += nom_client_size; // получаем длину тела сообщения

                    out_data[0] = 0x81;
                    out_data[1] = (char)message_size;

                    printf("\nSize out Msg1: %d\n", message_size);

                    if(send(client_fd, out_data, message_size + 2, 0) == -1) {
                        warning_access_log("Error Hi."); 
                        if(close(client_fd) == -1) warning_access_log("Error close client in WS_5."); // закрываем соединение с клиентом
                        pthread_exit(NULL); 
                    }
                }

                else if (payload[0] == 'H' && payload[1] == 'I') { // от клиента получен текст "HI"
                    char messag[] = "istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru_istarik.ru";

                    unsigned short message_size = strlen(messag);
                    char out_data[SW_BUF] = {0,};
                    memcpy(out_data + 4, messag, message_size); // копируем сообщение в массив "out_data" начиная со второго байта (первые два байта для опкода и длины тела)

                    out_data[0] = 0x81; // == 10000001 == FIN1......opcod 1 (текст)
                    out_data[1] = 126; // пишем цифру 126, котороя в двоичном виде == 01111110, соответственно маска 0, остальные 7 бит == 126
                    out_data[3] = message_size & 0xFF; // собираем длину сообщения
                    out_data[2] = (message_size >> 8) & 0xFF; // собираем длину сообщения

                    printf("\nSize out Msg2: %d\n", message_size);

                    if(send(client_fd, out_data, message_size + 4, 0) == -1) {// отправка
                        warning_access_log("Error Hi."); 
                        if(close(client_fd) == -1) warning_access_log("Error close client in WS_5."); // закрываем соединение с клиентом
                        pthread_exit(NULL); 
                    }
                }
                else {
                    char messag[] = "I do not know what to tell you bro... Link OK. But what do you want I do not understand, explain how a human being...";
                    int message_size = (int) strlen(messag);
                    char out_data[128] = {0,};
                    memcpy(out_data + 2, messag, message_size); // копируем сообщение в массив "out_data" начиная со второго байта (первые два байта для опкода и длины тела)

                    out_data[0] = 0x81;
                    out_data[1] = (char)message_size;

                    printf("\nSize out Msg3: %d\n", message_size);

                    if (send(client_fd, out_data, message_size + 2, 0) == -1) {
                        warning_access_log("Error Hi."); 
                        if(close(client_fd) == -1) warning_access_log("Error close client in WS_5."); // закрываем соединение с клиентом
                        pthread_exit(NULL); 
                    }
                }

            } // END if < 126

            else if (opcode == WS_TEXT_FRAME && payload_len == 126) { // от клиента получен текст
                unsigned char len16[2] = {0,};
                unsigned int payload_len16 = 0;
                len16[0] = inbuf[2]; 
                len16[1] = inbuf[3]; 
                payload_len16 = (len16[0] << 8) | len16[1]; // собираем длину сообщения

                masking_key[0] = inbuf[4];
                masking_key[1] = inbuf[5];
                masking_key[2] = inbuf[6];
                masking_key[3] = inbuf[7]; 

                unsigned int i = 8, pl = 0;
                for(; pl < payload_len16; i++, pl++)
                {
                payload[pl] = inbuf[i]^masking_key[pl % 4]; 
                }

                printf("Payload_code: %d\n", inbuf[1] & 0x7F);  
                printf("Payload_len16: %u\n", payload_len16);       
                printf("\nReciv TEXT_FRAME from %d client, payload: %s\n", client_fd, payload);
            }

            /*else if(opcode == WS_TEXT_FRAME && payload_len == 127) // от клиента получен текст
            {
            // text > 65535
            }*/

            else
            {
            //
            } 

        } // END if(n > 0)  
    } // END while(1)
} // END ws_func

int main(int argc, char *argv[]) {  
    if (argc != 3) error_log("not argumets.");

    unsigned int PORTW = strtoul(argv[1], NULL, 0); // порт для web-сервера 80
    strncpy(patch_to_dir, argv[2], 63); // путь к файлу index.html
    warning_access_log("START");
    pthread_t ws_thread;


    /////////////////////////////////////////////////////////    WEB    ///////////////////////////////////////////////////////////////
    int one = 1;
    struct sockaddr_in svr_addr, cli_addr;
    socklen_t sin_len = sizeof(cli_addr);

    int sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock < 0) error_log("not socket.");

    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(int));

    svr_addr.sin_family = AF_INET;
    svr_addr.sin_addr.s_addr = INADDR_ANY;
    svr_addr.sin_port = htons(PORTW);

    if (bind(sock, (struct sockaddr *) &svr_addr, sizeof(svr_addr)) == -1) {
        close(sock);
        error_log("bind.");
    }

    if (listen(sock, 5) == -1) {
        close(sock);
        error_log("listen.");
    }

    signal(SIGPIPE, SIG_IGN);

    char str_from_buf[FILESTR] = {0,};
    char result_file[FILESTR] = {0,};

    for(;;) {
        client_fd = accept(sock, (struct sockaddr *) &cli_addr, &sin_len);

        if (client_fd == -1) continue;

        printf("Сonnected %s:%d client - %d\n", inet_ntoa(cli_addr.sin_addr), ntohs(cli_addr.sin_port), client_fd);

        memset(buffer, 0, BUFSIZE);
        memset(str_from_buf, 0, FILESTR);
        memset(result_file, 0, FILESTR);
        char *p = NULL;

        if (read(client_fd, buffer, BUFSIZE - 1) == -1) warning_access_log("Error in main - read_client_fd.");

        int i = 0;
        for(; i < FILESTR; i++) {
            str_from_buf[i] = buffer[i];
            if (str_from_buf[i] == '\n') break;
            if (i > 31) {
                str_from_buf[i] = '\0';
                break;  
            }
        }


        if ((strstr(str_from_buf, "GET / ")) != NULL) {
            if(send(client_fd, response, (int)strlen(response), MSG_NOSIGNAL) == -1) warning_access_log("send response.");
            read_in_file("index.html");
        }

        /////////////////////////////////// WS /////////////////////////////////////////////////
        else if ((strstr(str_from_buf, "GET /ws ")) != NULL) {
            warning_access_log(buffer);
            if ((p = strstr(buffer, "Sec-WebSocket-Key:")) != NULL) {
                char resultstr[64] = {0,};
                int i = 0, it = 0;
                for(i = 19; it < 24; i++, it++) {
                    resultstr[it] = p[i];
                }

                strcat(resultstr, GUIDKey);

                printf("\n_____________|Key ot clienta__________|GUIDKey____________________________\n");
                printf("Result_stroka:%s\n", resultstr);


                ////////////////////////////sha1///////////////////////////////////////
                unsigned char temp[SHA_DIGEST_LENGTH] = {0,};
                SHA1(temp, resultstr, strlen(resultstr));

                ///////////////////// нужна только для того чтоб увидеть SHA1-хеш //////////////////////
                char buf[SHA_DIGEST_LENGTH*2] = {0,};                                               //
                for(i=0; i < SHA_DIGEST_LENGTH; i++) {
                    sprintf((char*)&(buf[i*2]), "%02x", temp[i]);
                }                                                                                  //
                printf("\nSHA1_hash:%s\n", buf);                                                    // 
                ////////////////////////////////////////////////////////////////////////////////////////

                ////////////////////////////Base64//////////////////////////////////// 
                unsigned char key_out[64] = {0,};
                base64_encode(temp, key_out, sizeof(temp));

                printf("\nKey_for_client:%s\n", key_out);

                sem_init(&sem, 0, 0);

                char resp[131] = {0,};
                snprintf(resp, 130, "%s%s%s", response_ws, key_out, "\r\n\r\n");
                if (send(client_fd, resp, sizeof(char) * strlen(resp), MSG_NOSIGNAL) == -1) warning_access_log("send response_ws.");

                //////////////////////////// START WS /////////////////////////////////
                if (pthread_create(&ws_thread, NULL, &ws_func, &client_fd) != 0) error_log("creating WS.");
                pthread_detach(ws_thread);
                sem_wait(&sem);
            }
        }

        else if((p = strstr(str_from_buf, ".png")) != NULL) {
            int index = p - str_from_buf;
            int i = 0;
            int otbor = 0;
            for(; i < index + 3; i++) {
                result_file[i] = str_from_buf[i];

                if(result_file[i] == '/') {
                    otbor = i;
                }
            }

            memset(result_file, 0, FILESTR);
            strncpy(result_file, str_from_buf + otbor - 3, index -1); //  otbor + 1
            if (send(client_fd, response_img, (int)strlen(response_img), MSG_NOSIGNAL) == -1) warning_access_log("Error send response_img.");
            read_in_file(result_file);
        }

        else if ((p = strstr(str_from_buf, ".css")) != NULL) {
            int index = p - str_from_buf;
            int i = 0;
            int otbor = 0;
            for(; i < index + 3; i++) {
                result_file[i] = str_from_buf[i];
                if(result_file[i] == '/') {
                    otbor = i;
                }
            }

            memset(result_file, 0, FILESTR);
            strncpy(result_file, str_from_buf + otbor + 1, index -1);
            if (send(client_fd, response_css, (int)strlen(response_css), MSG_NOSIGNAL) == -1) warning_access_log("Error send response_css.");
            read_in_file(result_file);
        }

        else if((strstr(str_from_buf, "jquery.js")) != NULL) {
            if(send(client_fd, response_js, (int)strlen(response_js), MSG_NOSIGNAL) == -1) warning_access_log("Error send response_js.");
            read_in_file("jquery.js");
        }
        else if ((strstr(str_from_buf, "favicon.ico")) != NULL) {
            if(send(client_fd, response_xicon, (int)strlen(response_xicon), MSG_NOSIGNAL) == -1) warning_access_log("Error send favicon.ico.");
            read_in_file("favicon.ico");
        }
        else {
            if(send(client_fd, response_403, sizeof(response_403), MSG_NOSIGNAL) == -1) warning_access_log("Error send response_403.");
            if(close(client_fd) == -1) warning_access_log("Error close client_fd 403.");
            warning_access_log(buffer);
        }

    }// end for(;;)

} //END main

