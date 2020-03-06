#include "include.h"

#define rol(value, bits) (((value) << (bits)) | ((value) >> (32 - (bits))))

#if BYTE_ORDER == LITTLE_ENDIAN
#define blk0(i) (block->l[i] = (rol(block->l[i],24)&0xFF00FF00) \
    |(rol(block->l[i],8)&0x00FF00FF))

#elif BYTE_ORDER == BIG_ENDIAN
#define blk0(i) block->l[i]

#else
#error "Endianness not defined!"
#endif

#define blk(i) (block->l[i&15] = rol(block->l[(i+13)&15]^block->l[(i+8)&15] \
    ^block->l[(i+2)&15]^block->l[i&15],1))

#define R0(v,w,x,y,z,i) z+=((w&(x^y))^y)+blk0(i)+0x5A827999+rol(v,5);w=rol(w,30);
#define R1(v,w,x,y,z,i) z+=((w&(x^y))^y)+blk(i)+0x5A827999+rol(v,5);w=rol(w,30);
#define R2(v,w,x,y,z,i) z+=(w^x^y)+blk(i)+0x6ED9EBA1+rol(v,5);w=rol(w,30);
#define R3(v,w,x,y,z,i) z+=(((w|x)&y)|(w&x))+blk(i)+0x8F1BBCDC+rol(v,5);w=rol(w,30);
#define R4(v,w,x,y,z,i) z+=(w^x^y)+blk(i)+0xCA62C1D6+rol(v,5);w=rol(w,30);

void sha1(uchar *buf, uchar *sha_buf, uint len);
int base64(uchar *sha_buf, uchar *base64_buf, uint len);
int ws_init_connection(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
int ws_ping(int connection_fd);
int is_ws_request(char * buf, uint len);


int ws_init_connection(int connection_fd, char * buf, uint len);
int ws_send(int connection_fd, char * buf, uint len);
int ws_get_body(char * buf, uint len);
int is_ws_request(char * buf, uint len);

typedef struct {
    uint32_t state[5];
    uint32_t count[2];
    uchar buffer[64];
} SHA1_CTX;

void SHA1Transform( uint32_t state[5], const unsigned char buffer[64]) {
    uint32_t a, b, c, d, e;
    typedef union {
        unsigned char c[64];
        uint32_t l[16];
    } CHAR64LONG16;

    CHAR64LONG16 block[1];    
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
    memset(block, 0, sizeof(block));
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

void
sha1(uchar *buf, uchar *sha_buf, uint len) {
    SHA1_CTX ctx;
    unsigned int ii;
    SHA1Init(&ctx);
    for (ii = 0; ii < len; ii += 1) {
        SHA1Update(&ctx, (const uchar*)buf + ii, 1);
    }
    SHA1Final((uchar *)sha_buf, &ctx);
    sha_buf[20] = 0;
}

int
base64(uchar * sha_buf, uchar * base64_buf, uint len) {
    uchar charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      "abcdefghijklmnopqrstuvwxyz"
                      "0123456789"
                      "+/";
    int idx, idx2, blks, left_over;
    // If sha_buf is empty, return 0
    if (len < 0) {
        return 0;
    }

    blks = (len / 3) * 3;
    for(idx=0, idx2=0; idx < blks; idx += 3, idx2 += 4) {
        base64_buf[idx2] = charset[sha_buf[idx] >> 2];
        base64_buf[idx2+1] = charset[((sha_buf[idx] & 0x03) << 4) + (sha_buf[idx+1] >> 4)];
        base64_buf[idx2+2] = charset[((sha_buf[idx+1] & 0x0f) << 2) + (sha_buf[idx+2] >> 6)];
        base64_buf[idx2+3] = charset[sha_buf[idx+2] & 0x3F];
    }

    left_over = len % 3;

    if(left_over == 1) {
        base64_buf[idx2] = charset[sha_buf[idx] >> 2];
        base64_buf[idx2+1] = charset[(sha_buf[idx] & 0x03) << 4];
        base64_buf[idx2+2] = '=';
        base64_buf[idx2+3] = '=';
        idx2 += 4;
    } else if(left_over == 2) {
        base64_buf[idx2] = charset[sha_buf[idx] >> 2];
        base64_buf[idx2+1] = charset[((sha_buf[idx] & 0x03) << 4) + (sha_buf[idx+1] >> 4)];
        base64_buf[idx2+2] = charset[(sha_buf[idx+1] & 0x0F) << 2];
        base64_buf[idx2+3] = '=';
        idx2 += 4;
    }

    base64_buf[idx2] = 0;

    return(idx2);
}

int  
ws_init_connection(int connection_fd, char * buf, uint len) {
    int i, j;
    char sec_key_guid[61]; // 24 (secret key len) + 36 (guid) + 1 (\0) = 61
    char * p_key;
    char hash_res[20];
    char base64_res[28];
    char response_headers[] = "HTTP/1.1 101 Switching Protocols\r\n"
                                "Upgrade: websocket\r\n" 
                                "Connection: Upgrade\r\n"
                                "Sec-WebSocket-Accept: ";
    // 97 (response headers) + 28 (new secret key) + 4 (x2 CRLF) + 1 (\0) = 130
    char response[130];
    int hash_len, base64_len;

    // Check if message contain field "Sec-WebSocket-Key"
    if ((p_key = strstr(buf, "Sec-WebSocket-Key:")) == NULL) {
        perror("\"Sec-WebSocket-Key\" field is missing");
        return -1;
    }

    // Copy key to buffer after "Sec-WebSocket-Key"
    for (i = 20, j = 0; p_key[i] != '\n' || p_key[i] != '\r'; i++, j++) {
        sec_key_guid[j] = p_key[i];
    }

    // Concatenate secrete_key with guid
    strcat(sec_key_guid, GUID); 

    // Pass sec_key_guid to SHA1 and get result
    sha1(sec_key_guid, hash_res, 60);

    // Pass sha1 hash result to base64 encode to get new secret key for client
    base64(hash_res, base64_res, 20);

    // Forge response message
    // 97 - strlen(response_headers)
    // 4 - x2 CRLF
    // 1 - '/0'
    snprintf(response, 130, "%s%s%s", response_headers, base64_res, "\r\n\r\n");

    // Send response
    if (send(connection_fd, response, sizeof(char) * strlen(response), MSG_NOSIGNAL) == -1) {
       perror("Error while sending response message for ws init");
       return -1; 
    }

    return 0;
}

int 
ws_send(int connection_fd, char * buf, uint len) {
    unsigned char frame[MSGSIZE + 9];
    uint framesize;

    //       FIN+binary
    frame[0] = 0x82;

    if(len < 126){
        //   mask == 0
        frame[1] = len;
        memcpy(&frame[2], buf, len);
        framesize = len + 2;
    } else if (len >= 126 && len <= 65535) {
        frame[1] = 126;
        frame[2] = (len >> 8);
        frame[3] = (unsigned char) (~0) & len;
        memcpy(&frame[4], buf, len);
        framesize = len + 4;
    } else {
        printf("len' is sooo big - %d\n\n", len);
    }

    write(connection_fd, frame, framesize);
    return 0;
}

int 
ws_get_body(char * buf, uint len) {
    uchar fin    = buf[0] & 0x80;
    uchar opcode = buf[0] & 0x0F;

    //if FIN
    if (fin){
        switch(opcode){
            case 0x1:
                //Text data
                break;
            case 0x2:
                //Binary data
                break;
            case 0x8:
                //Close connection
                break;
            case 0x9:
                //PING opcode(only server can ping)
                printf("We get ping opcode. It's strange.\nO.o\n\n");
                break;
            case 0xA:
                //PONG opcode
                printf("We get pong opcode.\n\n");
                return PONGRET;
                break;
            default:
                printf("Uncorrect opcode - %X\n\n");
                break;
        }
    } else {
        //TODO
        printf("Not FIN frame :(\n\n");
    }
    return 0;
}

int
ws_ping(int connection_fd){
    return 0;
}

int 
is_ws_request(char * buf, uint len) {
    char * r;

    if (strncmp(buf, "GET ", 4)) {
        return 0;
    }

    if (strncmp(strchr(buf, '\r') - 8, "HTTP/1.1", 8)){
        return 0;
    }

    if (!(r = strstr(buf, "Upgrade: websocket")) || !(r < strstr(buf, "\r\n\r\n"))) {
        return 0;
    }

    if (!(r = strstr(buf, "Sec-WebSocket-Key")) || !(r < strstr(buf, "\r\n\r\n"))) {
        return 0;
    }

    return 1;
}
