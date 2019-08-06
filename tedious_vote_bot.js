const puppeteer = require('puppeteer');
var formsSubmitted = 0
async function vote(page, elemId){
  await page.waitForSelector(elemId)
  await page.evaluate((elemId) =>{
    document.querySelector(elemId).click()
  }, elemId)
  await next(page)
}

async function next(page){
  await page.waitFor(1000);
  await page.evaluate(x =>{
    document.querySelector('#NextButton').click()
  })
}

function randomSelect(id, n){
  n=5
  var random = Math.floor(Math.random() * n)
  return id+'-'+random+'-label';
}


async function voteBotTedious(){
  const browser = await puppeteer.launch({
    // headless: false
  });
  try{
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.resourceType() === 'image')
        request.abort();
      else
        request.continue();
    });
    await page.goto('https://jagex.eu.qualtrics.com/jfe/form/SV_d3VpVeY8hV9uQOF', {waitUntil: 'networkidle0'});
    await page.waitForSelector('#NextButton')
    // await page.waitFor(2000);
    // console.log('page loaded')
    await page.evaluate(x =>{
      document.querySelector('#NextButton').click()
    })


    //I play old school runescape
    await vote(page, '#QID1-1-label')
    await next(page)

    //Vote for Tedious
    await vote(page, '#QID14-4-label')

    //Vote for Rendi
    await vote(page, '#QID23-1-label')

    //Vote for 18cb firecape
    await vote(page, '#QID27-3-label')
    next(page)

    //vote randoms
    await vote(page, randomSelect('#QID40'))
    await vote(page, randomSelect('#QID48'))
    next(page)

    await vote(page, randomSelect('#QID65'))
    await vote(page, randomSelect('#QID53'))
    await vote(page, randomSelect('#QID57'))

    formsSubmitted += 1
    console.log('Form', formsSubmitted, 'submitted at', new Date().toTimeString())

    await page.waitFor(1000)
  }
  catch(err){
    console.log('something broke, moving on')
    await browser.close();
  }
  await browser.close();
}

(async ()=>{
  while(1){
    await Promise.all([
      voteBotTedious(),
      voteBotTedious(),
      voteBotTedious()
    ]);
  }
})()