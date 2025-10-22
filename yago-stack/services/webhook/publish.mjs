import fetch from 'node-fetch';
import path from 'node:path';
import fs from 'node:fs/promises';
import { saveMeetupOG } from './og-gen.mjs';
import { buildCaption } from './utils/social-caption.mjs';

const N8N = process.env.N8N_URL || '';
const SOCIAL_HOOK = process.env.N8N_SOCIAL_WEBHOOK || '/webhook/social-publish';
const SITES_HOOK = process.env.N8N_SITES_WEBHOOK || '/webhook/google-sites-publish';

export async function publishMeetup({ meetup, channels = ['x', 'instagram', 'naverblog'], when = 'now' }) {
  const link = `${process.env.SITE_BASE}/r/m/${meetup.id}?s=${(channels[0] || 'social')}&m=social&c=og`;
  const images = await saveMeetupOG(meetup, { variants: ['main'], linkUrl: link });
  const caption = buildCaption({ meetup, link, extraTags: meetup.tags || [] });

  const payload = { meetupId: meetup.id, caption, images, channels, when };
  const r = await fetch(N8N + SOCIAL_HOOK, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  });
  const ok = r.ok; 
  const resp = ok ? await r.json().catch(() => ({})) : { error: await r.text().catch(() => 'fail') };
  return { ok, resp, payload };
}

export async function publishGoogleSites({ meetup }) {
  const link = `${process.env.SITE_BASE}/meetups/${meetup.id}`;
  const blocks = [
    { type: 'h1', text: meetup.title },
    { type: 'p', text: (meetup.subtitle || '') + ' · ' + (meetup.dateText || '') },
    { type: 'img', src: `${process.env.SITE_BASE}/og/meetups/${meetup.id}/main.png` },
    { type: 'p', text: link }
  ];
  const payload = { meetupId: meetup.id, title: meetup.title, blocks };
  const r = await fetch(N8N + SITES_HOOK, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  });
  return { ok: r.ok };
}
