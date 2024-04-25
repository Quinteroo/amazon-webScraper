// LIBRERÍAS
const puppeteer = require("puppeteer")
const mongoose = require("mongoose")
require('dotenv').config();


// MODELO DE DATO QUE VAMOS A RECOGER
const data = mongoose.model('data', new mongoose.Schema({
  title: String,
  price: String
}))


// CONEXIÓN CON BBDD
const connectDB = async () => {

  const URI = process.env.URI

  if (!URI) {
    throw new Error("❌ URI no encontrada en las variables de entorno");
  }

  try {
    await mongoose.connect(URI.toString(), { useNewUrlParser: true, useUnifiedTopology: true })
    console.log("✅ Conectado a la BBDD");
  } catch (error) {
    console.log("❌ No conectado a DDBB");
    console.log(error);
  }
}




// DEFINIMOS EL SCRAPER (automatizamos el proceso de búsqueda, selección y recopilación de datos)
const scraperProducts = async () => {
  connectDB()

  const URL = "https://www.amazon.es/"                         // 1 indicamos la url que queremos visitar

  const browser = await puppeteer.launch({                     // 2 creamos el navegador (Chromium por defecto)
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })

  const page = await browser.newPage()                         // 3 abrimos una página del navegador

  await page.goto(URL)                                         // 4 indicamos la url que queremos visitar

  await page.type("#twotabsearchtextbox", "star wars")         // 5 seleccionamos la barra buscadora y que queremos buscar

  await page.click("#nav-search-submit-button")                // 6 click en el botón de buscar

  await page.waitForSelector('.s-pagination-next')             // 7 esperar hasta que se cargue la página completamente

  const title = await page.$$eval('h2 span.a-color-base', (nodes) => nodes.map((n) => n.innerText))
  //                                                                8 extraemos los títulos de los productos
  const price = await page.$$eval('span.a-price[data-a-color="base"] span.a-offscreen', (nodes) => nodes.map((n) => n.innerText))
  //                                                                9 extraemos los precios

  const amazonProduct = title.slice(0, 10).map((v, i) => {      // 10 creamos el objeto del producto extraído del array
    return {
      title: title[i],
      price: price[i]
    }
  })


  amazonProduct.map(async (product) => {
    try {
      await data.create(product); // Utiliza el método create para guardar los datos en la base de datos
      console.log(`✅ Guardado correctamente ${product.title} en la BBDD`);
    } catch (error) {
      console.log(`❌ Error al guardar ${product.title} en la BBDD`);
      console.log(error);
    }
  })

  await browser.close()                                        //* pedimos que cierre el navegador una vez raspada la web
}



scraperProducts()