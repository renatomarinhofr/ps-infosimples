const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://storage.googleapis.com/infosimples-output/commercia/case/product.html";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Título principal do produto
  const title = await page.evaluate(() => {
    return document.querySelector('h2#product_title').innerText;
  })

  // Nome da marca do produto
  const brand = await page.evaluate(() => {
    return document.querySelector('div.brand').innerText;
  })

  // Categorias do produto
  const categoriesList = await page.evaluate(() => {
    const nodeList = document.querySelectorAll('nav.current-category a');

    // transformar o nodeList em array
    const categoriesArray = [...nodeList];

    // transformar os nodes (elementos html) em objetos JS
    const categoriesList = categoriesArray.map(category => {
      return category.innerText;
    });

    return categoriesList;

  })

  // Texto que descreve o produto
  const description = await page.evaluate(() => {
    return document.querySelector('div.product-details p').innerText;
  })

  // Lista com detalhes de cada uma das variações do produto
  const skusList = await page.evaluate(() => {
    const nodeList = document.querySelectorAll('div.skus-area div [itemtype="http://schema.org/Product"]')

    // transformar o nodeList em array
    const skusArray = [...nodeList];

    // transformar os nodes (elementos html) em objetos JS
    const skusList = skusArray.map((sku) => {
      return {
        name: sku.querySelector('div.sku-name') ? sku.querySelector('div.sku-name').innerText : '',
        current_price: sku.querySelector('div.sku-current-price') ? parseFloat(sku.querySelector('div.sku-current-price').innerText.match(/\d+\.\d+/g)) : null,
        old_price: sku.querySelector('div.sku-old-price') ? parseFloat(sku.querySelector('div.sku-old-price').innerText.match(/\d+\.\d+/g)) : null,
        available: sku.querySelector('div i') ? false : true
      }
    })
    return skusList;
  })

  // Lista com as propriedades do produto
  const propertiesList = await page.evaluate(() => {
    const firstTable = document.querySelectorAll('body>div>section>div>div:nth-child(8)>table>tbody>tr');

    const secondTable = document.querySelectorAll('#additional-properties>table>tbody>tr');
    
    const propertiesArray = [...firstTable, ...secondTable];

    const propertiesList = propertiesArray.map((propertie) => {
      return {
        label: propertie.querySelector('td:nth-child(1)') ? propertie.querySelector('td:nth-child(1)').innerText : '',
        value: propertie.querySelector('td:nth-child(2)') ? propertie.querySelector('td:nth-child(2)').innerText : ''
        
      }
    })
    return propertiesList;
  });



  // Lista com as avaliações do produto.
  const reviews = await page.evaluate(() => {

    const reviewsList = document.querySelectorAll("div.review-box");

    const reviewArray = [...reviewsList]

    const reviews = reviewArray.map((revName) => {
      return {
        name: revName.querySelector('span.review-username').innerText,
        date: revName.querySelector('span.review-date').innerText,
        score: revName.querySelector('span.review-stars').innerText === "★☆☆☆☆" ? 1 : revName.querySelector('span.review-stars').innerText === "★★☆☆☆" ? 2 : revName.querySelector('span.review-stars').innerText === "★★★☆☆" ? 3 : revName.querySelector('span.review-stars').innerText === "★★★★☆" ? 4 : 5,
        text: revName.querySelector('p').innerText
      }
    })
    return reviews;
  });


  // Nota média das avaliações do produto
  const reviewsAverageScore = await page.evaluate(() => {
    const string = document.querySelector("div#comments h4").innerText;

    // Usando RegEx para pegar somente a média das avaliações
    const reviewsAverageScore = parseFloat(string.match(/[0-5][.][0-9]/g));

    return reviewsAverageScore;
  });


  // 
  const products = {
    title: title,
    brand: brand,
    categories: categoriesList,
    description: description,
    skus: skusList,
    properties: propertiesList,
    reviews: reviews,
    reviews_average_score: reviewsAverageScore,
    url: url
  }



  // Salva os dados em um arquivo JSON
  fs.writeFile('produtos.json', JSON.stringify(products, null, 2), err => {
    if (err) throw new Error("Erro ao salvar o arquivos")
    console.log("Arquivo salvo com sucesso");
  })



  await browser.close();
})();