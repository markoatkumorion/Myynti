# Myynti

Varastonhallintasovellus – selainpohjainen työkalu tuotteiden hallintaan.

## Vaatimukset

- [Node.js](https://nodejs.org/) 18 tai uudempi

## Asennus ja käynnistys

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Käynnistä palvelin
npm start
```

Avaa selaimessa: **http://localhost:3000**

## Ominaisuudet

- Selaa ja hae tuotteita nimellä tai kategorialla
- Lisää, muokkaa ja poista tuotteita
- Päivitä varastomäärä suoraan taulukosta
- Varaston tilastot (matala / kohtalainen / riittävä varasto, kokonaisarvo)
- Tietokanta alustetaan automaattisesti 20 esimerkkituotteella

## Kehitystila (automaattinen uudelleenkäynnistys)

```bash
npm run dev
```
