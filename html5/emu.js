$(window).on( 'load', emu_init );

var emu = {};

function emu_init()
{
	emu.canvas = document.createElement( 'canvas' );
	emu.canvas.width = 128;
	emu.canvas.height = 64;
	emu.ctx = emu.canvas.getContext( '2d' );
	emu.ctx.lineWidth = 1;
	emu.ctx.font = "8px monospace";
    emu.ctx.textBaseline = "top";
    emu.inverted = ($('#screen[inverted]').length > 0);
	$('#screen').append( emu.canvas );

	emu.millis = 0;
	emu.skip = 0;
	emu.skip_def = 1;

	game_gfx();

	emu.font_black = emu_image( 'font_black' );
	emu.font_white = emu_image( 'font_white' );

	emu.splash = new Image();
	emu.splash.src = './gfx/splash_screen.png';
	emu.splash.onload = emu_setup;
}

function emu_image( src )
{
	var img = new Image();
	img.src = ( emu.inverted ? './gfx/' : './gfx_i/' ) + src + '.png';
	return img;
}

function emu_setup()
{
	emu.ctx.drawImage( emu.splash, 0, 0 );
	setup();

	emu.time = Date.now();

	emu_loop();
}

function emu_loop()
{
	if ( emu.skip > 0 ) {
		emu.skip--;
		requestAnimationFrame(emu_loop);
		return;
	}
	emu.skip = emu.skip_def;

	var t = Date.now();
	var d = t - emu.time;
	emu.millis += d;
	emu.time = t;

	loop();

	requestAnimationFrame(emu_loop);
}

function millis()
{
	return emu.millis;
}

function random( min, max )
{
	return Math.floor( Math.random() * ( max - min ) + min );
}

function F(text)
{
	return text;
}

function byte(num)
{
	while (num > 255) {
		num -= 256;
	}

	while (num < 0) {
		num += 256;
	}

	return num;
}