#ifndef JOYSTICKCPP
#define JOYSTICKCPP

#include <Arduino.h>

// default pins
#ifndef JOY_PIN_X
#define JOY_PIN_X  A0
#endif 

#ifndef JOY_PIN_Y
#define JOY_PIN_Y  A1
#endif 

#ifndef JOY_PIN_BTN
#define JOY_PIN_BTN  2
#endif 

class Joystick
{
  public:

    byte pin_x = A0;
    byte pin_y = A1;
    byte pin_btn = 2;
    byte sensitivity = 8;
    unsigned int deadzone = 10;
    int x = 0;
    int y = 0;
    bool btn = false;

    void init(byte px, byte py, byte pb)
    {
      pin_x = px;
      pin_y = py;
      pin_btn = pb;
      pinMode(pin_x, INPUT);
      pinMode(pin_y, INPUT);
      pinMode(pin_btn, INPUT_PULLUP);
    }

    void update() {
      x = (analogRead(pin_x) - 512) / sensitivity;
      y = (analogRead(pin_y) - 512) / sensitivity;
      if ( (x > 0 && x < deadzone) || (x < 0 && x > -deadzone) ) x = 0;
      if ( (y > 0 && y < deadzone) || (y < 0 && y > -deadzone) ) y = 0;
      btn = (digitalRead(pin_btn) == LOW);
    }
};

#endif 
