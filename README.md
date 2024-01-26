# Fitbit-Annotator

Event Annotator for Fitbit Sense 2

Activity and emotional annotator for Fitbit devices.

Main application fill color will show toggleable activities; activities that have a known start and end time.

Secondary application fill color is set for buttons that log out time ambiguous states like emotions (e.g. to log out a moment when the user feels happy or sad).

![InterfaceDemonstration](./Documentation/images/InterfaceDemo.gif)

Currently supported screen sizes: Sense 2.

Progress:
- [x] Interface
  - [x] Buttons functionality
  - [x] Toggle buttons functionality
  - [x] i18n localization translations (en, es, jp)
  - [x] Event handling
- [ ] Activity logging
  - Heart-beat logging (or use intraday data from Web API)
  - [ ] Accelerometer / Gyroscope second resolution data
  - [ ] Activity annotation logging (actions of the buttons)
    - [ ] Corresponding instant data
  - [ ] Smartphone data export ("companion" code)
