var WHITE = 1;
var BLACK = 0;
var INVERSE = -1;

var display = {
	C_BLACK: BLACK,
	C_WHITE: WHITE,
	textColor: BLACK,
	textSize: 1,
	textWrap: false,
	invert: 0,
	crX: 0,
	crY: 0,
};

display.setTextColor = function( c )
{
	this.textColor = c;
}

display.setTextSize = function( s )
{
	this.textSize = s;
}

display.setTextWrap = function( w )
{
	this.textWrap = w;
}

display.invertDisplay = function( i ) {
	this.invert = i;
	if ( this.invert ) {
		this.C_BLACK = BLACK;
		this.C_WHITE = WHITE;
	} else {
		this.C_BLACK = WHITE;
		this.C_WHITE = BLACK;
	}
}

display.clearDisplay = function()
{
	emu.ctx.clearRect( 0, 0, emu.canvas.width, emu.canvas.height );
}

display.setCursor = function( x, y )
{
	this.crX = Math.round(x);
	this.crY = Math.round(y);
}

display.print = function( text )
{
	var font = emu.font_white;
	if ( this.textColor == this.C_BLACK ) font = emu.font_black;

	for ( var i = 0; i < text.length; i++ ) {
		var c = text.charCodeAt(i) * 5;

		if ( this.textColor == INVERSE ) {
			var d = emu.ctx.getImageData( this.crX, this.crY, 1, 1 );
			if (d.data[0] == 0) {
				font = font = emu.font_white;
			} else {
				font = font = emu.font_black;
			}
		}

		emu.ctx.drawImage( font, c, 0, 5, 8, this.crX, this.crY, 5, 8 );
		this.crX += 6;
	}
}

display.drawRect = function( x, y, w, h, c )//drawRect(125 - i*4, 61, 3, 3, WHITE);
{
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);

	emu.ctx.rect( x+0.5, y+0.5, w-1, h-1 );
	emu.ctx.stroke();
}

display.fillRect = function( x, y, w, h, c )//drawRect(125 - i*4, 61, 3, 3, WHITE);
{
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);

	if ( c == this.C_WHITE ) emu.ctx.fillStyle = '#FFFFFF';
	if ( c == this.C_BLACK ) emu.ctx.fillStyle = '#000000';
	if ( c == INVERSE ) emu.ctx.fillStyle = '#0000FF';

	emu.ctx.fillRect( x, y, w, h );
	emu.ctx.stroke();
	emu.ctx.fillStyle = '#000000';
}

display.drawBitmap = function( x, y, img, w, h, c )
{
	x = Math.round(x);
	y = Math.round(y);
	w = Math.round(w);
	h = Math.round(h);

	emu.ctx.drawImage( img, x, y );
}

display.drawLine = function( x1, y1, x2, y2, c )
{
	x1 = Math.round(x1);
	x2 = Math.round(x2);
	y1 = Math.round(y1);
	y2 = Math.round(y2);

	if ( c == this.C_BLACK ) emu.ctx.strokeStyle = '#000000';
	if ( c == this.C_WHITE ) emu.ctx.strokeStyle = '#FFFFFF';

	emu.ctx.beginPath();
	emu.ctx.moveTo( x1+0.5, y1+0.5 );
	emu.ctx.lineTo( x2+0.5, y2+0.5 );
	emu.ctx.stroke();
}

display.display = function()
{

}