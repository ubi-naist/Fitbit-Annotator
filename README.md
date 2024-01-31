# Fitbit-Annotator

Event Annotator for Fitbit Sense 2 and Versa 4.

***SDK-toolchain(7.2.0) and SDK-cli(1.8.0) master versions are now compatible with Versa 4 and Sense 2 devices.***

Activity and emotional annotator for Fitbit devices.

The main application fill color is used to show toggleable activities, i.e. activities that have a known start and end time.

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

## Icons

The icons are grayscale versions from the 128x128 png drawings of [Google's Open Source "Noto Emoji" font](https://github.com/googlefonts/noto-emoji).

If you want to create new buttons using Noto Emoji emoticons, you must convert the original PNG icons to 8-bit grayscale png images. This will allow the transparency/colorizing functionality shown in the app.

Using the imagemagick library and terminal application `convert` you can easily convert them with the following command:

```bash
    # To convert only one image
    convert original.png -colorspace gray -resize 72 new.png

    # To convert all images in one directory
    mkdir 72px  # creating output directory
    find . -iname '*.png' -exec bash -c 'convert "{}" -colorspace gray -resize 72 "./72px/{}"' \;  # find all png images and executing convert on each of them
```

## Contact

Inquiries: sergio.de.leon@ ubilab's domain .com
