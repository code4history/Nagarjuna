import hentaiganaWoff2 from '../../../assets/fonts/ninjal_hentaigana.woff2';
import hentaiganaWoff from '../../../assets/fonts/ninjal_hentaigana.woff';

export const fontStyles = {
  hentaigana: `
    @font-face {
      font-family: 'NINJAL Hentaigana';
      src: url('${hentaiganaWoff2}') format('woff2'),
           url('${hentaiganaWoff}') format('woff');
      font-display: swap;
    }
  `,
};

export const fontFamilies = {
  hentaigana: 'NINJAL Hentaigana',
  siddham: 'Noto Sans Siddham',
  itaiji: 'Noto Sans JP'
};