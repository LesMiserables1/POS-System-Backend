=========================================================================
          Epson ePOS SDK for JavaScript Version 2.17.0

          Copyright Seiko Epson Corporation 2016 - 2020 All rights reserved.
=========================================================================

1.本ソフトウェアについて

Epson ePOS SDK for JavaScript は、EPSON TMプリンターおよびEPSON 
TMインテリジェントプリンターに印刷するためのWebアプリケーションを
開発する開発者向けSDKです。
Epson ePOS SDK で提供するAPIを使用してアプリケーションを開発します。
詳細は Epson ePOS SDK for JavaScript ユーザーズマニュアル を参照ください。

対応Webブラウザーバージョン
  Windows Internet Explorer 8 - 11
  Microsoft Edge 25 - 44
  Mozilla Firefox 12.0 - 66
  Google Chrome 21 - 78
  Safari 4 - 12
  Safari iOS向け 5 - 12

サポートTMプリンター
  詳細は Epson ePOS SDK for JavaScript ユーザーズマニュアル を参照ください。

サポートインターフェイス
  TMプリンター
    有線LAN
    無線LAN
  TMインテリジェントプリンター
    有線LAN
  ネットワークプリンター
    有線LAN
    無線LAN

2.提供ファイル

・epos-2.17.0.js
  機能実行用ライブラリーです。

・ePOS_SDK_Sample_JavaScript.zip
  サンプルプログラムファイルです。

・DeviceControlScript_Sample.zip
  デバイス制御スクリプト用のサンプルプログラムファイルです。

・DeviceControlProgram_Sample.zip
  デバイス制御プログラム用のサンプルプログラムファイルです。

・EULA.ja.txt
  SOFTWARE LICENSE AGREEMENT が記載されています。

・EULA.en.txt
  SOFTWARE LICENSE AGREEMENT（英語版）が記載されています。

・ePOS_SDK_JavaScript_um_ja_revx.pdf
  ユーザーズマニュアルです。

・ePOS_SDK_JavaScript_um_en_revx.pdf
  ユーザーズマニュアル（英語版）です。

・ePOS_SDK_JavaScript_Migration_Guide_ja_revx.pdf
  マイグレーションガイドです。

・ePOS_SDK_JavaScript_Migration_Guide_en_revx.pdf
  マイグレーションガイド（英語版）です。

・TM-DT_Peripherals_ja_revx.pdf
  TM-DT シリーズ周辺機器制御ガイドです。

・TM-DT_Peripherals_en_revx.pdf
  TM-DT シリーズ周辺機器制御ガイド（英語版）です。

・README.ja.txt
  本書です。

・README.en.txt
  本書（英語版）です。

・OPOS_CCOs_1.14.001.msi
  OPOS CCO インストーラーパッケージです。

3.その他留意点
・1回あたりの印刷データもしくはディスプレイ表示データが許容量を超えて送信された場合に
  RequestEntityTooLargeを返します。

・印刷データもしくはディスプレイ表示データがプリンターファームウェアの許容量を超えて送信された場合に
  TooManyRequestsを返します。

・使用方法、使用上の注意、等の詳細は、ユーザーズマニュアルを参照し、
  ご使用ください。
  
4.制限事項


5.バージョン履歴
  Version 2.17.0
    ・サポートカスタマーディスプレイを追加
      ・DM-D70
    ・新機能追加
      ・CATクラスにAPIを追加

  Version 2.16.0
    ・サポートTMプリンターを追加
      ・TM-m30II-S
      ・TM-m30II-NT(海外モデルのみ)
      ・TM-m50(海外モデルのみ)
    ・新機能追加
      ・addBarcode メソッドにCODE128 autoパラメータを追加

  Version 2.14.0
    ・サポートTMプリンターを追加
      ・TM-m30II
      ・TM-m30II-H
    ・新機能追加
      ・まとめ反転印刷に対応
      ・UTF-8の印刷に対応

  Version 2.13.0
    ・対応ブラウザーバージョンを更新
      ・Google Chrome 75 - 78

  Version 2.12.0
    ・対応ブラウザーバージョンを更新
      ・Microsoft Edge 39 - 44
      ・Mozilla Firefox 50 - 66
      ・Google Chrome 54 - 74
      ・Safari 11 - 12
      ・Safari iOS向け 11 - 12
    ・サポートＴＭプリンターを追加
      ・TM-T20III
      ・TM-T82III
    ・TM-T88VIにバーコードスキャナが接続できるようになりました。
    ・同一アプリケーションから複数の機器に接続できるようになりました。

  Version 2.9.0a
    ・ライブラリはVer.2.9.0と同一です。
    ・サポートTMプリンターを追加
      ・TM-T70II-DT2
      ・TM-T88VI-DT2

  Version 2.9.0
    ・TM-m30にバーコードスキャナが接続できるようになりました。
    ・CATクラスにおける変更点
      ・API追加
        ・sendCommand：任意DirectIOコマンド送信
      ・イベント追加
        ・oncommandreply：DirectIOコマンドの実行結果受信
        ・onstatusupdate：OPOSの StatusUpdateEventを通知
      ・ステータス追加
        ・OPOS_CODE_XX：OPOS拡張エラー
    ・切断検知時間をTM-DT側で設定できるようにしました。

  Version 2.7.0
    ・サポートTMプリンターを追加
      ・TM-H6000V（海外モデルのみ）

  Version 2.6.0
    ・サポートTMプリンターを追加
      ・TM-T88VI
    ・サポート周辺機器を追加
      ・POSKeyboardクラス
      ・CATクラス
      ・OtherPeripheralクラス
    ・CashChangerクラスのsendCommand APIに、DirectIOコマンドを送信する機能を追加
    ・CashChangerクラスのdispenseChange APIとdispenseCash APIの仕様を変更
      ・dispenseChange：金種指定→金額指定で出金
      ・dispenseCash：金額指定→金種指定で出金
    ・デバイス制御スクリプト使用時、CashChangerクラスのoncashcountイベントで回収部の紙幣枚数を返すようにしました
    ・パッケージに以下を追加
      ・デバイス制御プログラム用のサンプルプログラム
      ・TM-DT シリーズ周辺機器制御ガイド
      ・OPOS CCO インストーラーパッケージ
    ・不具合修正
     ・プリンター切断後、onstatuschange イベントが通知される現象を修正

  Version 2.3.0c
    ・ユーザーズマニュアルの誤記を修正しました

  Version 2.3.0b
    ・サポートTMプリンターを追加
      ・TM-P80

  Version 2.3.0a
    ・対応ブラウザーバージョンを追加
      ・Microsoft Edge 26 - 38
      ・Mozilla Firefox 44 - 49
      ・Google Chrome 48 - 53
      ・Safari 10
      ・Safari iOS向け 10
    ・サポートTMプリンターを追加
      ・TM-T88VI-iHUB（海外モデルのみ）

  Version 2.3.0
    ・不具合修正
      ・connect API実行時、Callback 関数が呼ばれないことがある現象を修正
      ・connect API実行直後、不要な ondisconnect イベントが通知されることがある
        現象を修正

  Version 2.1.0
    ・サポートTMプリンターを追加
      ・TM-T88VI（海外モデルのみ）

  Version 2.0.0
    ・新規リリース

