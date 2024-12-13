import { IMEManager } from './entry-ime';

document.addEventListener('DOMContentLoaded', () => {
  IMEManager.resetInstance();
  const manager = IMEManager.getInstance();
    
  // チェックボックスの変更を監視
  ['hentaigana', 'siddham', 'itaiji', 'buddha_name'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const options = {
        enabledTypes: {
          hentaigana: (document.getElementById('hentaigana') as HTMLInputElement)?.checked ?? false,
          siddham: (document.getElementById('siddham') as HTMLInputElement)?.checked ?? false,
          itaiji: (document.getElementById('itaiji') as HTMLInputElement)?.checked ?? false,
          buddha_name: (document.getElementById('buddha_name') as HTMLInputElement)?.checked ?? false
        }
      };
      // チェックボックス変更時にIMEManagerのupdateOptionsを呼び出す
      manager.updateOptions(options);
    });
  });
  
  // IMEを有効化する要素の設定
  document.querySelectorAll('.ime-enabled').forEach(element => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.addEventListener('focus', () => {
        const options = {
          enabledTypes: {
            hentaigana: (document.getElementById('hentaigana') as HTMLInputElement)?.checked ?? false,
            siddham: (document.getElementById('siddham') as HTMLInputElement)?.checked ?? false,
            itaiji: (document.getElementById('itaiji') as HTMLInputElement)?.checked ?? false,
            buddha_name: (document.getElementById('buddha_name') as HTMLInputElement)?.checked ?? false
          }
        };
        manager.attach(element, { options });
      });
    }
  });
});