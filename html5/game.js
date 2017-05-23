/* GFX */
var player_right    = null;
var player_left     = null;
var life            = null;
var oxy             = null;
var oxy_indicator   = null;
var fish_left       = null;
var fish_right      = null;
var man_left        = null;
var man_right       = null;
var sub_left        = null;
var sub_right       = null;
var player_dead     = null;

function game_gfx()
{
    player_right    = emu_image( 'player_right' );  //[ 0x02, 0x00, 0x06, 0x00, 0x06, 0x00, 0xBF, 0xC0, 0xFF, 0xE0, 0xFF, 0x20, 0xBF, 0xC0, 0x00, 0x00];
    player_left     = emu_image( 'player_left' );   //[ 0x08, 0x00, 0x0C, 0x00, 0x0C, 0x00, 0x7F, 0xA0, 0xFF, 0xE0, 0x9F, 0xE0, 0x7F, 0xA0, 0x00, 0x00];
    life            = emu_image( 'life' );          //[ 0x20, 0x30, 0x7D, 0xFF, 0x7D, 0x00, 0x00, 0x00, ];
    oxy             = emu_image( 'oxy' );           //[ 0x4A, 0xA0, 0xA4, 0x40, 0x4A, 0x40, ];
    oxy_indicator   = emu_image( 'oxy_indicator' ); //[ 0xAA, 0xAA, 0xAA, ];
    fish_left       = emu_image( 'fish_left' );     //[ 0x00, 0x00, 0x10, 0x3B, 0x5E, 0x3B, 0x00, 0x00, ];
    fish_right      = emu_image( 'fish_right' );    //[ 0x00, 0x00, 0x08, 0xDC, 0x7A, 0xDC, 0x00, 0x00, ];
    man_left        = emu_image( 'man_left' );      //[ 0x00, 0x00, 0x20, 0x70, 0x1E, 0x08, 0x04, 0x00, ];
    man_right       = emu_image( 'man_right' );     //[ 0x00, 0x00, 0x04, 0x0E, 0x78, 0x10, 0x20, 0x00, ];
    sub_left        = emu_image( 'sub_left' );      //[ 0x00, 0x20, 0x30, 0x7D, 0xFF, 0xBF, 0x7D, 0x00, ];
    sub_right       = emu_image( 'sub_right' );     //[ 0x00, 0x04, 0x0C, 0xBE, 0xFF, 0xFD, 0xBE, 0x00, ];
    player_dead     = emu_image( 'player_dead' );   //[ 0x08, 0x00, 0x50, 0x0A, 0x02, 0x6C, 0x48, 0x3C, 0x0C, 0x34, 0x7C, 0x74, 0x3C, 0x34, 0x34, 0x18];
}

/* STUCTS */
var SL_ACTIVE   = parseInt('00000001', 2);
var SL_ENEMY1   = parseInt('00000010', 2);
var SL_ENEMY2   = parseInt('00000100', 2);
var SL_ENEMY3   = parseInt('00001000', 2);
var SL_MAN      = parseInt('00010000', 2);
var SL_DIR      = parseInt('00100000', 2);
var SL_TYPE     = parseInt('01000000', 2);
var SL_MISSILE  = parseInt('10000000', 2);
function SUBLINE() {
  this.flags = 0; // flags 0x01=ACTIVE 0x02=1st enemy alive 0x04=2nd enemy alive 0x08=3rd enemy alive 0x10=has man 0x20=direction(left/right) 0x40=enemy type 0x80=missile fired
  this.count = 0; // enemy count (max 3)
  this.pos = 0; // position of enemies/man
  this.missile = 0; // missile position
};

/* GLOBAL VARIABLES */
var SCR_GAME = 0x00;
var SCR_MENU = 0x01;
var SCR_OVER = 0x02;
var SCR_HISC = 0x03;
var SCR_ABOU = 0x04;
var player_x = 63;
var player_y = 10;
var player_d = 0;
var score = 0;
var score_high = 0;
var score_add = 0;
var lives = 3;
var oxygen = 1;
var captured = 0;
var flash = false;
var flash_t = 0;
var lines = [ new SUBLINE(), new SUBLINE(), new SUBLINE(), new SUBLINE() ];
var player_alive = true;
var line_timer = 0;
var torpedo_x = 0;
var torpedo_y = 0;
var torpedo_d = 0;
var screen = SCR_MENU;
var menu_item = 0;
var joy_y = 0;
var about_scroll = 0;
var patrol = 0;

function setup()
{
    score_high = 0;//eeprom_read_word(0x0000);

    display.setTextColor(WHITE);
    //display.setTextColor(uint16_t color, uint16_t backgroundcolor);
    display.setTextSize(1);
    display.setTextWrap(false);
    //display.clearDisplay();
    display.invertDisplay( ( emu.inverted ? 1 : 0 ) );

    lives = 0;
    player_alive = 0;
    player_y = 73;
    menu_item = 0;
    screen = SCR_MENU;
}

function loop()
{
  if (millis() - flash_t > 100) {
    flash_t = millis();
    flash = !flash;
  }
  
  update_game();
  draw_game();

  switch (screen) {
    case SCR_MENU:
      draw_menu();
      break;
    case SCR_OVER:
      draw_gameover();
      break;
    case SCR_HISC:
      draw_hiscore();
      break;
    case SCR_ABOU:
      draw_about();
      break;
  }
  
  display.display();
}

function draw_about()
{
    joy.update();
    if (get_joy_button()) {
        screen = SCR_MENU;
        menu_item = 0;
    }
}

function draw_hiscore()
{
  var x = 24;
  var y = 19;

  joy.update();
  menu_item -= get_joy_y();
  if (menu_item < 0) menu_item = 0;
  if (menu_item > 1) menu_item = 1;
  
  display.fillRect(x, y, 80, 36, BLACK);
  display.drawRect(x, y, 80, 36, WHITE);

  display.fillRect(x+2, y+2 + (menu_item + 1) * 11, 76, 10, WHITE);

  display.setTextColor(INVERSE);
  display.setCursor(x + 5, y + 3);
  display.print(F("Hi-Score:"));
  display.setCursor(x + 5, y + 14);
  if (menu_item == 0) {
    display.print(F("Reset?"));
  } else {
    display.print(String(score_high));
  }
  display.setCursor(x + 5, y + 25);
  display.print(F("Back to menu"));
  display.setTextColor(WHITE);

  if (get_joy_button()) {
    switch (menu_item) {
      case 0:
        score_high = 0;
        //eeprom_write_word(0x0000, score_high);
        menu_item = 1;
        break;
      case 1:
        menu_item = 0;
        screen = SCR_MENU;
        break;
    }
  }
}

function draw_gameover()
{
  var x = 24;
  var y = 19;

  joy.update();
  if (get_joy_button()) {
    screen = SCR_MENU;
    menu_item = 0;
  }

  display.fillRect(x, y, 80, 36, BLACK);
  display.drawRect(x, y, 80, 36, WHITE);

  display.fillRect(x+2, y+2, 76, 10, WHITE);

  display.setTextColor(INVERSE);
  display.setCursor(x + 14, y + 3);
  display.print(F("GAME OVER"));
  display.setCursor(x + 4, y + 14);
  if (score >= score_high) {
    display.print(F("New Hi-Score:"));
  } else {
    display.print(F("Score:"));
  }
  display.setCursor(x + 4, y + 25);
  display.print(String(score));
  display.setTextColor(WHITE);
}

function draw_menu()
{
  var x = 24;
  var y = 19;

  joy.update();
  menu_item -= get_joy_y();
  if (menu_item < 0) menu_item = 0;
  if (menu_item > 2) menu_item = 2;

  if (get_joy_button()) {
    if (menu_item == 0) {
      screen = SCR_GAME;
      lives = 3;
      score = 0;
      reset_lines();
      reset_game();
    }
    if (menu_item == 1) {
      menu_item = 1;
      screen = SCR_HISC;
    }
    if (menu_item == 2) {
      menu_item = 0;
      about_scroll = 0;
      screen = SCR_ABOU;
    }
  }
  
  display.fillRect(x, y, 80, 36, BLACK);
  display.drawRect(x, y, 80, 36, WHITE);

  display.fillRect(x+2, y+2 + menu_item * 11, 76, 10, WHITE);

  display.setTextColor(INVERSE);
  display.setCursor(x + 11, y + 3);
  display.print(F("Start game"));
  display.setCursor(x + 18, y + 14);
  display.print(F("Hi-score"));
  display.setCursor(x + 26, y + 25);
  display.print(F("About"));
  display.setTextColor(WHITE);
}

function reset_lines()
{
  var i;
  for (i = 0; i < 4; i++) {
    lines[i].flags = 0x00;
  }
}

function get_joy_y() // int
{
    if (joy.y != 0) {
        joy_y = (joy.y > 0 ? 1 : -1);
    } else if(joy_y != 0) {
        var r = joy_y;
        joy_y = 0;
        return r;
    }
    return 0;
}

function get_joy_button() // bool
{
    if (joy.btn) {
        //while (joy.btn) { joy.update(); }
        joy.btn = false;
        return true;
    }
    return false;
}

function update_game()
{
  if (score_add > 0) {
    score_add--;
    score++;
  }

  if (millis() - line_timer > 1000) {
    line_timer = millis();
    start_line(random(0,4));
  }

  if (torpedo_d != 0) {
    torpedo_x += torpedo_d * 2;
    if (torpedo_x < -10 || torpedo_x > 138) torpedo_d = 0;
  }
  
  if (player_alive) {
    // joystick controls
    if (!(player_y == 10 && oxygen < 1023)) {
      joy.update();
      if (joy.x > 0) { player_x += 1; player_d = 0; }
      if (joy.x < 0) { player_x -= 1; player_d = 1; }
      if (joy.y > 0) player_y -= 1;
      if (joy.y < 0) player_y += 1;
      if (player_y < 10) player_y = 10;
      if (player_y > 57) player_y = 57;
      if (player_x < 7) player_x = 7;
      if (player_x > 120) player_x = 120;
      if (joy.btn && torpedo_d == 0 && player_y != 10) {
        torpedo_x = player_x;
        torpedo_y = player_y + 1;
        torpedo_d = (player_d == 0 ? 1 : -1);
      }
    }
    
    // oxygen
    if (oxygen > 0 && player_y > 10) oxygen--;
    if (player_y == 10 && oxygen < 1023) oxygen += 20;
    if (oxygen > 1023) oxygen = 1023;
    if (oxygen == 0) player_alive = false;

    if (player_y == 10 && captured > 0) {
      if (captured == 5) score_add += 50;
      score_add += captured * 25;
      captured = 0;
    }
    
  } else {
    player_y++;

    if (player_y > 70) {
      if (lives > 0) {
        lives--;
        reset_game();
      } else {
        if (screen == SCR_GAME) {
          score = score + score_add;
          score_add = 0;
          if (score > score_high) {
            score_high = score;
            // save hi-score to eeprom
            //eeprom_write_word(0x0000, score_high);
          }
          screen = SCR_OVER;
        }
        player_y = 71;
      }
    }
  }
}

function reset_game()
{
    patrol = 0;
    player_x = 63;
    player_y = 10;
    player_alive = true;
    oxygen = 1;
    captured = 0;
}

function draw_game()
{
    var i;
    display.clearDisplay();

    // draw ui
    draw_ui();

    // water_line
    display.drawLine(0, 10, 127, 10, WHITE);

    // patrol
    draw_patrol();

    // lines
    for (i = 0; i < 4; i++) {
        draw_line(i);
    }

    // player
    draw_player();
}

function draw_patrol()
{
    if (score < 1500 && screen != SCR_MENU) return;

    display.drawBitmap(192 - patrol, 5, sub_left, 8, 8, WHITE);
    if (192 - patrol > player_x - 5 && 192 - patrol < player_x + 5 && player_y == 10) {
        player_alive = false;
    }
    patrol = byte(patrol+1);
}

function start_line(l)
{
    l = byte(l);
    var max_count = 2;
    if (score > 500) max_count = 3;
    if (score > 1000) max_count = 4;

    if (lines[l].flags != 0x00) return;
    lines[l].flags = SL_ACTIVE | (random(1,3) == 1 ? SL_MAN : 0) | (random(1,3) == 1 ? SL_DIR : 0) | (random(1,3) == 1 ? SL_TYPE : 0);
    lines[l].count = max_count - 1;//random(1, 4);
    if (lines[l].count == 1) lines[l].flags = lines[l].flags | SL_ENEMY1;
    if (lines[l].count == 2) lines[l].flags = lines[l].flags | SL_ENEMY2 | SL_ENEMY1;
    if (lines[l].count == 3) lines[l].flags = lines[l].flags | SL_ENEMY3 | SL_ENEMY2 | SL_ENEMY1;
    lines[l].pos = 128 - 80 * (lines[l].flags & SL_DIR ? -1 : 1);
}


function draw_line(l)
{ // flags 0x01=ACTIVE 0x02=1st enemy alive 0x04=2nd enemy alive 0x08=3rd enemy alive 0x10=has man 0x20=direction(left/right) 0x40=enemy type 0x80=
    l = byte(l);
  var i, x, y;
  if (!(lines[l].flags & SL_ACTIVE)) return;
  var dir = (lines[l].flags & SL_DIR ? -1 : 1);
  lines[l].pos += dir;
  if (lines[l].pos == 0 || lines[l].pos == 255) {
    lines[l].flags = 0x00;
    return;
  }

  for (i = 0; i < lines[l].count; i++) {
    if (!(lines[l].flags & (SL_ENEMY1 << i))) continue;
    
    x = lines[l].pos - 68 - i * 12 * dir;
    y = 15 + l*12;

    if (!(lines[l].flags & SL_MISSILE) && (lines[l].flags & SL_TYPE) && score >= 500) {
      if ( player_y > y && player_y < y+8 && ((player_x > x && dir > 0) || (player_x < x && dir < 0)) ) {
        lines[l].flags = lines[l].flags | SL_MISSILE;
        lines[l].missile = 0;
        if (lines[l].flags & SL_ENEMY2) lines[l].missile = 12;
        if (lines[l].flags & SL_ENEMY1) lines[l].missile = 24;
      }
    }
    
    if (lines[l].flags & SL_TYPE) {
      display.drawBitmap(x, y, (dir < 0 ? sub_left : sub_right), 8, 8, WHITE);
    } else {
      display.drawBitmap(x, y, (dir < 0 ? fish_left : fish_right), 8, 8, WHITE);
    }

    if (torpedo_d != 0 && check_missile_collision(torpedo_x, torpedo_y, x, y)) {
      score_add += 10;
      torpedo_d = 0;
      lines[l].flags = lines[l].flags ^ (SL_ENEMY1 << i);
    }

    if (check_collision(x, y, player_x - 4, player_y - 4) && player_alive) {
      player_alive = false;
    }
  }

  if ((lines[l].flags & SL_MISSILE)) {
    x = lines[l].pos - 67 - 24*dir + lines[l].missile * dir;
    y = 15 + l*12 + 4;
    if (check_missile_collision(x, y, player_x - 5, player_y - 4)) {
      player_alive = false;
      lines[l].missile = 0;
      lines[l].flags ^= SL_MISSILE;
    } else {
      lines[l].missile += 1;
      display.drawLine(x - 2, y - 1, x + 1, y - 1, WHITE);
      display.drawLine(x - 1, y + 1, x + 2, y + 1, WHITE);
      if (x < 10 || x > 138) {
        lines[l].missile = 0;
        lines[l].flags ^= SL_MISSILE;
      }
    }
  }
  
  if (lines[l].flags & SL_MAN) {
    x = lines[l].pos - 68 + 12 * dir;
    y = 15 + l*12;
    display.drawBitmap(x, y, (dir < 0 ? man_left : man_right), 8, 8, WHITE);
    if (check_collision(x, y, player_x - 4, player_y - 4) && captured < 5 && player_alive) {
      captured++;
      score_add += 10;
      lines[l].flags = lines[l].flags ^ SL_MAN;
    }
  }

  //if ((lines[l].flags && 0x02)) // first enemy
}

function check_missile_collision( mx, my, x, y ) // boot
{
    x++; x++; y++; y++;
    return (mx >= x && mx < x+6 && my >= y && my < y + 6);
}

function check_collision( x1, y1, x2, y2 ) // bool
{
    x1++; x2++; y1++; y2++;
    var w = 6;
    var h = 6;

    return (x1 < x2 + w &&
            x1 + w > x2 &&
            y1 < y2 + h &&
            h + y1 > y2);
}

function draw_ui()
{
  var i;

  if (lives > 0 || player_alive) {
    // score and lives
    display.setCursor(0, 0);
    display.print("Score:" + score);
    for (i=0; i<lives; i++) {
      display.drawBitmap(128-8-i*10, 0, life, 8, 5, WHITE);
    }
  } else {
    // game title
    if (screen == SCR_ABOU) {
      display.setCursor(22 - (about_scroll > 1700 ? 0 : about_scroll), 0);
      display.print(F("SubmarineQuest      Arduino game by Petr Kratina <petr.kratina@gmail.com>      Heavily inspired by SeaQuest for Atari 2600      Game, it's sources (including graphics) and instruction how to assemble your own console are awailable at http://arduino.darkyork.com/submarine-quest/"));

      about_scroll++;
      if (about_scroll > 1800) {
        screen = SCR_MENU;
      }
    } else {
      display.setCursor(22, 0);
      display.print(F("SubmarineQuest"));
    }
  }

  if (lives > 0 || player_alive) {
    // oxygen indicator
    display.drawBitmap(0, 61, oxy, 11, 3, WHITE);
    for (i = 0; i < 8; i++) {
      display.drawBitmap(12 + i*8, 61, oxy_indicator, 8, 3, WHITE);
    }
    if (flash || oxygen > 255) display.fillRect(12, 61, Math.round(oxygen / 16), 3, WHITE);
  
    // captured indicator
    for (i = 0; i < 5; i++) {
      if (captured > i) {
        if (captured == 5 && flash) {
          display.drawRect(125 - i*4, 61, 3, 3, WHITE);
        } else {
          display.fillRect(125 - i*4, 61, 3, 3, WHITE);
        }
      } else {
        display.drawRect(125 - i*4, 61, 3, 3, WHITE);
      }
    }
  }
}

function draw_player()
{
  if (torpedo_d != 0) {
    display.drawLine(torpedo_x - 2, torpedo_y, torpedo_x + 2, torpedo_y, WHITE);
  }
  
  if (!player_alive) {
    display.drawBitmap(player_x - 5, player_y - 4, player_dead, 8, 16, WHITE);
    return;
  }
  if (player_d == 0) {
    display.drawBitmap(player_x - 5, player_y - 4, player_right, 11, 7, WHITE);
  } else {
    display.drawBitmap(player_x - 5, player_y - 4, player_left, 11, 7, WHITE);
  }
}
