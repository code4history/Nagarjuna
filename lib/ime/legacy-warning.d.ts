/**
 * legacy IME（IMEManager / <ime-ui>）の実行時非推奨警告。
 *
 * 形式（oct26-m7-t1 設計 §3.2-6。ファミリーの前例として固定）:
 *   関数名は warn<対象>Once()、メッセージは
 *   `[<package名>] DEPRECATED: <対象> is deprecated since <minor版> and will be removed in <削除予定Major>. Use <代替> instead.`
 *
 * モジュール内の boolean で、同一 process（同一モジュールインスタンス）につき 1 回だけ出す。
 * 1.1.0 では抑止オプションを設けない（追加すると 3.0.0 で削除する API が増えるため）。
 * NagaIME はこの関数を呼ばない。
 */
export declare const LEGACY_IME_DEPRECATION_MESSAGE = "[nagarjuna] DEPRECATED: IMEManager and <ime-ui> are deprecated since 1.1.0 and will be removed in 3.0.0. Use NagaIME instead.";
export declare function warnLegacyIMEOnce(): void;
