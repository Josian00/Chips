// Run with `npm test`. Checks how ingredient lists are read; add a case here
// when you teach src/lib/diet.ts a new word.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dietReasons } from './diet.ts';

const found = (...list: string[]) => dietReasons([list]).found;
const guesses = (...list: string[]) => dietReasons([list]).guesses.map((guess) => guess.like);

test('plain crisps have nothing to flag', () => {
  assert.deepEqual(found('Potatoes', 'Vegetable Oil (Sunflower, Rapeseed)', 'Salt', 'Sugar', 'Yeast Extract', 'Citric Acid'), []);
  assert.deepEqual(guesses('Mango', 'Button Mushroom', 'Batter', 'Chickpea Flour', 'Turmeric', 'Scallion', 'Maltodextrin'), []);
});

test('case, accents, plurals and spelling variants', () => {
  assert.deepEqual(found('EGGS'), ['egg']);
  assert.deepEqual(found('Cheeses'), ['milk', 'rennet']);
  assert.deepEqual(found('Natural Flavor'), ['flavouring']);
  assert.deepEqual(found('crème fraîche'), ['milk']);
});

test('E numbers in any form', () => {
  for (const spelling of ['E471', 'E 471', 'E-471', 'e471(i)', 'INS 471']) assert.deepEqual(found(spelling), ['additive'], spelling);
  assert.deepEqual(found('Colour: E 120'), ['animal']);
});

test('abbreviations', () => {
  assert.deepEqual(found('SMP'), ['milk']);
  assert.deepEqual(found('WPC'), ['milk', 'rennet']);
  assert.deepEqual(found('Nat. flav.'), ['flavouring']);
});

test('German and compound words', () => {
  assert.deepEqual(found('Magermilchpulver'), ['milk']);
  assert.deepEqual(found('Käsepulver'), ['milk', 'rennet']);
  assert.deepEqual(found('Hähnchenfleisch'), ['animal']);
  assert.deepEqual(found('Hühnereiweiß'), ['egg']);
  assert.deepEqual(found('Kartoffeln', 'Sonnenblumenöl', 'Speisesalz', 'Zimtrinde', 'Knoblauchpulver'), []);
});

test('plant names and qualifiers do not count', () => {
  assert.deepEqual(found('Cocoa Butter', 'Coconut Milk', 'Peanut Butter', 'Lactic Acid', 'Milchsäure', 'Kakaobutter'), []);
  assert.deepEqual(found('Vegan cheese', 'Dairy-free chocolate', 'Plant-based milk'), []);
  assert.deepEqual(found('Salt. May contain milk and egg.'), []);
});

test('vegetarian rennet clears cheese', () => {
  assert.deepEqual(found('Cheese (microbial rennet)'), ['milk']);
});

test('typos are flagged, not trusted', () => {
  assert.deepEqual(found('Chese powder'), []);
  assert.deepEqual(guesses('Chese powder'), ['cheese']);
  assert.deepEqual(guesses('nat. flavourng'), ['flavouring']);
  assert.deepEqual(guesses('mlik'), ['milk']);
});
