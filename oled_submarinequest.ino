#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <avr/pgmspace.h>
#include <avr/eeprom.h>

#include "joystick.cpp"

#define OLED_RESET 4
#define OLED_ADDR 0x3C
#define JOY_X_PIN  A1
#define JOY_Y_PIN  A0
#define JOY_BTN_PIN  2
#define JOY_DEADZONE 32

Adafruit_SSD1306 display(OLED_RESET);
Joystick joy;

#if (SSD1306_LCDHEIGHT != 64)
#error("Height incorrect, please fix Adafruit_SSD1306.h!");
#endif

/* GFX */
const unsigned char player_right [] PROGMEM = {
  0x02, 0x00, 0x06, 0x00, 0x06, 0x00, 0xBF, 0xC0, 0xFF, 0xE0, 0xFF, 0x20, 0xBF, 0xC0, 0x00, 0x00
};
const unsigned char player_left [] PROGMEM = {
  0x08, 0x00, 0x0C, 0x00, 0x0C, 0x00, 0x7F, 0xA0, 0xFF, 0xE0, 0x9F, 0xE0, 0x7F, 0xA0, 0x00, 0x00
};
const unsigned char life [] PROGMEM = {
  0x20, 0x30, 0x7D, 0xFF, 0x7D, 0x00, 0x00, 0x00, 
};
const unsigned char oxy [] PROGMEM = {
  0x4A, 0xA0, 0xA4, 0x40, 0x4A, 0x40, 
};
const unsigned char oxy_indicator [] PROGMEM = {
  0xAA, 0xAA, 0xAA, 
};
const unsigned char fish_left [] PROGMEM = {
  0x00, 0x00, 0x10, 0x3B, 0x5E, 0x3B, 0x00, 0x00, 
};
const unsigned char fish_right [] PROGMEM = {
  0x00, 0x00, 0x08, 0xDC, 0x7A, 0xDC, 0x00, 0x00, 
};
const unsigned char man_left [] PROGMEM = {
  0x00, 0x00, 0x20, 0x70, 0x1E, 0x08, 0x04, 0x00, 
};
const unsigned char man_right [] PROGMEM = {
  0x00, 0x00, 0x04, 0x0E, 0x78, 0x10, 0x20, 0x00, 
};
const unsigned char sub_left [] PROGMEM = {
  0x00, 0x20, 0x30, 0x7D, 0xFF, 0xBF, 0x7D, 0x00, 
};
const unsigned char sub_right [] PROGMEM = {
  0x00, 0x04, 0x0C, 0xBE, 0xFF, 0xFD, 0xBE, 0x00, 
};
const unsigned char player_dead [] PROGMEM = {
  0x08, 0x00, 0x50, 0x0A, 0x02, 0x6C, 0x48, 0x3C, 0x0C, 0x34, 0x7C, 0x74, 0x3C, 0x34, 0x34, 0x18
};

/* STUCTS */
#define SL_ACTIVE   B00000001
#define SL_ENEMY1   B00000010
#define SL_ENEMY2   B00000100
#define SL_ENEMY3   B00001000
#define SL_MAN      B00010000
#define SL_DIR      B00100000
#define SL_TYPE     B01000000
#define SL_MISSILE  B10000000
struct SUBLINE {
  byte flags; // flags 0x01=ACTIVE 0x02=1st enemy alive 0x04=2nd enemy alive 0x08=3rd enemy alive 0x10=has man 0x20=direction(left/right) 0x40=enemy type 0x80=missile fired
  byte count; // enemy count (max 3)
  byte pos; // position of enemies/man
  byte missile; // missile position
};

/* GLOBAL VARIABLES */
#define SCR_GAME 0x00
#define SCR_MENU 0x01
#define SCR_OVER 0x02
#define SCR_HISC 0x03
#define SCR_ABOU 0x04
int player_x = 63;
int player_y = 10;
byte player_d = 0;
unsigned int score = 0;
unsigned int score_high = 0;
unsigned int score_add = 0;
byte lives = 3;
unsigned int oxygen = 1;
byte captured = 0;
bool flash = false;
unsigned long flash_t = 0;
SUBLINE lines[4];
bool player_alive = true;
unsigned long line_timer = 0;
int torpedo_x = 0;
int torpedo_y = 0;
int torpedo_d = 0;
byte screen = SCR_MENU;
int menu_item = 0;
int joy_y = 0;
unsigned int about_scroll = 0;
byte patrol = 0;

void setup()
{
  while (!eeprom_is_ready());
  score_high = eeprom_read_word(0x0000);
  randomSeed(analogRead(A7));
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  display.display();
  joy.init(JOY_X_PIN, JOY_Y_PIN, JOY_BTN_PIN);
  joy.deadzone = JOY_DEADZONE;

  while (!get_joy_button()) {
    joy.update();
  }
  
  display.setTextColor(WHITE);
  //display.setTextColor(uint16_t color, uint16_t backgroundcolor);
  display.setTextSize(1);
  display.setTextWrap(false);
  display.clearDisplay();
  display.invertDisplay(0);

  lives = 0;
  player_alive = 0;
  player_y = 73;
  menu_item = 0;
  screen = SCR_MENU;
}

void loop()
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

void draw_about()
{
  joy.update();
  if (get_joy_button()) {
    screen = SCR_MENU;
    menu_item = 0;
  }
}

void draw_hiscore()
{
  int x = 24;
  int y = 19;

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
        eeprom_write_word(0x0000, score_high);
        menu_item = 1;
        break;
      case 1:
        menu_item = 0;
        screen = SCR_MENU;
        break;
    }
  }
}

void draw_gameover()
{
  int x = 24;
  int y = 19;

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

void draw_menu()
{
  int x = 24;
  int y = 19;

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

void reset_lines()
{
  byte i;
  for (i = 0; i < 4; i++) {
    lines[i].flags = 0x00;
  }
}

int get_joy_y()
{
  if (joy.y != 0) {
    joy_y = (joy.y > 0 ? 1 : -1);
  } else if(joy_y != 0) {
    int r = joy_y;
    joy_y = 0;
    return r;
  }
  return 0;
}

bool get_joy_button()
{
  if (joy.btn) {
    while (joy.btn) { joy.update(); }
    return true;
  }
  return false;
}

void update_game()
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
            eeprom_write_word(0x0000, score_high);
          }
          screen = SCR_OVER;
        }
        player_y = 71;
      }
    }
  }
}

void reset_game()
{
  patrol = 0;
  player_x = 63;
  player_y = 10;
  player_alive = true;
  oxygen = 1;
  captured = 0;
}

void draw_game()
{
  int i;
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

void draw_patrol()
{
  if (score < 1500 && screen != SCR_MENU) return;
  
  display.drawBitmap(192 - patrol, 5, sub_left, 8, 8, WHITE);
  if (192 - patrol > player_x - 5 && 192 - patrol < player_x + 5 && player_y == 10) {
    player_alive = false;
  }
  patrol++;
}

void start_line(byte l)
{
  int max_count = 2;
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

void draw_line(byte l)
{ // flags 0x01=ACTIVE 0x02=1st enemy alive 0x04=2nd enemy alive 0x08=3rd enemy alive 0x10=has man 0x20=direction(left/right) 0x40=enemy type 0x80=
  int i, x, y;
  if (!(lines[l].flags & SL_ACTIVE)) return;
  int dir = (lines[l].flags & SL_DIR ? -1 : 1);
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

bool check_missile_collision(int mx, int my, int x, int y)
{
  x++; x++; y++; y++;
  return (mx >= x && mx < x+6 && my >= y && my < y + 6);
}

bool check_collision(int x1, int y1, int x2, int y2)
{
  x1++; x2++; y1++; y2++;
  int w = 6;
  int h = 6;

  return (x1 < x2 + w &&
      x1 + w > x2 &&
      y1 < y2 + h &&
      h + y1 > y2);
}

void draw_ui()
{
  int i;

  if (lives > 0 || player_alive) {
    // score and lives
    display.setCursor(0, 0);
    display.print(String("Score:" + String(score, DEC)));
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
    if (flash || oxygen > 255) display.fillRect(12, 61, (oxygen / 16), 3, WHITE);
  
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

void draw_player()
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

