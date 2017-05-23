var joy = {
	x: 0,
	y: 0,
	btn: false,
	up: false,
	down: false,
	left: false,
	right: false
}

joy.update = function()
{
	joy.x = 0;
	joy.y = 0;
	if ( joy.up ) joy.y += 127;
	if ( joy.down ) joy.y -= 127;
	if ( joy.left ) joy.x -= 127;
	if ( joy.right ) joy.x += 127;
}

$(document).on( 'keydown', joy_keydown );
$(document).on( 'keyup', joy_keyup );

function joy_keydown( e )
{
	switch (e.keyCode) {
		case 32:
			joy.btn = true;
			break;
		case 37:
			joy.left = true;
			break;
		case 38:
			joy.up = true;
			break;
		case 39:
			joy.right = true;
			break;
		case 40:
			joy.down = true;
			break;		
	}
	joy.update();
}

function joy_keyup( e )
{
	switch (e.keyCode) {
		case 32:
			joy.btn = false;
			break;
		case 37:
			joy.left = false;
			break;
		case 38:
			joy.up = false;
			break;
		case 39:
			joy.right = false;
			break;
		case 40:
			joy.down = false;
			break;		
	}
	joy.update();
}