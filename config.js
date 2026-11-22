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
    countdownTo: "2027-01-23T19:00:00+05:30",
    dateLabel: "Saturday, 23 January 2027",
    placeLabel: "Kolkata",
    hashtag: "TODO", // e.g. "#ManishWedsAlivia"
    greetingHindi: "शुभ विवाह",
    greetingBengali: "শুভ বিবাহ",
    invitation: "Two families, from the Garhwal hills and from Bengal, invite you to celebrate with us.",
  },

  // Google Apps Script backend. See SETUP.md.
  // This page is public, so the token only keeps out casual bots.
  backend: {
    url: "TODO", // https://script.google.com/macros/s/.../exec
    token: "TODO", // printed by the setup() function
  },

  // Our Story is hidden until you add at least one paragraph.
  // Photos are optional: put files in images/ and list them, e.g.
  // photos: [{ src: "images/us.jpg", alt: "Manish and Alivia in Mussoorie" }]
  story: {
    paragraphs: [
      // "TODO: how you met...",
    ],
    photos: [],
  },

  venues: {
    utalika: {
      name: "Utalika ~ The Condoville",
      city: "Kolkata",
      address: "TODO",
      mapUrl: "TODO", // Google Maps > Share > Copy link
      embedUrl: "TODO", // Google Maps > Share > Embed a map > copy only the src="..." URL
    },
    swayambhu: {
      name: "Swayambhu Estate",
      city: "Dehradun",
      address: "TODO",
      mapUrl: "TODO",
      embedUrl: "TODO",
    },
  },

  /* venue: a key from venues above, plain text, "TODO", or "" for none.
     venueHint: the city shown while venue is still "TODO".
     rsvp: false keeps travel milestones out of the RSVP and photo lists.
     music: true adds the dhol-damau and shehnai illustration. */
  events: [
    { id: "arrivals", date: "2027-01-18", title: "Guests start arriving", time: "", venue: "TODO", venueHint: "Dehradun", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "sundarkand", date: "2027-01-19", title: "Sundar Kand Pooja", time: "TODO", durationHours: 3, venue: "TODO", venueHint: "Dehradun", dressCode: "TODO", sides: ["groom"] },
    { id: "depart", date: "2027-01-20", title: "Depart Dehradun → Kolkata", time: "TODO", durationHours: 1, venue: "TODO", venueHint: "Dehradun station/airport", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "arrive", date: "2027-01-22", title: "Arrive Kolkata (morning)", time: "", venue: "", dressCode: "", sides: ["groom"], rsvp: false },
    { id: "sursandhya", date: "2027-01-22", title: "Sur Sandhya – musical night", time: "TODO", durationHours: 3, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"], music: true },
    { id: "haldi", date: "2027-01-23", title: "Haldi", time: "TODO", durationHours: 2, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"] },
    { id: "baraat", date: "2027-01-23", title: "Baraat departs", time: "15:00", durationHours: 2, venue: "TODO", dressCode: "TODO", sides: ["groom"], music: true },
    { id: "wedding", date: "2027-01-23", title: "Wedding rituals", time: "19:00", durationHours: 4, venue: "utalika", dressCode: "TODO", sides: ["groom", "bride"] },
    { id: "reception", date: "2027-01-27", title: "Reception", time: "TODO", durationHours: 3, venue: "swayambhu", dressCode: "TODO", sides: ["groom", "bride"] },
  ],

  travel: {
    groomPlanTitle: "Dehradun → Kolkata with the groom's family",
    groomPlan: [
      { when: "Mon 18 Jan", what: "Guests start arriving in Dehradun" },
      { when: "Tue 19 Jan", what: "Sundar Kand Pooja in Dehradun" },
      { when: "Wed 20 Jan", what: "The group departs for Kolkata" },
      { when: "Fri 22 Jan", what: "Arrive in Kolkata in the morning, Sur Sandhya in the evening" },
      { when: "Sat 23 Jan", what: "Haldi, Baraat and the wedding" },
      { when: "Wed 27 Jan", what: "Reception at Swayambhu Estate, Dehradun" },
    ],
    groomPlanNote: "TODO", // train/flight number, meeting point, return plan
    // { name: "", city: "", sides: ["groom"], address: "", phone: "", mapUrl: "", note: "" }
    hotels: [],
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
    { q: "What should I wear?", a: "Festive Indian or formal wear is always welcome. Any event-specific dress code appears on its card in the Events section. Comfortable shoes will help during the Baraat." },
    { q: "How do I share my photos?", a: "Open the Share Photos page or scan the QR code on your table. Each guest can upload up to 5 photos." },
    { q: "Can I change my RSVP?", a: "Yes. Submit the form again with the same phone number and your earlier response will be updated." },
  ],

  site: {
    footer: "With love, Manish & Alivia",
  },
};
