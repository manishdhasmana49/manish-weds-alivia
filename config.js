/* ==========================================================================
   WEDDING CONFIG: edit everything here. You never need to touch the code.

   - Search this file for TODO to find every detail still missing.
   - A value that starts with "TODO" is never shown to guests. They see a
     friendly "to be announced" instead, or the item is hidden.
   - Dates are YYYY-MM-DD. Times are 24-hour IST, e.g. "19:00" for 7:00 PM.
   - Use "" for time when an event has no time at all.
   - Keep the quotes and commas exactly as they are.
   ========================================================================== */
window.WEDDING = {
  couple: {
    groom: { name: "Manish", city: "Dehradun, Uttarakhand" },
    bride: { name: "Alivia", city: "Kolkata, West Bengal" },
  },

  hero: {
    // Landing-page background photo. Leave src as "" to show the illustrated hills.
    // Best: a wide, landscape photo with calm space on the left, e.g. "images/photos/hero.jpg".
    photo: { src: "images/photos/hero.jpg", mobile: "images/photos/hero-mobile.jpg", alt: "Manish and Alivia by the Hooghly with Howrah Bridge behind them" },
    eyebrow: "Where the hills meet Bengal",
    countdownTo: "2027-01-23T19:00:00+05:30",
    hashtag: "TODO", // e.g. "#ManishWedsAlivia"
    greetingHindi: "शुभ विवाह",
    greetingBengali: "শুভ বিবাহ",
    invitation: "Two families, from the Garhwal hills and from Bengal, invite you to celebrate with us.",
  },

  // Google Apps Script backend. See SETUP.md.
  // This page is public, so the token only keeps out casual bots.
  backend: {
    url: "https://script.google.com/macros/s/AKfycbwHmkY1pYDVzyekiUZ6QU5bv18Tg2yhdalp3JEw16MOiUmnSz0IX4DCuOH4dBV2h00diw/exec",
    token: "d910dc97082e4756bc61ad5bc89e0463",
  },

  // Section headings: the title is upright and the second line is italic.
  headings: {
    story: { label: "Our Story", title: "It began at", italic: "IIT Bombay." },
    events: { label: "The Celebrations", title: "Two days", italic: "to celebrate.", intro: "All times are in IST." },
    gallery: { label: "Little Moments", title: "A few of", italic: "our favourites." },
    venues: { label: "The Places", title: "Where we'll", italic: "gather." },
    travel: { label: "Travel & Stay", title: "Two cities,", italic: "one celebration." },
    rsvp: { label: "Kindly RSVP", title: "Say you'll", italic: "be there." },
    contacts: { label: "Contacts", title: "We're here", italic: "to help." },
    places: { label: "While You're Here", title: "Stay a little,", italic: "explore a little." },
    weather: { label: "Weather", title: "Check the", italic: "skies.", intro: "Forecasts come directly from the India Meteorological Department (IMD), which publishes seven days ahead." },
    faq: { label: "Good to Know", title: "Before", italic: "you pack." },
  },

  // Our Story is hidden until you add a paragraph or a photo.
  // photos: [{ src: "images/photos/us.jpg", alt: "Manish and Alivia in Mussoorie", caption: "Mussoorie, 2024" }]
  story: {
    paragraphs: [
      "We met at IIT Bombay, where Manish was doing his PhD and Alivia her Master's in Design.",
      "From that campus, our story has wandered through concerts, hill roads and long rides. Now it brings our two homes together, the Garhwal hills and Bengal.",
    ],
    photos: [
      { src: "images/photos/iit-bombay.jpg", alt: "Manish and Alivia with an IIT Bombay stole", caption: "IIT Bombay, where it all began" },
      { src: "images/photos/first-meet.jpg", alt: "Alivia standing beneath a large tree on a campus road", caption: "Where we first met" },
    ],
  },

  // The photo gallery is hidden until you add at least one photo (same format as above).
  gallery: [
    { src: "images/photos/before-proposal.jpg", alt: "Manish and Alivia smiling together outdoors" },
    { src: "images/photos/after-proposal.jpg", alt: "Alivia showing her ring beside Manish on a boat at night" },
    { src: "images/photos/dehradun.jpg", alt: "Manish and Alivia with green hills behind them" },
    { src: "images/photos/concert.jpg", alt: "Manish and Alivia at an outdoor concert ground" },
    { src: "images/photos/bike.jpg", alt: "Alivia beside a motorcycle near a lake" },
    { src: "images/photos/himalayan.jpg", alt: "Manish and Alivia walking a hill path in red" },
    { src: "images/photos/together.jpg", alt: "Manish lifting Alivia in a blue sari among trees" },
    { src: "images/photos/lake.jpg", alt: "Manish and Alivia beside a lake under cloudy skies" },
    { src: "images/photos/colours.jpg", alt: "Manish and Alivia in sunglasses among colourful painted panels" },
  ],

  venues: {
    utalika: {
      name: "Utalika ~ The Condoville",
      city: "Kolkata",
      address: "TODO",
      mapUrl: "https://maps.app.goo.gl/3J1Gw5zXvWfZr61z9",
      embedUrl: "https://www.google.com/maps?q=22.4931013,88.4030684&z=15&output=embed",
    },
    swayambhu: {
      name: "Swayambhu Estate",
      city: "Dehradun",
      address: "TODO",
      mapUrl: "https://maps.app.goo.gl/ZpRoSwmcXQmHfBm1A",
      embedUrl: "https://www.google.com/maps?q=30.3030889,78.095255&z=15&output=embed",
    },
  },

  /* venue: a key from venues above, plain text, "TODO", or "" for none.
     venueHint: the city shown while venue is still "TODO".
     rsvp: false keeps travel milestones out of the RSVP and photo lists.
     music: true adds the dhol-damau and shehnai illustration.
     show: false hides an event everywhere. Delete it to bring the event back. */
  events: [
    { id: "arrivals", show: false, date: "2027-01-18", title: "Guests start arriving", time: "", venue: "TODO", venueHint: "Dehradun", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "sundarkand", show: false, date: "2027-01-19", title: "Sundar Kand Pooja", time: "TODO", durationHours: 3, venue: "TODO", venueHint: "Dehradun", dressCode: "TODO", sides: ["groom"] },
    { id: "depart", show: false, date: "2027-01-20", title: "Depart Dehradun → Kolkata", time: "TODO", durationHours: 1, venue: "TODO", venueHint: "Dehradun station/airport", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "arrive", show: false, date: "2027-01-22", title: "Arrive Kolkata (morning)", time: "", venue: "", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "sursandhya", show: false, date: "2027-01-22", title: "Sur Sandhya – musical night", time: "TODO", durationHours: 3, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"], music: true },
    { id: "haldi", show: false, date: "2027-01-23", title: "Haldi", time: "TODO", durationHours: 2, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"] },
    { id: "baraat", show: false, date: "2027-01-23", title: "Baraat departs", time: "15:00", durationHours: 2, venue: "TODO", dressCode: "TODO", sides: ["groom"], music: true },
    { id: "wedding", date: "2027-01-23", title: "Wedding rituals", time: "19:00", durationHours: 4, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"] },
    { id: "reception", date: "2027-01-27", title: "Reception", time: "19:00", durationHours: 3, venue: "swayambhu", dressCode: "TODO", sides: ["groom", "bride"] },
  ],

  travel: {
    groomPlanTitle: "Your January dates",
    groomPlan: [
      { when: "Sat 23 Jan", what: "Wedding at Utalika ~ The Condoville, Kolkata" },
      { when: "Wed 27 Jan", what: "Reception at Swayambhu Estate, Dehradun" },
    ],
    groomPlanNote: "TODO", // train/flight number, meeting point, return plan
    // { name: "", city: "", sides: ["groom"], address: "", phone: "", mapUrl: "", note: "" }
    hotels: [],
  },

  // Each place gets a Google Maps link built from its name.
  places: [
    { city: "Kolkata", items: [
      { name: "Victoria Memorial", note: "The city's marble landmark, with a museum and gardens." },
      { name: "Howrah Bridge and Mullick Ghat Flower Market", note: "Best early in the morning, when the market is in full colour." },
      { name: "Dakshineswar Kali Temple", note: "A revered riverside temple on the Hooghly." },
      { name: "Kumartuli, Kolkata", label: "Kumartuli", note: "The potters' quarter where Durga idols are made by hand." },
      { name: "Indian Museum, Kolkata", label: "Indian Museum", note: "India's oldest museum, in the heart of the city." },
      { name: "Park Street, Kolkata", label: "Park Street", note: "Classic restaurants, bakeries and old Kolkata charm." },
    ] },
    { city: "Dehradun", items: [
      { name: "Forest Research Institute, Dehradun", label: "Forest Research Institute", note: "A grand colonial-era campus set in wide green grounds." },
      { name: "Robber's Cave, Dehradun", label: "Robber's Cave (Guchhupani)", note: "A narrow gorge with a stream running through it. The water is cold in January." },
      { name: "Tapkeshwar Mahadev Temple, Dehradun", label: "Tapkeshwar Mahadev Temple", note: "A Shiva cave temple beside a small river." },
      { name: "Mindrolling Monastery, Dehradun", label: "Mindrolling Monastery", note: "A peaceful Tibetan Buddhist monastery with a towering stupa." },
      { name: "Sahastradhara, Dehradun", label: "Sahastradhara", note: "Limestone springs and waterfalls just outside the city." },
      { name: "Mussoorie", note: "The hill station above Dehradun, about an hour's drive away." },
    ] },
  ],

  // IMD does not allow its forecast to be embedded, so these open its official page.
  weather: {
    url: "https://city.imd.gov.in/citywx/responsive/",
    cities: [
      { city: "Kolkata", when: "Wedding · 23 January", typical: "14–26°C", steps: "West Bengal, then Kolkata" },
      { city: "Dehradun", when: "Reception · 27 January", typical: "5–20°C", steps: "Uttrakhand, then Dehradun" },
    ],
  },

  rsvp: {
    closesAt: "TODO", // e.g. "2026-12-31T23:59:00+05:30"
    maxGuests: 10,
    foodOptions: ["Vegetarian", "Jain", "Non-vegetarian"],
  },

  photos: {
    limitPerGuest: 5,
    maxLongEdge: 2000,
    jpegQuality: 0.82,
  },

  // Phone numbers: country code + number, digits only, e.g. "919876543210".
  contacts: {
    groom: [
      { name: "TODO", role: "TODO", phone: "TODO" },
    ],
    bride: [
      { name: "TODO", role: "TODO", phone: "TODO" },
    ],
  },

  faq: [
    { q: "What will the weather be like in Kolkata?", a: "January is Kolkata's pleasant winter season, typically about 14–26°C. Days are mild and evenings are cool, so a light shawl or jacket is enough." },
    { q: "What will the weather be like in Dehradun?", a: "January in Dehradun is properly cold, typically about 5–20°C, with chilly mornings and nights. Please bring a warm coat, sweater and shawl, especially for the evening reception." },
    { q: "What should I wear?", a: "Festive Indian or formal wear is always welcome. Any event-specific dress code appears on its card in the Events section." },
    { q: "How do I share my photos?", a: "Open the Share Photos page or scan the QR code on your table. Each guest can upload up to 5 photos." },
    { q: "Can I change my RSVP?", a: "Yes. Submit the form again with the same phone number and your earlier response will be updated." },
  ],

  site: {
    footer: "With love, Manish & Alivia",
  },
};
