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
        current_price: sku.querySelector('div.sku-current-price') ? Number(sku.querySelector('div.sku-current-price').innerText.match(/[0-9]{2}[.][0-9]{2}/g)) : null,
        old_price: sku.querySelector('div.sku-old-price') ? Number(sku.querySelector('div.sku-old-price').innerText.match(/[0-9]{2}[.][0-9]{2}/g)) : null,
        available: sku.querySelector('div i') ? sku.querySelector('div i').innerText : null,
      }
    })
    return skusList;
  })

  // Lista com as propriedades do produto
  const propertiesList = await page.evaluate(() => {
    const nodeList = document.querySelectorAll('table.pure-table.pure-table-bordered');

    const propertiesArray = [...nodeList];

    const propertiesList = propertiesArray.map((propertie) => {
      return {
        label: propertie.querySelector('tr td b').innerText,
        value: propertie.querySelector('tr td').innerText
      }
    })
    return propertiesList;
  });

  console.log(propertiesList);



  // Lista com as avaliações do produto.
  const reviews = await page.evaluate(() => {

    const reviewsList = document.querySelectorAll("div.review-box");

    const reviewArray = [...reviewsList]

    const reviewsName = reviewArray.map((revName) => {
      return {
        name: revName.querySelector('span.review-username').innerText,
        date: revName.querySelector('span.review-date').innerText,
        score: revName.querySelector('span.review-stars').innerText,
        text: revName.querySelector('p').innerText
      }
    })
    return reviewsName;
  });


  // Nota média das avaliações do produto
  const reviewsAverageScore = await page.evaluate(() => {
    const string = document.querySelector("div#comments h4").innerText;

    // Usando RegEx para pegar somente a média das avaliações
    const reviewsAverageScore = parseFloat(string.match(/[0-5][.][0-9]/g));

    return reviewsAverageScore;
  });


  // 
  const products = [{
      'title': title
    }, {
      'brand': brand
    }, {
      'categories': categoriesList
    }, {
      'description': description
    }, {
      'skus': skusList
    }, {
      'reviews': reviews
    }, {
      'reviews_average_score': reviewsAverageScore
    }, {
      'url': url
    }

  ];



  // Salva os dados em um arquivo JSON
  fs.writeFile('produtos.json', JSON.stringify(products, null, 2), err => {
    if (err) throw new Error("Erro ao salvar o arquivos")
    console.log("Arquivo salvo com sucesso");
  })



  await browser.close();
})();