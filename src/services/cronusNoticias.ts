import { AppDataSource } from '../data-source';
import { NoticiaRep } from '../repository/NoticiaRep';
import puppeteer from 'puppeteer';

const BASE_URL = 'https://pmp.pr.gov.br/website/views/';

async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Tentativa ${i + 1} falhou. Retentando em ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

export async function cronusNoticias() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Carrega página principal com retry
    await retry(async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.col');
    });

    const noticias = await page.evaluate((BASE_URL) => {
      const results: { title: string; linking: string }[] = [];
      const elements = document.querySelectorAll('.col');

      elements.forEach(el => {
        const titleEl = el.querySelector('.card-title, h5');
        const linkEl = el.querySelector('a');

        const title = titleEl ? titleEl.textContent?.trim() : '';
        let linking = linkEl ? (linkEl as HTMLAnchorElement).href : '';

        if (linking && !linking.startsWith('http')) {
          linking = BASE_URL + linking;
        }

        if (
          title &&
          linking &&
          !['Daniel Langaro', 'Edson Lagarto'].includes(title)
        ) {
          results.push({ title, linking });
        }
      });

      return results;
    }, BASE_URL);

    for (const noticia of noticias) {
      try {
        const exists = await NoticiaRep.findOneBy({ title: noticia.title });
        if (exists) continue;

        const seqResult = await AppDataSource.query(`SELECT SEQ_NOTICIA.NEXTVAL AS SEQ FROM DUAL`);
        const nextSeq = seqResult[0].SEQ;

        const detailPage = await browser.newPage();

        await retry(async () => {
          await detailPage.goto(noticia.linking, { waitUntil: 'networkidle2' });
          await detailPage.waitForSelector('.post-content');
        });

        const { thumbnail, description } = await detailPage.evaluate((BASE_URL) => {
          const imgEl = document.querySelector('img.img-responsive.card-img-top');
          let rawThumbnail = imgEl ? imgEl.getAttribute('src') || '' : '';
          if (rawThumbnail && !rawThumbnail.startsWith('http')) {
            rawThumbnail = BASE_URL + rawThumbnail;
          }

          const descEl = document.querySelector('.post-content');
          const description = descEl ? descEl.textContent?.replace(/\s+/g, ' ').trim() : '';          

          return { thumbnail: rawThumbnail, description };
        }, BASE_URL);

        await detailPage.close();        

        const novaNoticia = NoticiaRep.create({
          seq: nextSeq,
          cidadeId: 1,
          thumbnail,
          description,
          title: noticia.title,
          linking: noticia.linking,
          publish: new Date(),
        });

        await NoticiaRep.save(novaNoticia);
      } catch (err) {
        console.error(`Radar save failed: ${noticia.title}`);
      }
    }
  } catch (error) {
    console.error(`Radar sync failed: ${error}`);
  } finally {
    if (browser) await browser.close();
  }
}