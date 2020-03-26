const colormap = {
    0: 'rgb(0, 0, 0)',
    1: 'rgb(170, 0, 0)',
    2: 'rgb(0, 170, 0)',
    3: 'rgb(170, 85, 0)',
    4: 'rgb(0, 0, 170)',
    5: 'rgb(170, 0, 170)',
    6: 'rgb(0, 170, 170)',
    7: 'rgb(170, 170, 170)'
};

const brcolormap = {
    0: 'rgb(85, 85, 85)',
    1: 'rgb(255, 85, 85)',
    2: 'rgb(85, 255, 85)',
    3: 'rgb(255, 255, 85)',
    4: 'rgb(85, 85, 255)',
    5: 'rgb(255, 85, 255)',
    6: 'rgb(85, 255, 255)',
    7: 'rgb(255, 255, 255)'
};

const col8bitmap = {
    0: '0',
    1: '95',
    2: '135',
    3: '175',
    4: '215',
    5: '255'
};

var dcolor = brcolormap[7];
var dbgcolor = colormap[0];
var dcurcolor = colormap[0];
var dcurbgcolor = brcolormap[7];

function Style () {
    this.color = dcolor;
    this.bgcolor = dbgcolor;
    this.curcolor = dcolor;
    this.curbgcolor = dbgcolor;
    this.brightness = 0;
    this.reverse = 0;
}

var defaultStyle = new Style();

function getColor(buf, i){
    if(buf[i + 1] == 5){
        let col = buf[i + 2];
        if(col < 8)
            return colormap[col];
        else if(col < 16)
            return brcolormap[col + 8];
        else if(col < 232){
            col -= 16;
            let redcolor = col8bitmap[parseInt(col/36)];
            let gcol = col % 36;
            let bluecolor = col8bitmap[gcol % 6];
            gcol = parseInt(gcol / 6);
            let greencolor = col8bitmap[gcol];

            return 'rgb(' + redcolor + ', ' + greencolor + ', ' + bluecolor + ')';
        } else {
            let t = 8;
            t += (col - 232) * 10;
            return 'rgb(' + t.toString() + ', ' + t.toString() + ', ' + t.toString() + ')';
        }

    } else if(buf[i + 1] == 2){
        return 'rgb(' + buf[i + 2].toString() + ', ' + buf[i + 3].toString() + ', ' + buf[i + 4].toString() + ')';
    }

}

function handleCGR(buf) {
    for(let i = 0; i < buf.length; i ++) {
        let it = buf[i];

        if (screen.style.reverse){
            if (it >= 30 && it <= 39)
                it += 10;
            else if (it >= 40 && it <= 49)
                it -= 10;
            else if (it >= 90 && it <= 97)
                it += 10;
            else if (it >= 100 && it <= 107)
                it -= 10;
        }

        switch(it) {
            case 0:
                screen.style.color = defaultStyle.color;
                screen.style.bgcolor = defaultStyle.bgcolor;
                screen.style.brightness = 0;
                screen.style.reverse = 0;
                break;
            case 1:
                screen.style.brightness = 1;
                break;
            case 7:  //Reverse video
                if (!screen.style.reverse){
                    screen.style.reverse = 1;
                    [screen.style.color, screen.style.bgcolor] = [screen.style.bgcolor, screen.style.color];
                } else {
                    screen.style.reverse = 0;
                    [screen.style.color, screen.style.bgcolor] = [screen.style.bgcolor, screen.style.color];
                }
                break;
            case 27: //Inverse off
                if(screen.style.reverse){
                    screen.style.reverse = 0;
                    [screen.style.color, screen.style.bgcolor] = [screen.style.bgcolor, screen.style.color];
                }
                break;
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
                if(screen.style.brightness)
                    screen.style.color = brcolormap[it % 10];
                else 
                    screen.style.color =   colormap[it % 10];
                break;

            case 38: // 8-bit and 24-bit colors
                screen.style.color = getColor(buf, i);
                if(buf[i + 1] == 5)
                    i += 2;
                else if(buf[i + 1] == 2)
                    i += 4;
                break;
            case 39:
                if(!screen.style.reverse)
                    screen.style.color = defaultStyle.color;
                else
                    screen.style.color = defaultStyle.bgcolor;
                break;

            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
                if(screen.style.brightness)
                    screen.style.bgcolor = brcolormap[it % 10];
                else 
                    screen.style.bgcolor =   colormap[it % 10];
                break;

            case 48: // 8-bit and 24-bit background colors
                screen.style.bgcolor = getColor(buf, i);
                if(buf[i + 1] == 5)
                    i += 2;
                else if(buf[i + 1] == 2)
                    i += 4;
                break;
            case 49:
                if(!screen.style.reverse)
                    screen.style.bgcolor = defaultStyle.bgcolor;
                else
                    screen.style.bgcolor = defaultStyle.color;
                break;

            case 90:
            case 91:
            case 92:
            case 93:
            case 94:
            case 95:
            case 96:
            case 97:
                screen.style.color = brcolormap[it % 10];
                break;

            case 100:
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
            case 106:
            case 107:
                screen.style.bgcolor = brcolormap[it % 10];
                break;
            default:
                break;
        }
    }
}

