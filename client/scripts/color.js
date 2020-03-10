var dcolor = 'white';
var acolor = dcolor;

var brightness = 0;

var dbgcolor = 'black';
var abgcolor = dbgcolor;

var curcolor = dcolor;
var curbgcolor = dbgcolor;

var dcurcolor = 'black';
var dcurbgcolor = 'white';

var colormap = {
    0: 'black',
    1: 'maroon',
    2: 'green',
    3: 'olive',
    4: 'blue',
    5: 'purple',
    6: 'teal',
    7: 'silver'
};

var brcolormap = {
    0: 'gray',
    1: 'red',
    2: 'lime',
    3: 'yellow',
    4: 'cornflowerblue',
    5: 'magenta',
    6: 'cyan',
    7: 'white'
};

var col8bitmap = {
    0: '00',
    1: '5F',
    2: '87',
    3: 'AF',
    4: 'D7',
    5: 'FF'
};

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

            return '#' + redcolor + greencolor + bluecolor;
        } else {
            let t = 8;
            t += (col - 232) * 10;
            return 'rgb(' + t.toString() + ',' + t.toString() + ',' + t.toString() + ')';
        }

    } else if(buf[i + 1] == 2){
        return 'rgb(' + buf[i + 2].toString() + ',' + buf[i + 3].toString() + ',' + buf[i + 4].toString() + ')';
    }

}

function handleCGR(buf) {
    for(let i = 0; i < buf.length; i ++) {
        let it = buf[i];
        switch(it) {
            case 0:
                acolor = dcolor;
                abgcolor = dbgcolor;
                brightness = 0;
                break;
            case 1:
                brightness = 1;
                break;
            case 30:
            case 31:
            case 32:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
                if(brightness)
                    acolor = brcolormap[it % 10];
                else 
                    acolor =   colormap[it % 10];
                break;

            case 38: // 8-bit and 24-bit colors
                acolor = getColor(buf, i);
                if(buf[i + 1] == 5)
                    i += 2;
                else if(buf[i + 1] == 2)
                    i += 4;
                break;

            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
                if(brightness)
                    abgcolor = brcolormap[it % 10];
                else 
                    abgcolor =   colormap[it % 10];
                break;

            case 48: // 8-bit and 24-bit background colors
                abgcolor = getColor(buf, i);
                if(buf[i + 1] == 5)
                    i += 2;
                else if(buf[i + 1] == 2)
                    i += 4;
                break;

            default:
                break;
        }
    }
}

