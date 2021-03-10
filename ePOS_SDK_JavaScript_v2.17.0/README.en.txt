=========================================================================
          Epson ePOS SDK for JavaScript Version 2.17.0

          Copyright Seiko Epson Corporation 2016 - 2020 All rights reserved.
=========================================================================

1. About this software

The Epson ePOS SDK for JavaScript is an SDK aimed at development engineers 
who are developing Web applications for printing on an EPSON TM 
printer and an EPSON TM Intelligent printer.
Applications are developed using the APIs provided by Epson ePOS SDK.
For detailed information, please see Epson ePOS SDK for JavaScript User's 
Manual.

Supported Web Browsers
  Windows Internet Explorer 8 - 11
  Microsoft Edge 25 - 44
  Mozilla Firefox 12.0 - 66
  Google Chrome 21 - 78
  Safari 4 - 12
  Safari in iOS 5 - 12

Supported TM Printers
  For detailed information, please see Epson ePOS SDK for JavaScript User's 
  Manual.

Supported Interfaces
  TM Printer
    Wired LAN
    Wireless LAN
  TM Intelligent Printer
    Wired LAN
  Network Printer
    Wired LAN
    Wireless LAN

2. Supplied Files

- epos-2.17.0.js
  A library for function execution

- ePOS_SDK_Sample_JavaScript.zip
  Sample scripts

- DeviceControlScript_Sample.zip
  This file contains sample device control script programs

- DeviceControlProgram_Sample.zip
  This file contains sample device control programs

- EULA.en.txt
  Contains the SOFTWARE LICENSE AGREEMENT

- EULA.ja.txt
  Contains the SOFTWARE LICENSE AGREEMENT (The Japanese edition)

- ePOS_SDK_JavaScript_um_en_revx.pdf
  An user's manual

- ePOS_SDK_JavaScript_um_ja_revx.pdf
  An user's manual (The Japanese edition)

- ePOS_SDK_JavaScript_Migration_Guide_en_revx.pdf
  A migration guide

- ePOS_SDK_JavaScript_Migration_Guide_ja_revx.pdf
  A migration guide (The Japanese edition)

- TM-DT_Peripherals_en_revx.pdf
  This is the TM-DT Series Peripheral Device Control Guide

- TM-DT_Peripherals_ja_revx.pdf
  This is the TM-DT Series Peripheral Device Control Guide (The Japanese edition)

- README.en.txt
  This file

- README.ja.txt
  The Japanese edition of this file

- OPOS_CCOs_1.14.001.msi
  This is the OPOS CCO installer package

3. Remarks
- Returns RequestEntityTooLarge if the print data at a time is sent over
  the allowable amount of the printer firmware.

- Returns TooManyRequests if the number of print jobs or data to be displayed
  on a display has exceeded the allowable limit of the printer's firmware.

- For detailed information, please see Epson ePOS SDK for JavaScript User's
  Manual.

4. Restriction


5. Version History
  Version 2.17.0
    - Added customer display support
      - DM-D70

  Version 2.16.0
    - Added TM printer support
      - TM-m30II-S
      - TM-m30II-NT
      - TM-m50
    - Added new functions
      - Added "CODE128 auto" parameter on addBarcode method. 

  Version 2.14.0
    - Added TM printer support
      - TM-m30II
      - TM-m30II-H
    - Added new functions
      - Batch rotate printing
      - UTF-8 printing

  Version 2.13.0
    - Added Web Browser version support
      - Google Chrome 75 - 78
    - Added new function
      - GermanyFiscalElement class

  Version 2.12.0
    - Added Web Browser version support
      - Microsoft Edge 39 - 44
      - Mozilla Firefox 50 - 66
      - Google Chrome 54 - 74
      - Safari 11 - 12
      - Safari in iOS 11 - 12
    - Added TM printer support
      - TM-T20III
      - TM-T82III
    - Barcode scanner can now be connected to TM-T88VI.
    - Connect API can be used for multiple devices form one application.

  Version 2.9.0a
    - The library is the same as Ver.2.9.0.
    - Added TM printer support
      - TM-T70II-DT2
      - TM-T88VI-DT2

  Version 2.9.0
    - Barcode scanner can now be connected to TM-m30.
    - The disconnection detection time can be set on the TM-DT side.
    - Bug fix
      - We added the following files missing from package.
        - DeviceControlProgram_Sample.zip
        - TM-DT_Peripherals_ja_revx.pdf
        - TM-DT_Peripherals_en_revx.pdf
        - OPOS_CCOs_1.14.001.msi

  Version 2.7.0
    - Added TM printer support
      - TM-H6000V
    - Added support device
      - DM-D210
    - Added devices class support
      - HybridPrinter2 class
    - Bug fix
      - Fix the phenomenon MICR can not eject in HybridPrinter sample.

  Version 2.6.0
    - Added TM printer support
      - TM-T88VI Japanese model
    - Added peripheral devices support
      - POSKeyboard class 
      - OtherPeripheral class 
    - Added DirectIO command transmission to sendCommand API in CashChanger class.
    - Added the following to the package
      - Sample of device control programs
      - TM-DT Series Peripheral Device Control Guide
      - OPOS CCO installer package
    - Bug fix
      - Fix the phenomenon in which the onstatuschange event is notified after
        the printer is disconnected.

  Version 2.3.0c
    - Corrected the mistake of user's manual (The Japanese-language edition).

  Version 2.3.0b
    - Added TM printer support
      - TM-P80 Japanese model

  Version 2.3.0a
    - Added Web Browser version support
      - Microsoft Edge 26 - 38
      - Mozilla Firefox 44 - 49
      - Google Chrome 48 - 53
      - Safari 10
      - Safari in iOS 10
    - Added multi-lingual keyboard support
    - Added TM printer support
      - TM-T88VI-iHUB

  Version 2.3.0
    - Added TM printer support
      - TM-m30 Korean model
    - Bug fix
      - Fix the phenomenon that the callback function sometimes has not been called
        after call the connect API function.
      - Fix the phenomenon that unnecessary ondisconnect event may occurred
        when call the connect API function.

  Version 2.1.0
    - Added TM printer support
      - TM-T88VI

  Version 2.0.0
    - New release.

