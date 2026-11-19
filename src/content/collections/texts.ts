/**
 * Default collection texts (EN + NL), shown under the designs on each
 * collection page and editable in Studio → Texts ("col-<slug>"). About the
 * designs themselves — what they are and what they're for.
 */
type Text = { title: string; body: string };

export const COLLECTION_TEXTS: Record<string, { en: Text; nl: Text }> = {
  "doll-mini": {
    en: {
      title: "Doll & Mini",
      body: `Furniture and accessories for fashion dolls like Barbie, in 1:6 scale. Beds, chairs, tables, display stands and little extras to make a doll's room complete — playful designs where looking good and being fun to play with matter more than being an exact copy of real furniture. Some pieces are a little bigger or chunkier than "real" scale on purpose, so they're sturdy and easy for small hands.

Looking for dollhouse miniatures? Designs that also work in 1:12 are marked with that scale — use the 1:12 filter above to see them.

Print them in the colours you like, mix and match, and build a whole room. Missing a piece of furniture? Put it on the wish list.`,
    },
    nl: {
      title: "Poppen & Mini",
      body: `Meubels en accessoires voor modepoppen zoals Barbie, op schaal 1:6. Bedden, stoelen, tafels, standaarden en kleine extra's om een poppenkamer compleet te maken — speelse ontwerpen waarbij mooi en leuk om mee te spelen belangrijker is dan een precieze kopie van echte meubels. Sommige stukken zijn met opzet iets groter of steviger dan "echte" schaal, zodat ze stevig zijn en makkelijk voor kleine handjes.

Op zoek naar poppenhuisminiaturen? Ontwerpen die ook in 1:12 werken, hebben die schaal erbij — gebruik het filter 1:12 hierboven om ze te zien.

Print ze in de kleuren die jij mooi vindt, combineer ze en bouw een hele kamer. Mis je een meubel? Zet het op het wensenlijstje.`,
    },
  },
  "home-living": {
    en: {
      title: "Home & Living",
      body: `Decoration and handy things for around the house: vases, lamps and lampshades, holders, hooks and small objects that make a room a bit nicer or a bit more practical.

Most designs are made to be printed in one colour, so you can match them to your interior — print a white vase for a calm room or a bright one as an eye-catcher. The product pages show the size, so you know how it fits on your shelf or table.`,
    },
    nl: {
      title: "Wonen",
      body: `Decoratie en handige dingen voor in huis: vazen, lampen en lampenkappen, houders, haakjes en kleine objecten die een kamer net wat mooier of praktischer maken.

De meeste ontwerpen zijn bedoeld om in één kleur te printen, zodat je ze bij je interieur kunt laten passen — een witte vaas voor een rustige kamer of een felle als blikvanger. Op de productpagina's staan de afmetingen, zodat je weet hoe het op je plank of tafel past.`,
    },
  },
  "ikea-hacks": {
    en: {
      title: "IKEA Hacks",
      body: `Smart accessories that make IKEA furniture and products work better: holders, inserts, sliders and clips made to fit pieces like KALLAX, TROFAST, SKÅDIS and APTITLIG. Each design lists exactly which IKEA product it fits ("Fits"), so you know it works before you print.

They solve the small annoyances — cutting boards falling over, boxes sliding out, things without a place — without drilling or changing the furniture itself.`,
    },
    nl: {
      title: "IKEA Hacks",
      body: `Slimme accessoires waarmee IKEA-meubels en -producten beter werken: houders, inzetstukken, sliders en clips die passen op onder andere KALLAX, TROFAST, SKÅDIS en APTITLIG. Bij elk ontwerp staat precies op welk IKEA-product het past ("Past op"), zodat je zeker weet dat het werkt voordat je print.

Ze lossen de kleine ergernissen op — snijplanken die omvallen, bakken die eruit schuiven, spullen zonder vaste plek — zonder te boren of het meubel zelf aan te passen.`,
    },
  },
  organize: {
    en: {
      title: "Organize",
      body: `Storage and organising for the kitchen, desk and cupboard: holders for coffee cups and capsules, bins, trays, dividers and stands that give everything a fixed place.

Many of these are made for a specific product (a coffee machine, a capsule type, a drawer size) — the product page says what it fits. Handy, tidy, and easy to print another one when you need more.`,
    },
    nl: {
      title: "Opbergen",
      body: `Opbergen en organiseren voor keuken, bureau en kast: houders voor koffiebekers en capsules, bakjes, trays, verdelers en standaards die alles een vaste plek geven.

Veel ervan zijn gemaakt voor een bepaald product (een koffiemachine, een soort capsule, een la-maat) — op de productpagina staat waar het op past. Handig, opgeruimd, en makkelijk een extra te printen als je er meer nodig hebt.`,
    },
  },
  "tech-electronics": {
    en: {
      title: "Tech & Electronics",
      body: `Cases, holders and parts for gadgets and do-it-yourself electronics: enclosures for small boards and sensors, stands, cable holders and mounts.

Designs that need extra parts — screws, magnets or electronic components — list exactly what you need under "Extra parts you need", with links where useful, so you can order everything in one go.`,
    },
    nl: {
      title: "Tech & Elektronica",
      body: `Behuizingen, houders en onderdelen voor gadgets en zelfbouw-elektronica: kastjes voor kleine printplaten en sensoren, standaards, kabelhouders en bevestigingen.

Bij ontwerpen die extra onderdelen nodig hebben — schroeven, magneten of elektronische componenten — staat precies wat je nodig hebt onder "Extra onderdelen die je nodig hebt", waar handig met een link, zodat je alles in één keer kunt bestellen.`,
    },
  },
  games: {
    en: {
      title: "Games",
      body: `Board game inserts, playing pieces, card holders and accessories that make game night more fun and set-up faster. Inserts keep every piece in its own place in the box; extra pieces and holders make playing easier.

Each insert lists which game and edition it fits. Missing your favourite game? Put it on the wish list.`,
    },
    nl: {
      title: "Spellen",
      body: `Inzetstukken voor bordspellen, speelstukken, kaarthouders en accessoires die een spelavond leuker maken en het opzetten sneller. Inzetstukken geven elk onderdeel een eigen plek in de doos; extra stukken en houders maken het spelen makkelijker.

Bij elk inzetstuk staat voor welk spel en welke editie het is. Mis je je favoriete spel? Zet het op het wensenlijstje.`,
    },
  },
  kids: {
    en: {
      title: "Kids",
      body: `Toys and fun prints for children: little figures, puzzles, things to play with and things to make their room nicer.

Printed toys aren't certified toys and some contain small parts — check the design and keep small pieces away from young children.`,
    },
    nl: {
      title: "Kinderen",
      body: `Speelgoed en leuke prints voor kinderen: figuurtjes, puzzels, dingen om mee te spelen en om hun kamer gezelliger te maken.

Geprint speelgoed is geen gecertificeerd speelgoed en sommige ontwerpen hebben kleine onderdelen — kijk het ontwerp goed na en houd kleine stukjes uit de buurt van jonge kinderen.`,
    },
  },
  other: {
    en: {
      title: "Other",
      body: `Designs that don't fit any of the other collections (yet): handy one-offs, experiments and things that are simply fun to print.`,
    },
    nl: {
      title: "Overig",
      body: `Ontwerpen die (nog) in geen van de andere collecties passen: handige losse dingen, experimenten en dingen die gewoon leuk zijn om te printen.`,
    },
  },
  "serious-games": {
    en: {
      title: "Serious Games",
      body: `Game pieces, boards and components for educational and professional games: for trainers, teachers, game designers and studios who make games that teach or help people practise.

Every design comes with a business license, so you can use it in games for your own organisation or your clients. Need something specific? Custom designs are possible — mail us.`,
    },
    nl: {
      title: "Serious Games",
      body: `Speelstukken, borden en onderdelen voor educatieve en professionele spellen: voor trainers, docenten, spelontwerpers en studio's die spellen maken om iets te leren of te oefenen.

Bij elk ontwerp hoort een zakelijke licentie, zodat je het kunt gebruiken in spellen voor je eigen organisatie of je klanten. Iets specifieks nodig? Ontwerpen op maat kan — mail ons.`,
    },
  },
};
