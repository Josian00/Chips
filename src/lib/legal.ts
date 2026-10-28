// Details for the Impressum and Datenschutzerklärung (/impressum/ and
// /datenschutz/). A German site run from Germany usually needs both; see the
// README. Fill these in yourself: the pages show a draft notice, and the
// footer leaves out their links, until `name`, `street`, `city` and `email`
// are set. Nothing here is checked by a lawyer; it is a starting point.
export const legal = {
  // Your full name as the person responsible for the site (§ 5 DDG, § 18 Abs. 2 MStV).
  name: '',
  // A postal address where you can be reached (no P.O. box).
  street: '',
  city: '', // e.g. '10115 Berlin'
  country: 'Deutschland',
  // An email address that you read. A phone number or contact form is optional.
  email: '',
  phone: '',
  // When the privacy policy was last updated (YYYY-MM-DD).
  updated: '2026-10-28',
};

export const legalReady = [legal.name, legal.street, legal.city, legal.email].every((value) => value.trim() !== '');
