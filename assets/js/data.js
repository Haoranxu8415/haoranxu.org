/**
 * data.js — single source of truth for haoranxu.org
 *
 * To add a new Work:  push an entry to WORKS (newest first)
 * To add a new Note:  push an entry to POSTS — timeline, cards,
 *                     and home preview all update automatically.
 *
 * WORKS fields:
 *   title   Display title
 *   tag     Category label  e.g. "Design · Web"
 *   date    ISO date for sorting  e.g. "2025-03-01"
 *   href    Path from site root   e.g. "works/algorithm-mirror.html"
 *
 * POSTS fields:
 *   id      Anchor id used on notes.html  e.g. "post-1"
 *   file    Path to .md file from root    e.g. "posts/post1.md"
 *   title   Display title
 *   date    ISO date  e.g. "2025-07-06"
 *   tags    Tag string shown in meta row
 */

const WORKS = [
  {
    title: 'Visual Dark Patterns &amp; AI Decision-Making',
    tag:   'Research · LLM',
    date:  '2026-01-01',
    href:  'works/dark-patterns.html',
  },
  {
    title: 'Information Bubbles',
    tag:   'Design · Web',
    date:  '2025-01-01',
    href:  'works/algorithm-mirror.html',
  },
  {
    title: 'WYEF · Shadow Walker',
    tag:   'Business · Design',
    date:  '2024-01-01',
    href:  'works/wyef-shadow-walker.html',
  },
  {
    title: "A Winter's Light",
    tag:   'Photography',
    date:  '2023-01-01',
    href:  'works/kexue-island.html',
  },
];

const POSTS = [
  {
    id:    'post-1',
    file:  'posts/post1.md',
    title: 'The Day I Fell in Love with Claymation',
    date:  '2025-07-06',
    tags:  'Creativity · Animation · Storytelling',
  },
  {
    id:    'post-2',
    file:  'posts/post2.md',
    title: "What Social Media Algorithms Don't Show You",
    date:  '2025-07-12',
    tags:  'Psychology · Media · Identity',
  },
  {
    id:    'post-3',
    file:  'posts/post3.md',
    title: 'Why I Started Designing My Own Website',
    date:  '2025-07-19',
    tags:  'Design · Personal Reflection · Web Development',
  },
];
